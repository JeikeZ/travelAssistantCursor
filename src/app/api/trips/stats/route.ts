import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import { createAuthenticatedResponse } from '@/lib/api-utils'
import type { TripStatistics, Trip } from '@/types'

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

// GET /api/trips/stats - Get user trip statistics
export async function GET() {
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
        { error: 'Guest users cannot access trip statistics' },
        { status: 403 }
      )
    }

    // Fetch all trips for the user
    const { data: trips, error } = await supabaseServer
      .from('trips')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching trips for stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trip statistics' },
        { status: 500 }
      )
    }

    const allTrips = trips as Trip[]

    // Calculate statistics
    const totalTrips = allTrips.length
    const completedTrips = allTrips.filter(t => t.status === 'completed').length
    const activeTrips = allTrips.filter(t => t.status === 'active').length
    const archivedTrips = allTrips.filter(t => t.status === 'archived').length

    // Count unique countries and cities
    const uniqueCountries = new Set(allTrips.map(t => t.destination_country))
    const uniqueCities = new Set(allTrips.map(t => `${t.destination_city}, ${t.destination_country}`))

    // Calculate most visited destinations
    const destinationCounts: Record<string, number> = {}
    allTrips.forEach(trip => {
      const destination = `${trip.destination_city}, ${trip.destination_country}`
      destinationCounts[destination] = (destinationCounts[destination] || 0) + 1
    })

    const mostVisitedDestinations = Object.entries(destinationCounts)
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 destinations

    // Get favorite trips
    const favoriteTrips = allTrips
      .filter(t => t.is_favorite)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5) // Top 5 favorite trips

    const statistics: TripStatistics = {
      totalTrips,
      completedTrips,
      activeTrips,
      archivedTrips,
      totalCountriesVisited: uniqueCountries.size,
      totalCitiesVisited: uniqueCities.size,
      mostVisitedDestinations,
      favoriteTrips,
    }

    return createAuthenticatedResponse(statistics)
  } catch (error) {
    console.error('Error in GET /api/trips/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
