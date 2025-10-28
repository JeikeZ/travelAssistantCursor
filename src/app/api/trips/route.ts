import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import { createAuthenticatedResponse } from '@/lib/api-utils'
import type { CreateTripRequest, Trip } from '@/types'

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

// POST /api/trips - Create new trip
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.is_guest) {
      return NextResponse.json(
        { success: false, error: 'Guest users cannot save trips. Please create an account.' },
        { status: 403 }
      )
    }

    const body: CreateTripRequest = await request.json()

    // Validate required fields
    if (!body.destinationCountry || !body.destinationCity || !body.duration || !body.tripType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate duration
    if (body.duration < 1 || body.duration > 365) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 1 and 365 days' },
        { status: 400 }
      )
    }

    // Insert trip into database
    const { data: trip, error } = await supabaseServer
      .from('trips')
      .insert({
        user_id: user.id,
        destination_country: body.destinationCountry,
        destination_city: body.destinationCity,
        destination_state: body.destinationState || null,
        destination_display_name: body.destinationDisplayName || null,
        duration: body.duration,
        trip_type: body.tripType,
        start_date: body.startDate || null,
        end_date: body.endDate || null,
        notes: body.notes || null,
        status: 'active',
        completion_percentage: 0,
        is_favorite: false,
      } as never)
      .select()
      .single()

    if (error) {
      console.error('Error creating trip:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create trip' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      success: true,
      trip: trip as Trip,
    })

    // Ensure no public caching of user-specific data
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Vary', 'Cookie')

    return response
  } catch (error) {
    console.error('Error in POST /api/trips:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/trips - Get user's trips
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.is_guest) {
      return NextResponse.json(
        { error: 'Guest users cannot access trip history' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    let query = supabaseServer
      .from('trips')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: trips, error, count } = await query

    if (error) {
      console.error('Error fetching trips:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trips' },
        { status: 500 }
      )
    }

    const total = count || 0
    const hasMore = offset + limit < total

    const response = NextResponse.json({
      trips: trips as Trip[],
      total,
      hasMore,
    })

    // Ensure no public caching of user-specific data
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Vary', 'Cookie')

    return response
  } catch (error) {
    console.error('Error in GET /api/trips:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
