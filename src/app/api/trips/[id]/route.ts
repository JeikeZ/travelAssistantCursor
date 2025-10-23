import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, verifyTripOwnership, errorResponse, successResponse } from '@/lib/api-auth'
import { TripDetailResponse, TripResponse, UpdateTripRequest } from '@/types'

/**
 * GET /api/trips/[id]
 * Get a specific trip with all packing items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const tripId = params.id

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return errorResponse('Trip not found or access denied', 404)
    }

    // Fetch trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return errorResponse('Trip not found', 404)
    }

    // Fetch packing items
    const { data: packingItems, error: itemsError } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('category', { ascending: true })
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Error fetching packing items:', itemsError)
    }

    // Calculate statistics
    const totalItems = packingItems?.length || 0
    const packedItems = packingItems?.filter(item => item.packed).length || 0
    const completionPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0

    return successResponse<TripDetailResponse>({
      trip,
      packingItems: packingItems || [],
      statistics: {
        totalItems,
        packedItems,
        completionPercentage,
      },
    })
  } catch (error) {
    console.error('Error fetching trip:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}

/**
 * PUT /api/trips/[id]
 * Update a trip
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const tripId = params.id

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return errorResponse('Trip not found or access denied', 404)
    }

    // Parse request body
    const body: UpdateTripRequest = await request.json()
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Add allowed fields to updates
    if (body.status !== undefined) {
      updates.status = body.status
      if (body.status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }
    }
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.is_favorite !== undefined) updates.is_favorite = body.is_favorite
    if (body.completion_percentage !== undefined) updates.completion_percentage = body.completion_percentage
    if (body.start_date !== undefined) updates.start_date = body.start_date
    if (body.end_date !== undefined) updates.end_date = body.end_date

    // Update trip
    const { data: trip, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single()

    if (error) {
      console.error('Error updating trip:', error)
      return errorResponse('Failed to update trip', 500)
    }

    return successResponse<TripResponse>({ trip })
  } catch (error) {
    console.error('Error updating trip:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}

/**
 * DELETE /api/trips/[id]
 * Delete a trip (cascade deletes packing items)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const tripId = params.id

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return errorResponse('Trip not found or access denied', 404)
    }

    // Delete trip (cascade deletes packing items due to ON DELETE CASCADE)
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (error) {
      console.error('Error deleting trip:', error)
      return errorResponse('Failed to delete trip', 500)
    }

    return successResponse({ message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}
