// Shared constants for better tree shaking and maintainability

export const TRIP_TYPES = [
  { value: '', label: 'Select trip type' },
  { value: 'business', label: 'Business' },
  { value: 'leisure', label: 'Leisure' },
  { value: 'beach', label: 'Beach Vacation' },
  { value: 'hiking', label: 'Hiking/Adventure' },
  { value: 'city', label: 'City Break' },
  { value: 'winter', label: 'Winter Sports' },
  { value: 'backpacking', label: 'Backpacking' },
] as const

// Trip type labels for display (simple, capitalized versions)
export const TRIP_TYPE_LABELS: Record<string, string> = {
  business: 'Business',
  leisure: 'Leisure',
  beach: 'Beach',
  hiking: 'Hiking',
  city: 'City',
  winter: 'Winter',
  backpacking: 'Backpacking',
} as const

export const PACKING_CATEGORIES = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'toiletries', label: 'Toiletries' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'travel_documents', label: 'Travel Documents' },
  { value: 'medication', label: 'Medication' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
] as const

export const DURATION_OPTIONS = [
  { value: '', label: 'Select duration' },
  { value: '1', label: '1 day' },
  { value: '2', label: '2 days' },
  { value: '3', label: '3 days' },
  { value: '4', label: '4 days' },
  { value: '5', label: '5 days' },
  { value: '6', label: '6 days' },
  { value: '7', label: '1 week' },
  { value: '14', label: '2 weeks' },
  { value: '21', label: '3 weeks' },
  { value: '30', label: '1 month' },
] as const

// API endpoints
export const API_ENDPOINTS = {
  weather: '/api/weather',
  cities: '/api/cities',
  packingList: '/api/generate-packing-list',
} as const

// Cache keys for localStorage
export const STORAGE_KEYS = {
  currentTrip: 'currentTrip',
  currentPackingList: 'currentPackingList',
} as const

// Timeout configurations
export const TIMEOUTS = {
  debounce: {
    search: 300,
    localStorage: 100,
  },
  api: {
    weather: 8000,
    geocoding: 5000,
    cities: 10000,
  },
} as const

// Weather code mapping for Open-Meteo
// Based on WMO Weather interpretation codes (WW)
// Reference: https://open-meteo.com/en/docs
export const WEATHER_CODE_MAP: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Fog', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  56: { description: 'Light freezing drizzle', icon: '🌧️' },
  57: { description: 'Dense freezing drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌦️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  66: { description: 'Light freezing rain', icon: '🌧️' },
  67: { description: 'Heavy freezing rain', icon: '🌧️' },
  71: { description: 'Slight snow', icon: '🌨️' },
  73: { description: 'Moderate snow', icon: '❄️' },
  75: { description: 'Heavy snow', icon: '❄️' },
  77: { description: 'Snow grains', icon: '🌨️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '⛈️' },
  85: { description: 'Slight snow showers', icon: '❄️' },
  86: { description: 'Heavy snow showers', icon: '❄️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' }
} as const