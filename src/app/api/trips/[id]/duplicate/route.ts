import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, verifyTripOwnership, errorResponse, successResponse } from '@/lib/api-auth'
import { TripResponse } from '@/types'

/**
 * POST /api/trips/[id]/duplicate
 * Duplicate a trip with all its packing items
 */
export async function POST(
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

    // Parse optional body (new dates)
    let newStartDate = null
    let newEndDate = null
    try {
      const body = await request.json()
      newStartDate = body.newStartDate || null
      newEndDate = body.newEndDate || null
    } catch {
      // Body is optional
    }

    // Fetch original trip
    const { data: originalTrip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (tripError || !originalTrip) {
      return errorResponse('Trip not found', 404)
    }

    // Create new trip (copy of original)
    const { data: newTrip, error: createError } = await supabase
      .from('trips')
      .insert([
        {
          user_id: user.id,
          destination_country: originalTrip.destination_country,
          destination_city: originalTrip.destination_city,
          destination_state: originalTrip.destination_state,
          destination_display_name: originalTrip.destination_display_name,
          duration: originalTrip.duration,
          trip_type: originalTrip.trip_type,
          start_date: newStartDate || null,
          end_date: newEndDate || null,
          notes: originalTrip.notes,
          status: 'active',
          completion_percentage: 0,
          is_favorite: false,
        },
      ])
      .select()
      .single()

    if (createError || !newTrip) {
      console.error('Error creating duplicate trip:', createError)
      return errorResponse('Failed to duplicate trip', 500)
    }

    // Fetch original packing items
    const { data: originalItems, error: itemsError } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', tripId)

    if (itemsError) {
      console.error('Error fetching original packing items:', itemsError)
      return successResponse<TripResponse>({ trip: newTrip }, 201)
    }

    // Copy packing items (reset packed status)
    if (originalItems && originalItems.length > 0) {
      const newItems = originalItems.map(item => ({
        trip_id: newTrip.id,
        name: item.name,
        category: item.category,
        essential: item.essential,
        packed: false, // Reset packed status
        custom: item.custom,
        quantity: item.quantity,
        notes: item.notes,
      }))

      const { error: insertItemsError } = await supabase
        .from('packing_items')
        .insert(newItems)

      if (insertItemsError) {
        console.error('Error copying packing items:', insertItemsError)
        // Trip was created successfully, so return it even if items failed
      }
    }

    return successResponse<TripResponse>({ trip: newTrip }, 201)
  } catch (error) {
    console.error('Error duplicating trip:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}
