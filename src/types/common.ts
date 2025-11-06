/**
 * Common/Shared Types
 */

// ============================================================================
// Weather Types
// ============================================================================

export interface WeatherForecast {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  description: string
  icon: string
  precipitationProbability: number
}

export interface WeatherData {
  location: string
  coordinates: {
    lat: number
    lon: number
  }
  forecast: WeatherForecast[]
}

export interface WeatherApiResponse {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_probability_max: number[]
  }
}

export type TemperatureUnit = 'C' | 'F'

// ============================================================================
// City/Location Types
// ============================================================================

export interface CityOption {
  id: string
  name: string
  country: string
  admin1?: string
  admin2?: string
  latitude: number
  longitude: number
  displayName: string
}

export interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation?: number
  feature_code: string
  country_code: string
  admin1_id?: number
  admin2_id?: number
  admin3_id?: number
  admin4_id?: number
  timezone: string
  population?: number
  country: string
  country_id: number
  admin1?: string
  admin2?: string
  admin3?: string
  admin4?: string
}

export interface GeocodingResponse {
  results?: GeocodingResult[]
}

export interface CitySearchResponse {
  cities: CityOption[]
}

// ============================================================================
// UI/Form Types
// ============================================================================

export interface SelectOption {
  value: string
  label: string
}

export interface BaseComponentProps {
  className?: string
  disabled?: boolean
}

export interface FormFieldProps extends BaseComponentProps {
  error?: string
  placeholder?: string
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
  size: number
}

export interface CacheStats {
  size: number
  memoryUsageMB: number
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// ============================================================================
// Environment/Config Types
// ============================================================================

export interface AppConfig {
  openaiApiKey?: string
  isDevelopment: boolean
  isProduction: boolean
}

export type LocalStorageKey = 'currentTrip' | 'currentPackingList'

// ============================================================================
// Event Handler Types
// ============================================================================

export type ChangeHandler<T = string> = (value: T) => void
export type ClickHandler = () => void
export type SubmitHandler = (event: React.FormEvent) => void

// ============================================================================
// Error Classes
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class ApiClientError extends AppError {
  constructor(message: string, statusCode: number) {
    super(message, 'API_CLIENT_ERROR', statusCode)
    this.name = 'ApiClientError'
  }
}

// ============================================================================
// Hook Return Types
// ============================================================================

import type { PackingItem } from './packing'

export interface UsePackingListReturn {
  packingList: PackingItem[]
  updatePackingList: (updatedList: PackingItem[]) => void
  toggleItemPacked: (itemId: string) => void
  addCustomItem: (item: Omit<PackingItem, 'id' | 'packed' | 'custom'>) => void
  deleteItem: (itemId: string) => void
  editItem: (itemId: string, newName: string) => void
  progress: {
    totalItems: number
    packedItems: number
    progress: number
  }
  groupedItems: Record<string, PackingItem[]>
  sortedCategories: string[]
}
