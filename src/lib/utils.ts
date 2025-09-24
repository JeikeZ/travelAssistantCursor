import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Commonly used CSS class combinations for better performance and consistency
export const commonStyles = {
  // Layout
  gradientBackground: 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50',
  centerContent: 'flex items-center justify-center',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Cards
  card: 'bg-white rounded-lg border border-gray-200 shadow-sm',
  cardHover: 'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200',
  cardInteractive: 'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200',
  
  // Buttons
  button: {
    base: 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
    outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100',
    ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
  },
  
  // Form elements
  input: 'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:bg-gray-50',
  select: 'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50',
  
  // Spacing
  spacing: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  },
  spacingX: {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8'
  },
  
  // Typography
  text: {
    title: 'text-3xl font-bold text-gray-900 sm:text-4xl',
    heading: 'text-xl font-semibold text-gray-900',
    subheading: 'text-lg font-medium text-gray-800',
    body: 'text-base text-slate-700',
    muted: 'text-sm text-slate-600',
    small: 'text-xs text-slate-500',
    error: 'text-sm text-red-600',
    success: 'text-sm text-green-600'
  },
  
  // States
  loading: 'animate-pulse',
  disabled: 'opacity-50 cursor-not-allowed',
  interactive: 'cursor-pointer transition-colors duration-200',
  
  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
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