// Centralized type definitions for better type safety and maintainability

// Trip related types
export interface TripData {
  destinationCountry: string
  destinationCity: string
  destinationState?: string
  destinationDisplayName?: string
  duration: number
  tripType: 'business' | 'leisure' | 'beach' | 'hiking' | 'city' | 'winter' | 'backpacking'
}

// Packing list types
export type PackingCategory = 'clothing' | 'toiletries' | 'electronics' | 'travel_documents' | 'medication' | 'miscellaneous'

export interface PackingItem {
  id: string
  name: string
  category: PackingCategory
  essential: boolean
  packed: boolean
  custom: boolean
}

export interface PackingListResponse {
  items: Omit<PackingItem, 'id' | 'packed' | 'custom'>[]
}

// Weather types
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

// City search types
export interface CityOption {
  id: string
  name: string
  country: string
  admin1?: string // State/Province
  admin2?: string // County/District
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

// API Response types
export interface ApiError {
  error: string
  code?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

// Form types
export interface SelectOption {
  value: string
  label: string
}

export type TripType = TripData['tripType']

// Cache types
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

// Component prop types
export interface BaseComponentProps {
  className?: string
  disabled?: boolean
}

export interface FormFieldProps extends BaseComponentProps {
  error?: string
  placeholder?: string
}

// Hook return types
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

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Environment types
export interface AppConfig {
  openaiApiKey?: string
  isDevelopment: boolean
  isProduction: boolean
}

// Error types
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
  constructor(message: string, field?: string) {
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

// Temperature units
export type TemperatureUnit = 'C' | 'F'

// Local storage types
export type LocalStorageKey = 'currentTrip' | 'currentPackingList'

// Event handler types
export type ChangeHandler<T = string> = (value: T) => void
export type ClickHandler = () => void
export type SubmitHandler = (event: React.FormEvent) => void