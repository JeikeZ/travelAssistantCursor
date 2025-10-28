import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import type { Trip, DuplicateTripRequest } from '@/types'

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

    // Type cast for originalTrip due to Supabase type inference issue
    const typedTrip = originalTrip as unknown as Trip

    // Create new trip with same details
    const { data: newTrip, error: createError } = await supabaseServer
      .from('trips')
      .insert({
        user_id: user.id,
        destination_country: typedTrip.destination_country,
        destination_city: typedTrip.destination_city,
        destination_state: typedTrip.destination_state,
        destination_display_name: typedTrip.destination_display_name,
        duration: typedTrip.duration,
        trip_type: typedTrip.trip_type,
        start_date: body.newStartDate || null,
        end_date: body.newEndDate || null,
        notes: typedTrip.notes,
        status: 'active',
        completion_percentage: 0,
        is_favorite: false,
      } as never)
      .select()
      .single()

    if (createError || !newTrip) {
      console.error('Error creating duplicate trip:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to create duplicate trip' },
        { status: 500 }
      )
    }

    // Type cast for newTrip due to Supabase type inference issue
    const typedNewTrip = newTrip as unknown as Trip

    // Fetch original packing items
    const { data: originalItems, error: itemsError } = await supabaseServer
      .from('packing_items')
      .select('*')
      .eq('trip_id', id)

    if (itemsError) {
      console.error('Error fetching original packing items:', itemsError)
      // Return the trip even if items fail - user can add items later
      const response = NextResponse.json({
        success: true,
        newTrip: typedNewTrip,
      })

      // Ensure no public caching of user-specific data
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
      response.headers.set('Vary', 'Cookie')

      return response
    }

    // Type cast for originalItems
    type PackingItem = {
      id: string
      trip_id: string
      name: string
      category: string
      essential: boolean
      packed: boolean
      custom: boolean
      quantity: number
      notes: string | null
    }
    const typedOriginalItems = originalItems as unknown as PackingItem[]

    // Copy packing items (reset packed status)
    if (typedOriginalItems && typedOriginalItems.length > 0) {
      const itemsToInsert = typedOriginalItems.map(item => ({
        trip_id: typedNewTrip.id,
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
        .insert(itemsToInsert as never)

      if (insertItemsError) {
        console.error('Error copying packing items:', insertItemsError)
        // Return the trip even if items fail - user can add items later
      }
    }

    const response = NextResponse.json({
      success: true,
      newTrip: typedNewTrip,
    })

    // Ensure no public caching of user-specific data
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Vary', 'Cookie')

    return response
  } catch (error) {
    console.error('Error in POST /api/trips/[id]/duplicate:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
