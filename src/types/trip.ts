/**
 * Trip-related Types
 */

export type TripStatus = 'active' | 'completed' | 'archived'

export type TripType = 'business' | 'leisure' | 'beach' | 'hiking' | 'city' | 'winter' | 'backpacking'

export interface TripData extends Record<string, unknown> {
  destinationCountry: string
  destinationCity: string
  destinationState?: string
  destinationDisplayName?: string
  duration: number
  tripType: TripType
}

export interface Trip {
  id: string
  user_id: string
  destination_country: string
  destination_city: string
  destination_state: string | null
  destination_display_name: string | null
  duration: number
  trip_type: TripType
  status: TripStatus
  completion_percentage: number
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  notes: string | null
  is_favorite: boolean
}

export interface TripInsert {
  id?: string
  user_id: string
  destination_country: string
  destination_city: string
  destination_state?: string | null
  destination_display_name?: string | null
  duration: number
  trip_type: TripType
  status?: TripStatus
  completion_percentage?: number
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
  is_favorite?: boolean
}

export interface TripUpdate {
  destination_country?: string
  destination_city?: string
  destination_state?: string | null
  destination_display_name?: string | null
  duration?: number
  trip_type?: TripType
  status?: TripStatus
  completion_percentage?: number
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
  is_favorite?: boolean
  updated_at?: string
  completed_at?: string | null
}

export interface TripFilters {
  status?: TripStatus | 'all'
  searchQuery?: string
  startDateFrom?: string
  startDateTo?: string
}

export interface SortOptions {
  sortBy: 'created_at' | 'updated_at' | 'start_date'
  sortOrder: 'asc' | 'desc'
}

export interface TripStatistics {
  totalTrips: number
  completedTrips: number
  activeTrips: number
  archivedTrips: number
  totalCountriesVisited: number
  totalCitiesVisited: number
  mostVisitedDestinations: Array<{
    destination: string
    count: number
  }>
  favoriteTrips: Trip[]
}
