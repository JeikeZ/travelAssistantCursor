'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTrips } from '@/hooks/useTrips'
import { useTripStats } from '@/hooks/useTripStats'
import { TripCard } from '@/components/trips/TripCard'
import { TripFilters } from '@/components/trips/TripFilters'
import { TripStatistics } from '@/components/trips/TripStatistics'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { cleanupOldPackingListEntries } from '@/lib/utils'
import type { TripFilters as TripFiltersType, SortOptions, User } from '@/types'

export default function TripsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [showStats, setShowStats] = useState(true)
  const [filters, setFilters] = useState<TripFiltersType>({})
  const [sort, setSort] = useState<SortOptions>({ sortBy: 'created_at', sortOrder: 'desc' })
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const {
    trips,
    isLoading: tripsLoading,
    error: tripsError,
    deleteTrip,
    duplicateTrip,
    updateTrip,
    fetchTrips,
  } = useTrips({
    status: filters.status,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    limit: 50,
  })

  const { stats, isLoading: statsLoading } = useTripStats()

  // Get current user from localStorage and cleanup old packing lists
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('user')
      }
    }

    // Clean up old trip-specific packing list entries to prevent localStorage bloat
    // Keeps only the 5 most recent entries
    cleanupOldPackingListEntries(5)
  }, [])

  // Fetch trips on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      fetchTrips({
        status: filters.status,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        limit: 50,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]) // Re-fetch when user changes!

  // Re-fetch trips when filters or sort changes
  useEffect(() => {
    if (currentUser) {
      fetchTrips({
        status: filters.status,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        limit: 50,
      })
    }
    // fetchTrips is intentionally excluded from dependencies to prevent infinite loops
    // The function is stable with empty dependency array in the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, currentUser])

  const handleFilterChange = (newFilters: TripFiltersType) => {
    setFilters(newFilters)
  }

  const handleSortChange = (newSort: SortOptions) => {
    setSort(newSort)
  }

  const handleViewTrip = (tripId: string) => {
    // Navigate to the trip detail page
    // The trip detail page loads all data from the database using the trip ID
    router.push(`/trips/${tripId}`)
  }

  const handleDuplicateTrip = async (tripId: string) => {
    const confirmed = window.confirm('Duplicate this trip? All packing items will be copied.')
    if (!confirmed) return

    const newTrip = await duplicateTrip(tripId)
    if (newTrip) {
      addToast({ title: 'Trip duplicated successfully!', type: 'success' })
      // Navigate to the new trip
      router.push(`/trips/${newTrip.id}`)
    } else {
      addToast({ title: 'Failed to duplicate trip', type: 'error' })
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this trip? This action cannot be undone.'
    )
    if (!confirmed) return

    const success = await deleteTrip(tripId)
    if (success) {
      addToast({ title: 'Trip deleted successfully', type: 'success' })
    } else {
      addToast({ title: 'Failed to delete trip', type: 'error' })
    }
  }

  const handleToggleFavorite = async (tripId: string) => {
    const trip = trips.find(t => t.id === tripId)
    if (!trip) return

    const success = await updateTrip(tripId, { is_favorite: !trip.is_favorite })
    if (success) {
      addToast({
        title: trip.is_favorite ? 'Removed from favorites' : 'Added to favorites',
        type: 'success',
      })
    } else {
      addToast({ title: 'Failed to update trip', type: 'error' })
    }
  }

  const filteredTrips = filters.searchQuery
    ? trips.filter(trip => {
        const searchLower = filters.searchQuery!.toLowerCase()
        return (
          trip.destination_city.toLowerCase().includes(searchLower) ||
          trip.destination_country.toLowerCase().includes(searchLower) ||
          trip.destination_display_name?.toLowerCase().includes(searchLower)
        )
      })
    : trips

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                My Trips
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage your travel history
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? 'Hide' : 'Show'} Stats
              </Button>
              <Button onClick={() => router.push('/')}>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Trip
              </Button>
            </div>
          </div>

          {/* Statistics */}
          {showStats && !statsLoading && stats && (
            <div className="mb-6">
              <TripStatistics stats={stats} />
            </div>
          )}

          {/* Filters */}
          <TripFilters onFilterChange={handleFilterChange} onSortChange={handleSortChange} />
        </div>

        {/* Content */}
        {tripsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loading size="lg" />
          </div>
        ) : tripsError ? (
          <div className="text-center py-20">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-800 dark:text-red-200 font-medium">Error loading trips</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{tripsError}</p>
              <Button className="mt-4" onClick={() => fetchTrips()}>
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {filters.searchQuery || filters.status ? 'No trips found' : 'No trips yet'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {filters.searchQuery || filters.status
                  ? 'Try adjusting your filters'
                  : 'Start planning your next adventure!'}
              </p>
              <Button onClick={() => router.push('/')}>Create Your First Trip</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Trip Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
              </p>
            </div>

            {/* Trip Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onView={handleViewTrip}
                  onDuplicate={handleDuplicateTrip}
                  onDelete={handleDeleteTrip}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
