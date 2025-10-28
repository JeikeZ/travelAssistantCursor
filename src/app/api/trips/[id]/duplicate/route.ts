import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import type { Trip, DuplicateTripRequest } from '@/types'

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

  return trip?.user_id === userId
}

// POST /api/trips/[id]/duplicate - Duplicate trip
export async function POST(
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

    const body: DuplicateTripRequest = await request.json()

    // Fetch original trip
    const { data: originalTrip, error: tripError } = await supabaseServer
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()

    if (tripError || !originalTrip) {
      return NextResponse.json(
        { success: false, error: 'Original trip not found' },
        { status: 404 }
      )
    }

    // Create new trip with same details
    const { data: newTrip, error: createError } = await supabaseServer
      .from('trips')
      .insert({
        user_id: user.id,
        destination_country: originalTrip.destination_country,
        destination_city: originalTrip.destination_city,
        destination_state: originalTrip.destination_state,
        destination_display_name: originalTrip.destination_display_name,
        duration: originalTrip.duration,
        trip_type: originalTrip.trip_type,
        start_date: body.newStartDate || null,
        end_date: body.newEndDate || null,
        notes: originalTrip.notes,
        status: 'active',
        completion_percentage: 0,
        is_favorite: false,
      })
      .select()
      .single()

    if (createError || !newTrip) {
      console.error('Error creating duplicate trip:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to create duplicate trip' },
        { status: 500 }
      )
    }

    // Fetch original packing items
    const { data: originalItems, error: itemsError } = await supabaseServer
      .from('packing_items')
      .select('*')
      .eq('trip_id', id)

    if (itemsError) {
      console.error('Error fetching original packing items:', itemsError)
      // Return the trip even if items fail - user can add items later
      return NextResponse.json({
        success: true,
        newTrip: newTrip as Trip,
      })
    }

    // Copy packing items (reset packed status)
    if (originalItems && originalItems.length > 0) {
      const itemsToInsert = originalItems.map(item => ({
        trip_id: newTrip.id,
        name: item.name,
        category: item.category,
        essential: item.essential,
        packed: false, // Reset packed status
        custom: item.custom,
        quantity: item.quantity,
        notes: item.notes,
      }))

      const { error: insertItemsError } = await supabaseServer
        .from('packing_items')
        .insert(itemsToInsert)

      if (insertItemsError) {
        console.error('Error copying packing items:', insertItemsError)
        // Return the trip even if items fail - user can add items later
      }
    }

    return NextResponse.json({
      success: true,
      newTrip: newTrip as Trip,
    })
  } catch (error) {
    console.error('Error in POST /api/trips/[id]/duplicate:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
