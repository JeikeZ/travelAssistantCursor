import { NextRequest } from 'next/server'
import { WeatherApiResponse, GeocodingResponse } from '@/types'
import { LRUCache, RequestDeduplicator, CACHE_CONFIGS } from '@/lib/cache'
import { createErrorResponse, createSuccessResponse, rateLimiter, getClientIP, withTimeout, withRetry } from '@/lib/api-utils'

const weatherCache = new LRUCache(CACHE_CONFIGS.weather)
const requestDeduplicator = new RequestDeduplicator()

// Types are now imported from @/types

import { WEATHER_CODE_MAP, TIMEOUTS } from '@/lib/constants'

async function getCoordinates(city: string, country: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.api.geocoding)
    
    const response = await withRetry(
      () => fetch(geocodingUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TravelAssistant/1.0',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        }
      }),
      2, // 2 retries
      500 // 500ms base delay
    )
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error('Failed to fetch coordinates')
    }
    
    const data: GeocodingResponse = await response.json()
    
    if (!data.results || data.results.length === 0) {
      return null
    }
    
    // Find the best match by country
    const countryMatch = data.results.find(result => 
      result.country.toLowerCase().includes(country.toLowerCase()) ||
      country.toLowerCase().includes(result.country.toLowerCase())
    )
    
    const selectedResult = countryMatch || data.results[0]
    
    return {
      lat: selectedResult.latitude,
      lon: selectedResult.longitude
    }
  } catch (error) {
    console.error('Error getting coordinates:', error)
    return null
  }
}

async function fetchWeatherData(city: string, country: string) {
  const cacheKey = `${city.toLowerCase()}-${country.toLowerCase()}`
  
  // Check cache first
  const cached = weatherCache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  // Use request deduplication
  return requestDeduplicator.deduplicate(cacheKey, async () => {
    // Get coordinates for the location
    const coordinates = await getCoordinates(city, country)
    if (!coordinates) {
      throw new Error('Location not found')
    }
    
    // Fetch weather data from Open-Meteo with optimized timeout and retry
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.api.weather)
    
    try {
      // Construct weather API URL to get exactly 7 days starting from today
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=7&models=best_match`
      
      const weatherResponse = await withRetry(
        () => fetch(weatherUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'TravelAssistant/1.0',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
          }
        }),
        2, // 2 retries
        1000 // 1s base delay
      )
      
      if (!weatherResponse.ok) {
        throw new Error(`Weather API responded with ${weatherResponse.status}`)
      }
      
      const weatherData: WeatherApiResponse = await weatherResponse.json()
      
      // Format the response
      const forecast = weatherData.daily.time.map((date, index) => ({
        date,
        maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
        minTemp: Math.round(weatherData.daily.temperature_2m_min[index]),
        weatherCode: weatherData.daily.weather_code[index],
        description: WEATHER_CODE_MAP[weatherData.daily.weather_code[index]]?.description || 'Unknown',
        icon: WEATHER_CODE_MAP[weatherData.daily.weather_code[index]]?.icon || '❓',
        precipitationProbability: weatherData.daily.precipitation_probability_max[index] || 0
      }))
      
      // Ensure forecast starts with current day and contains exactly 7 days
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const filteredForecast = forecast.filter(day => {
        const forecastDate = new Date(day.date)
        forecastDate.setHours(0, 0, 0, 0)
        return forecastDate.getTime() >= today.getTime()
      }).slice(0, 7) // Ensure we only return exactly 7 days
      
      const result = {
        location: `${city}, ${country}`,
        coordinates,
        forecast: filteredForecast
      }
      
      // Cache the result
      weatherCache.set(cacheKey, result)
      
      return result
    } finally {
      clearTimeout(timeoutId)
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    if (!rateLimiter.isAllowed(clientIP)) {
      return createErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED')
    }

    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    
    if (!city || !country) {
      return createErrorResponse('City and country parameters are required', 400, 'MISSING_PARAMETERS')
    }

    // Validate input length
    if (city.length > 100 || country.length > 100) {
      return createErrorResponse('Parameter values too long', 400, 'INVALID_INPUT')
    }
    
    const weatherData = await withTimeout(
      fetchWeatherData(city.trim(), country.trim()),
      15000, // 15 second total timeout
      'Weather request timeout'
    )
    
    return createSuccessResponse(weatherData, 1800) // 30 minutes cache
    
  } catch (error) {
    console.error('Error in weather API:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return createErrorResponse('Request timeout', 504, 'TIMEOUT')
      }
      if (error.message.includes('Location not found')) {
        return createErrorResponse('Location not found', 404, 'LOCATION_NOT_FOUND')
      }
    }
    
    return createErrorResponse('Failed to fetch weather data', 500, 'INTERNAL_ERROR')
  }
}