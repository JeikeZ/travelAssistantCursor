import { NextRequest, NextResponse } from 'next/server'

interface WeatherData {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_probability_max: number[]
  }
}

// Cache for weather data (in production, use Redis or similar)
const weatherCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

// Request deduplication
const pendingRequests = new Map<string, Promise<unknown>>()

interface GeocodingResult {
  results?: Array<{
    latitude: number
    longitude: number
    name: string
    country: string
  }>
}

// Weather code mapping for Open-Meteo
const weatherCodeMap: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Fog', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌦️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  71: { description: 'Slight snow', icon: '🌨️' },
  73: { description: 'Moderate snow', icon: '❄️' },
  75: { description: 'Heavy snow', icon: '❄️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '⛈️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' }
}

async function getCoordinates(city: string, country: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`
    
    const response = await fetch(geocodingUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch coordinates')
    }
    
    const data: GeocodingResult = await response.json()
    
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
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    return await pendingRequests.get(cacheKey)
  }
  
  // Create new request
  const requestPromise = (async () => {
    try {
      // Get coordinates for the location
      const coordinates = await getCoordinates(city, country)
      if (!coordinates) {
        throw new Error('Location not found')
      }
      
      // Fetch weather data from Open-Meteo
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=7`
      
      const weatherResponse = await fetch(weatherUrl)
      if (!weatherResponse.ok) {
        throw new Error('Failed to fetch weather data')
      }
      
      const weatherData: WeatherData = await weatherResponse.json()
      
      // Format the response
      const forecast = weatherData.daily.time.map((date, index) => ({
        date,
        maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
        minTemp: Math.round(weatherData.daily.temperature_2m_min[index]),
        weatherCode: weatherData.daily.weather_code[index],
        description: weatherCodeMap[weatherData.daily.weather_code[index]]?.description || 'Unknown',
        icon: weatherCodeMap[weatherData.daily.weather_code[index]]?.icon || '❓',
        precipitationProbability: weatherData.daily.precipitation_probability_max[index] || 0
      }))
      
      const result = {
        location: `${city}, ${country}`,
        coordinates,
        forecast
      }
      
      // Cache the result
      weatherCache.set(cacheKey, { data: result, timestamp: Date.now() })
      
      return result
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey)
    }
  })()
  
  // Store the pending request
  pendingRequests.set(cacheKey, requestPromise)
  
  return await requestPromise
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    
    if (!city || !country) {
      return NextResponse.json(
        { error: 'City and country parameters are required' },
        { status: 400 }
      )
    }
    
    const weatherData = await fetchWeatherData(city, country)
    
    const response = NextResponse.json(weatherData)
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600') // 30 minutes cache, 1 hour stale
    response.headers.set('CDN-Cache-Control', 'public, max-age=1800')
    response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=1800')
    
    return response
    
  } catch (error) {
    console.error('Error in weather API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}