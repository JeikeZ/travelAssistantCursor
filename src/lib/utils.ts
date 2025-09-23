import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Commonly used CSS class combinations for better performance
export const commonStyles = {
  card: 'bg-white rounded-lg border border-gray-200 shadow-sm',
  cardHover: 'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow',
  button: {
    base: 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 bg-white text-black hover:bg-gray-50',
    ghost: 'text-black hover:bg-gray-100'
  },
  input: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors',
  gradientBackground: 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50',
  centerContent: 'flex items-center justify-center',
  spacingY: {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  },
  spacingX: {
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6'
  },
  text: {
    heading: 'text-xl font-semibold text-gray-900',
    subheading: 'text-lg font-medium text-gray-800',
    body: 'text-slate-700',
    muted: 'text-slate-600',
    small: 'text-sm text-slate-600'
  }
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

// Temperature conversion utilities
export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9/5) + 32)
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return Math.round((fahrenheit - 32) * 5/9)
}

export function convertTemperature(temp: number, fromUnit: 'C' | 'F', toUnit: 'C' | 'F'): number {
  if (fromUnit === toUnit) return temp
  if (fromUnit === 'C' && toUnit === 'F') return celsiusToFahrenheit(temp)
  if (fromUnit === 'F' && toUnit === 'C') return fahrenheitToCelsius(temp)
  return temp
}

// Utility function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
}