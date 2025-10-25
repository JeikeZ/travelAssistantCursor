import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import type { PackingItemDb, UpdatePackingItemRequest } from '@/types'

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
  const { data: trip } = await supabaseAdmin
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single()

  return trip?.user_id === userId
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
    const { data: item, error } = await supabaseAdmin
      .from('packing_items')
      .update(updateData)
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
    await supabaseAdmin
      .from('trips')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', tripId)

    // If packed status changed, recalculate completion percentage
    if (body.packed !== undefined) {
      const { data: allItems } = await supabaseAdmin
        .from('packing_items')
        .select('packed')
        .eq('trip_id', tripId)

      if (allItems && allItems.length > 0) {
        const packedCount = allItems.filter(i => i.packed).length
        const completionPercentage = Math.round((packedCount / allItems.length) * 100)
        
        await supabaseAdmin
          .from('trips')
          .update({ completion_percentage: completionPercentage })
          .eq('id', tripId)
      }
    }

    return NextResponse.json({
      success: true,
      item: item as PackingItemDb,
    })
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
    const { error } = await supabaseAdmin
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
    await supabaseAdmin
      .from('trips')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', tripId)

    // Recalculate completion percentage
    const { data: allItems } = await supabaseAdmin
      .from('packing_items')
      .select('packed')
      .eq('trip_id', tripId)

    if (allItems && allItems.length > 0) {
      const packedCount = allItems.filter(i => i.packed).length
      const completionPercentage = Math.round((packedCount / allItems.length) * 100)
      
      await supabaseAdmin
        .from('trips')
        .update({ completion_percentage: completionPercentage })
        .eq('id', tripId)
    } else {
      // No items left, set completion to 0
      await supabaseAdmin
        .from('trips')
        .update({ completion_percentage: 0 })
        .eq('id', tripId)
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error in DELETE /api/trips/[id]/items/[itemId]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
