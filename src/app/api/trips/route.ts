import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import { CreateTripRequest, TripsListResponse, TripResponse, TripFilters } from '@/types'

/**
 * POST /api/trips
 * Create a new trip
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult // Return error response
    }
    const user = authResult

    // Parse request body
    const body: CreateTripRequest = await request.json()
    const {
      destinationCountry,
      destinationCity,
      destinationState,
      destinationDisplayName,
      duration,
      tripType,
      startDate,
      endDate,
      notes,
    } = body

    // Validate required fields
    if (!destinationCountry || !destinationCity || !duration || !tripType) {
      return errorResponse('Missing required fields: destinationCountry, destinationCity, duration, tripType', 400)
    }

    // Validate duration
    if (duration < 1 || duration > 365) {
      return errorResponse('Duration must be between 1 and 365 days', 400)
    }

    // Create trip in database
    const { data: trip, error } = await supabase
      .from('trips')
      .insert([
        {
          user_id: user.id,
          destination_country: destinationCountry,
          destination_city: destinationCity,
          destination_state: destinationState || null,
          destination_display_name: destinationDisplayName || `${destinationCity}, ${destinationCountry}`,
          duration,
          trip_type: tripType,
          start_date: startDate || null,
          end_date: endDate || null,
          notes: notes || null,
          status: 'active',
          completion_percentage: 0,
          is_favorite: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating trip:', error)
      return errorResponse('Failed to create trip. Please try again.', 500)
    }

    return successResponse<TripResponse>({ trip }, 201)
  } catch (error) {
    console.error('Trip creation error:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}

/**
 * GET /api/trips
 * Get list of user's trips with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters: TripFilters = {
      status: (searchParams.get('status') as TripFilters['status']) || 'all',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as TripFilters['sortBy']) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as TripFilters['sortOrder']) || 'desc',
      search: searchParams.get('search') || undefined,
    }

    // Build query
    let query = supabase
      .from('trips')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(
        `destination_city.ilike.%${filters.search}%,destination_country.ilike.%${filters.search}%,destination_display_name.ilike.%${filters.search}%`
      )
    }

    // Apply sorting
    query = query.order(filters.sortBy || 'created_at', { 
      ascending: filters.sortOrder === 'asc' 
    })

    // Apply pagination
    query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1)

    // Execute query
    const { data: trips, error, count } = await query

    if (error) {
      console.error('Error fetching trips:', error)
      return errorResponse('Failed to fetch trips', 500)
    }

    return successResponse<TripsListResponse>({
      trips: trips || [],
      total: count || 0,
      hasMore: (count || 0) > (filters.offset || 0) + (filters.limit || 50),
    })
  } catch (error) {
    console.error('Trip fetch error:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}
