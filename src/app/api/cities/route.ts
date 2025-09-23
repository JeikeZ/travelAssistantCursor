import { NextRequest, NextResponse } from 'next/server'

interface CityResult {
  id: string
  name: string
  country: string
  admin1?: string // State/Province
  admin2?: string // County/District
  latitude: number
  longitude: number
  displayName: string
}

interface GeocodingResponse {
  results?: Array<{
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
  }>
}

// Cache for city search results
const citySearchCache = new Map<string, { data: CityResult[]; timestamp: number }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

async function searchCities(query: string): Promise<CityResult[]> {
  const cacheKey = query.toLowerCase().trim()
  
  // Check cache first
  const cached = citySearchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  try {
    // Use Open-Meteo geocoding API (same as weather API)
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=en&format=json`
    
    const response = await fetch(geocodingUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch cities')
    }
    
    const data: GeocodingResponse = await response.json()
    
    if (!data.results || data.results.length === 0) {
      return []
    }
    
    // Filter and format results to only include cities/towns
    const cities: CityResult[] = data.results
      .filter(result => {
        // Filter for cities, towns, and populated places
        const cityFeatureCodes = ['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC', 'PPLS']
        return cityFeatureCodes.some(code => result.feature_code.startsWith(code))
      })
      .map(result => {
        // Create display name with city, state/province, country
        let displayName = result.name
        
        if (result.admin1) {
          displayName += `, ${result.admin1}`
        }
        displayName += `, ${result.country}`
        
        return {
          id: `${result.id}`,
          name: result.name,
          country: result.country,
          admin1: result.admin1, // State/Province
          admin2: result.admin2, // County/District
          latitude: result.latitude,
          longitude: result.longitude,
          displayName
        }
      })
      // Remove duplicates based on display name
      .filter((city, index, arr) => 
        arr.findIndex(c => c.displayName === city.displayName) === index
      )
      // Sort by population (if available) or alphabetically
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    
    // Cache the result
    citySearchCache.set(cacheKey, { data: cities, timestamp: Date.now() })
    
    return cities
  } catch (error) {
    console.error('Error searching cities:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }
    
    const cities = await searchCities(query.trim())
    
    const response = NextResponse.json({ cities })
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200') // 1 hour cache, 2 hours stale
    response.headers.set('CDN-Cache-Control', 'public, max-age=3600')
    
    return response
    
  } catch (error) {
    console.error('Error in cities API:', error)
    return NextResponse.json(
      { error: 'Failed to search cities' },
      { status: 500 }
    )
  }
}