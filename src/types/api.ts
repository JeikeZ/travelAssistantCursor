/**
 * API Request/Response Types
 */

import type { Trip, TripStatus } from './trip'
import type { PackingItemDb, PackingCategory } from './packing'

// ============================================================================
// Generic API Types
// ============================================================================

export interface ApiError {
  error: string
  code?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

// ============================================================================
// Trip API Types
// ============================================================================

export interface CreateTripRequest extends Record<string, unknown> {
  destinationCountry: string
  destinationCity: string
  destinationState?: string
  destinationDisplayName?: string
  duration: number
  tripType: 'business' | 'leisure' | 'beach' | 'hiking' | 'city' | 'winter' | 'backpacking'
  startDate?: string
  endDate?: string
  notes?: string
}

export interface CreateTripResponse {
  success: boolean
  trip?: Trip
  error?: string
}

export interface GetTripsQuery {
  status?: TripStatus | 'all'
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'updated_at' | 'start_date'
  sortOrder?: 'asc' | 'desc'
}

export interface GetTripsResponse {
  trips: Trip[]
  total: number
  hasMore: boolean
}

export interface GetTripDetailResponse {
  trip: Trip
  packingItems: PackingItemDb[]
  statistics: {
    totalItems: number
    packedItems: number
    completionPercentage: number
  }
}

export interface UpdateTripRequest {
  status?: TripStatus
  notes?: string
  isFavorite?: boolean
  completionPercentage?: number
  startDate?: string
  endDate?: string
}

export interface DuplicateTripRequest {
  newStartDate?: string
  newEndDate?: string
}

export interface DuplicateTripResponse {
  success: boolean
  newTrip?: Trip
  error?: string
}

// ============================================================================
// Packing Items API Types
// ============================================================================

export interface AddPackingItemRequest {
  name: string
  category: PackingCategory
  essential: boolean
  custom?: boolean
  quantity?: number
  notes?: string
}

export interface UpdatePackingItemRequest {
  name?: string
  packed?: boolean
  quantity?: number
  notes?: string
  category?: PackingCategory
  essential?: boolean
}

export interface BulkUpdateItemsRequest {
  updates: Array<{
    itemId: string
    packed?: boolean
    name?: string
    quantity?: number
  }>
}
