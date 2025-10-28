import { useState, useCallback } from 'react'
import type { Trip, GetTripsQuery, CreateTripRequest } from '@/types'

interface UseTripsReturn {
  trips: Trip[]
  isLoading: boolean
  error: string | null
  total: number
  hasMore: boolean
  fetchTrips: (filters?: GetTripsQuery) => Promise<void>
  createTrip: (tripData: CreateTripRequest) => Promise<Trip | null>
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<boolean>
  deleteTrip: (tripId: string) => Promise<boolean>
  duplicateTrip: (tripId: string, newStartDate?: string, newEndDate?: string) => Promise<Trip | null>
  refreshTrips: () => Promise<void>
}

export function useTrips(initialFilters?: GetTripsQuery): UseTripsReturn {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<GetTripsQuery>(initialFilters || {})

  const fetchTrips = useCallback(async (filters?: GetTripsQuery) => {
    setIsLoading(true)
    setError(null)

    // Use provided filters or default to empty object
    // Don't rely on currentFilters state to avoid recreation loops
    const queryFilters = filters || {}
    
    // Update current filters state if new filters were provided
    if (filters) {
      setCurrentFilters(filters)
    }

    try {
      const params = new URLSearchParams()
      if (queryFilters.status) params.append('status', queryFilters.status)
      if (queryFilters.limit) params.append('limit', queryFilters.limit.toString())
      if (queryFilters.offset) params.append('offset', queryFilters.offset.toString())
      if (queryFilters.sortBy) params.append('sortBy', queryFilters.sortBy)
      if (queryFilters.sortOrder) params.append('sortOrder', queryFilters.sortOrder)

      const response = await fetch(`/api/trips?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch trips')
      }

      const data = await response.json()
      setTrips(data.trips)
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trips'
      setError(errorMessage)
      console.error('Error fetching trips:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createTrip = useCallback(async (tripData: CreateTripRequest): Promise<Trip | null> => {
    setError(null)

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create trip')
      }

      const data = await response.json()
      if (data.success && data.trip) {
        // Refresh trips list
        await fetchTrips()
        return data.trip
      }

      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create trip'
      setError(errorMessage)
      console.error('Error creating trip:', err)
      return null
    }
  }, [fetchTrips])

  const updateTrip = useCallback(async (tripId: string, updates: Partial<Trip>): Promise<boolean> => {
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update trip')
      }

      const data = await response.json()
      if (data.success && data.trip) {
        // Update trip in local state
        setTrips(prevTrips =>
          prevTrips.map(trip => (trip.id === tripId ? data.trip : trip))
        )
        return true
      }

      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trip'
      setError(errorMessage)
      console.error('Error updating trip:', err)
      return false
    }
  }, [])

  const deleteTrip = useCallback(async (tripId: string): Promise<boolean> => {
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete trip')
      }

      const data = await response.json()
      if (data.success) {
        // Remove trip from local state
        setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId))
        setTotal(prev => prev - 1)
        return true
      }

      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete trip'
      setError(errorMessage)
      console.error('Error deleting trip:', err)
      return false
    }
  }, [])

  const duplicateTrip = useCallback(async (
    tripId: string,
    newStartDate?: string,
    newEndDate?: string
  ): Promise<Trip | null> => {
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStartDate, newEndDate }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to duplicate trip')
      }

      const data = await response.json()
      if (data.success && data.newTrip) {
        // Refresh trips list
        await fetchTrips()
        return data.newTrip
      }

      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate trip'
      setError(errorMessage)
      console.error('Error duplicating trip:', err)
      return null
    }
  }, [fetchTrips])

  const refreshTrips = useCallback(async () => {
    await fetchTrips(currentFilters)
  }, [fetchTrips, currentFilters])

  // Note: Initial fetch is handled by the consuming component
  // This allows better control over when and how to fetch trips

  return {
    trips,
    isLoading,
    error,
    total,
    hasMore,
    fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    duplicateTrip,
    refreshTrips,
  }
}
