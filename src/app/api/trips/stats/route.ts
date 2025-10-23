import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import { TripStatsResponse, TripStats } from '@/types'

/**
 * GET /api/trips/stats
 * Get user's trip statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    // Fetch all user trips
    const { data: trips, error } = await supabase
      .from('trips')
      .select('id, status, destination_country, destination_city, destination_display_name')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching trips for stats:', error)
      return errorResponse('Failed to fetch statistics', 500)
    }

    const allTrips = trips || []

    // Calculate statistics
    const totalTrips = allTrips.length
    const completedTrips = allTrips.filter(t => t.status === 'completed').length
    const activeTrips = allTrips.filter(t => t.status === 'active').length
    const archivedTrips = allTrips.filter(t => t.status === 'archived').length

    // Count unique countries
    const uniqueCountries = new Set(allTrips.map(t => t.destination_country))
    const totalCountriesVisited = uniqueCountries.size

    // Count unique cities
    const uniqueCities = new Set(
      allTrips.map(t => `${t.destination_city}, ${t.destination_country}`)
    )
    const totalCitiesVisited = uniqueCities.size

    // Calculate most visited destinations
    const destinationCounts = new Map<string, number>()
    allTrips.forEach(trip => {
      const destination = trip.destination_display_name || `${trip.destination_city}, ${trip.destination_country}`
      destinationCounts.set(destination, (destinationCounts.get(destination) || 0) + 1)
    })

    const mostVisitedDestinations = Array.from(destinationCounts.entries())
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5

    const stats: TripStats = {
      totalTrips,
      completedTrips,
      activeTrips,
      archivedTrips,
      totalCountriesVisited,
      totalCitiesVisited,
      mostVisitedDestinations,
    }

    return successResponse<TripStatsResponse>({ stats })
  } catch (error) {
    console.error('Error calculating trip stats:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}
