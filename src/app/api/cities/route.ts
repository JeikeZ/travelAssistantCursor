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
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=50&language=en&format=json`
    
    const response = await fetch(geocodingUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch cities')
    }
    
    const data: GeocodingResponse = await response.json()
    
    if (!data.results || data.results.length === 0) {
      return []
    }
    
    // Check if the first result is a country (PCLI feature code)
    const firstResult = data.results[0]
    const isCountrySearch = firstResult.feature_code === 'PCLI' && 
                           firstResult.name.toLowerCase() === query.toLowerCase().trim()
    
    let filteredResults = data.results
    
    if (isCountrySearch) {
      // If user searched for a country, return major cities from that country
      const countryName = firstResult.country
      filteredResults = data.results.filter(result => {
        // Include major cities from the same country
        const majorCityFeatureCodes = ['PPLC', 'PPLA', 'PPLA2']
        const isMajorCity = majorCityFeatureCodes.includes(result.feature_code)
        const isFromSameCountry = result.country === countryName
        const hasSignificantPopulation = !result.population || result.population >= 100000 // Higher threshold for country searches
        
        return isMajorCity && isFromSameCountry && hasSignificantPopulation && result.feature_code !== 'PCLI'
      })
      
      // If we don't have enough major cities, get additional cities with lower population threshold
      if (filteredResults.length < 10) {
        const additionalCities = data.results.filter(result => {
          const majorCityFeatureCodes = ['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4']
          const isMajorCity = majorCityFeatureCodes.includes(result.feature_code)
          const isFromSameCountry = result.country === countryName
          const hasSignificantPopulation = !result.population || result.population >= 50000
          
          return isMajorCity && isFromSameCountry && hasSignificantPopulation && result.feature_code !== 'PCLI'
        })
        
        // Merge and deduplicate
        const allCityIds = new Set(filteredResults.map(r => r.id))
        additionalCities.forEach(city => {
          if (!allCityIds.has(city.id)) {
            filteredResults.push(city)
          }
        })
      }
    } else {
      // Regular city search - filter for major cities only
      filteredResults = data.results.filter(result => {
        const majorCityFeatureCodes = ['PPLC', 'PPLA', 'PPLA2']
        const hasValidFeatureCode = majorCityFeatureCodes.includes(result.feature_code)
        const hasSignificantPopulation = !result.population || result.population >= 50000
        
        return hasValidFeatureCode && hasSignificantPopulation
      })
    }
    
    // Format results
    const cities: CityResult[] = filteredResults
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
      // Sort by population (if available, larger cities first) then alphabetically
      .sort((a, b) => {
        // If both have population data, sort by population (descending)
        if (data.results) {
          const aPopulation = data.results.find(r => r.id.toString() === a.id)?.population || 0
          const bPopulation = data.results.find(r => r.id.toString() === b.id)?.population || 0
          if (aPopulation && bPopulation && aPopulation !== bPopulation) {
            return bPopulation - aPopulation
          }
        }
        // Fall back to alphabetical sorting
        return a.displayName.localeCompare(b.displayName)
      })
      // Limit results for better UX
      .slice(0, isCountrySearch ? 20 : 15)
    
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