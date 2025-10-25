import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import type { Trip, PackingItemDb, UpdateTripRequest } from '@/types'

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

// GET /api/trips/[id] - Get trip details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(id, user.id)
    if (!ownsTrip) {
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch trip details
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Fetch packing items
    const { data: packingItems, error: itemsError } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', id)
      .order('category', { ascending: true })

    if (itemsError) {
      console.error('Error fetching packing items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch packing items' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const items = packingItems || []
    const totalItems = items.length
    const packedItems = items.filter(item => item.packed).length
    const completionPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0

    return NextResponse.json({
      trip: trip as Trip,
      packingItems: items as PackingItemDb[],
      statistics: {
        totalItems,
        packedItems,
        completionPercentage,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/trips/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/trips/[id] - Update trip
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(id, user.id)
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found or access denied' },
        { status: 404 }
      )
    }

    const body: UpdateTripRequest = await request.json()

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.status !== undefined) {
      updateData.status = body.status
      // If status changed to completed, set completed_at
      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
    }

    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.isFavorite !== undefined) updateData.is_favorite = body.isFavorite
    if (body.completionPercentage !== undefined) updateData.completion_percentage = body.completionPercentage
    if (body.startDate !== undefined) updateData.start_date = body.startDate
    if (body.endDate !== undefined) updateData.end_date = body.endDate

    // Update trip in database
    const { data: trip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating trip:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update trip' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trip: trip as Trip,
    })
  } catch (error) {
    console.error('Error in PUT /api/trips/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/trips/[id] - Delete trip
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(id, user.id)
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found or access denied' },
        { status: 404 }
      )
    }

    // Delete trip (cascade will delete packing items)
    const { error } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting trip:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete trip' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error in DELETE /api/trips/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
