import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import type { PackingItemDb, UpdatePackingItemRequest } from '@/types'

// Force dynamic rendering - no caching for user-specific data
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper function to get user from session
async function getUserFromSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    return session.user
  } catch {
    return null
  }
}

// Helper function to verify user owns the trip
async function verifyTripOwnership(tripId: string, userId: string): Promise<boolean> {
  const { data: trip } = await supabaseServer
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single()

  return (trip as { user_id: string } | null)?.user_id === userId
}

// PUT /api/trips/[id]/items/[itemId] - Update packing item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: tripId, itemId } = await params
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found or access denied' },
        { status: 404 }
      )
    }

    const body: UpdatePackingItemRequest = await request.json()

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.packed !== undefined) updateData.packed = body.packed
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.category !== undefined) updateData.category = body.category
    if (body.essential !== undefined) updateData.essential = body.essential

    // Update item in database
    const { data: item, error } = await supabaseServer
      .from('packing_items')
      .update(updateData as never)
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .select()
      .single()

    if (error) {
      console.error('Error updating packing item:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update packing item' },
        { status: 500 }
      )
    }

    // Update trip's updated_at timestamp
    await supabaseServer
      .from('trips')
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', tripId)

    // If packed status changed, recalculate completion percentage
    if (body.packed !== undefined) {
      const { data: allItems } = await supabaseServer
        .from('packing_items')
        .select('packed')
        .eq('trip_id', tripId)

      if (allItems && allItems.length > 0) {
        const packedCount = (allItems as { packed: boolean }[]).filter(i => i.packed).length
        const completionPercentage = Math.round((packedCount / allItems.length) * 100)
        
        await supabaseServer
          .from('trips')
          .update({ completion_percentage: completionPercentage } as never)
          .eq('id', tripId)
      }
    }

    const response = NextResponse.json({
      success: true,
      item: item as PackingItemDb,
    })

    // Ensure no public caching of user-specific data
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Vary', 'Cookie')

    return response
  } catch (error) {
    console.error('Error in PUT /api/trips/[id]/items/[itemId]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/trips/[id]/items/[itemId] - Delete packing item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: tripId, itemId } = await params
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found or access denied' },
        { status: 404 }
      )
    }

    // Delete item
    const { error } = await supabaseServer
      .from('packing_items')
      .delete()
      .eq('id', itemId)
      .eq('trip_id', tripId)

    if (error) {
      console.error('Error deleting packing item:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete packing item' },
        { status: 500 }
      )
    }

    // Update trip's updated_at timestamp
    await supabaseServer
      .from('trips')
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', tripId)

    // Recalculate completion percentage
    const { data: allItems } = await supabaseServer
      .from('packing_items')
      .select('packed')
      .eq('trip_id', tripId)

    if (allItems && allItems.length > 0) {
      const packedCount = (allItems as { packed: boolean }[]).filter(i => i.packed).length
      const completionPercentage = Math.round((packedCount / allItems.length) * 100)
      
      await supabaseServer
        .from('trips')
        .update({ completion_percentage: completionPercentage } as never)
        .eq('id', tripId)
    } else {
      // No items left, set completion to 0
      await supabaseServer
        .from('trips')
        .update({ completion_percentage: 0 } as never)
        .eq('id', tripId)
    }

    const response = NextResponse.json({
      success: true,
    })

    // Ensure no public caching of user-specific data
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Vary', 'Cookie')

    return response
  } catch (error) {
    console.error('Error in DELETE /api/trips/[id]/items/[itemId]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
