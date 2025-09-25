import { NextRequest, NextResponse } from 'next/server'
import { CityOption, GeocodingResult, GeocodingResponse } from '@/types'
import { LRUCache, CACHE_CONFIGS } from '@/lib/cache'
import { createErrorResponse, createSuccessResponse, rateLimiter, getClientIP, withTimeout, withRetry } from '@/lib/api-utils'

const citySearchCache = new LRUCache<CityOption[]>(CACHE_CONFIGS.cities)

// Predefined major cities for common countries to improve country search
const MAJOR_CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Hiroshima'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
  'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol', 'Belfast', 'Edinburgh'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
  'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
  'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'],
  'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Nanjing', 'Tianjin', 'Xian'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'Mérida'],
  'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-on-Don'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang'],
  'Thailand': ['Bangkok', 'Nonthaburi', 'Pak Kret', 'Hat Yai', 'Chiang Mai', 'Phuket', 'Pattaya', 'Udon Thani', 'Nakhon Ratchasima', 'Khon Kaen'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin'],
  'South Africa': ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Benoni', 'Tembisa'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan']
}

async function searchCities(query: string): Promise<CityOption[]> {
  const cacheKey = query.toLowerCase().trim()
  
  // Check cache first
  const cached = citySearchCache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  try {
    // Use Open-Meteo geocoding API (same as weather API)
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=100&language=en&format=json`
    
    const response = await fetch(geocodingUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch cities')
    }
    
    const data: GeocodingResponse = await response.json()
    
    if (!data.results || data.results.length === 0) {
      return []
    }
    
    // Enhanced country detection logic
    const queryLower = query.toLowerCase().trim()
    let isCountrySearch = false
    let targetCountry = ''
    
    // Check if any of the first few results is a country matching our query
    for (let i = 0; i < Math.min(5, data.results.length); i++) {
      const result = data.results[i]
      if (result.feature_code === 'PCLI' && 
          (result.name.toLowerCase() === queryLower || 
           result.country.toLowerCase() === queryLower)) {
        isCountrySearch = true
        targetCountry = result.country
        break
      }
    }
    
    // Also check if the query matches any country name in the results
    if (!isCountrySearch) {
      const countries = new Set(data.results.map(r => r.country.toLowerCase()))
      if (countries.has(queryLower)) {
        isCountrySearch = true
        targetCountry = data.results.find(r => r.country.toLowerCase() === queryLower)?.country || ''
      }
    }
    
    let filteredResults = data.results
    
    if (isCountrySearch && targetCountry) {
      // If user searched for a country, we need to get cities from that country
      console.log(`Country search detected for: ${targetCountry}`)
      
      // First, try to get cities from the current results
      let countryCities = data.results.filter(result => {
        const isFromTargetCountry = result.country === targetCountry
        const isCityOrTown = ['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPL'].includes(result.feature_code)
        const hasReasonablePopulation = !result.population || result.population >= 10000
        
        return isFromTargetCountry && isCityOrTown && hasReasonablePopulation && result.feature_code !== 'PCLI'
      })
      
      // If we don't have enough cities, search for predefined major cities in that country
      if (countryCities.length < 5) {
        try {
          const majorCities = MAJOR_CITIES_BY_COUNTRY[targetCountry]
          
          if (majorCities) {
            console.log(`Using predefined cities for ${targetCountry}:`, majorCities.slice(0, 5))
            
            // Search for each major city
            for (const cityName of majorCities) {
              const cityUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=en&format=json`
              const cityResponse = await fetch(cityUrl)
              
              if (cityResponse.ok) {
                const cityData: GeocodingResponse = await cityResponse.json()
                
                if (cityData.results) {
                  const cityResults = cityData.results.filter(result => {
                    const isFromTargetCountry = result.country === targetCountry
                    const isCityOrTown = ['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPL'].includes(result.feature_code)
                    const notAlreadyIncluded = !countryCities.some(existing => existing.id === result.id)
                    
                    return isFromTargetCountry && isCityOrTown && notAlreadyIncluded
                  })
                  
                  // Take the best match (usually the first one for exact city name matches)
                  if (cityResults.length > 0) {
                    countryCities.push(cityResults[0])
                  }
                  
                  // Break if we have enough cities
                  if (countryCities.length >= 15) break
                }
              }
              
              // Small delay to avoid hitting rate limits
              await new Promise(resolve => setTimeout(resolve, 50))
            }
          } else {
            // Fallback to generic searches for countries not in our predefined list
            const additionalSearches = [
              `${targetCountry} capital`,
              `${targetCountry} cities`,
              `${targetCountry} major`
            ]
            
            for (const searchTerm of additionalSearches) {
              const additionalUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=50&language=en&format=json`
              const additionalResponse = await fetch(additionalUrl)
              
              if (additionalResponse.ok) {
                const additionalData: GeocodingResponse = await additionalResponse.json()
                
                if (additionalData.results) {
                  const additionalCities = additionalData.results.filter(result => {
                    const isFromTargetCountry = result.country === targetCountry
                    const isCityOrTown = ['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPL'].includes(result.feature_code)
                    const hasReasonablePopulation = !result.population || result.population >= 10000
                    const notAlreadyIncluded = !countryCities.some(existing => existing.id === result.id)
                    
                    return isFromTargetCountry && isCityOrTown && hasReasonablePopulation && notAlreadyIncluded
                  })
                  
                  countryCities = countryCities.concat(additionalCities)
                  
                  // Break if we have enough cities
                  if (countryCities.length >= 15) break
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching additional cities:', error)
        }
      }
      
      // Sort by importance: capital cities first, then major cities, then by population
      filteredResults = countryCities.sort((a, b) => {
        const getImportanceScore = (result: GeocodingResult) => {
          if (result.feature_code === 'PPLC') return 1000000 // Capital
          if (result.feature_code === 'PPLA') return 500000  // Major city
          if (result.feature_code === 'PPLA2') return 100000 // Secondary city
          if (result.feature_code === 'PPLA3') return 50000  // Third-level city
          if (result.feature_code === 'PPLA4') return 25000  // Fourth-level city
          return result.population || 10000 // Regular city by population
        }
        
        const scoreA = getImportanceScore(a)
        const scoreB = getImportanceScore(b)
        
        if (scoreA !== scoreB) {
          return scoreB - scoreA // Higher score first
        }
        
        // If same importance, sort by population
        const popA = a.population || 0
        const popB = b.population || 0
        if (popA !== popB) {
          return popB - popA
        }
        
        // Finally by name
        return a.name.localeCompare(b.name)
      })
      
      // Limit to top cities but ensure we have a good selection
      filteredResults = filteredResults.slice(0, 25)
      
    } else {
      // Regular city search - filter for cities and major towns
      filteredResults = data.results.filter(result => {
        const cityFeatureCodes = ['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPL']
        const hasValidFeatureCode = cityFeatureCodes.includes(result.feature_code)
        const hasSignificantPopulation = !result.population || result.population >= 25000
        
        return hasValidFeatureCode && hasSignificantPopulation
      })
      
      // Sort by relevance for city search
      filteredResults = filteredResults.sort((a, b) => {
        // Prefer exact name matches
        const aExactMatch = a.name.toLowerCase() === queryLower
        const bExactMatch = b.name.toLowerCase() === queryLower
        if (aExactMatch !== bExactMatch) {
          return aExactMatch ? -1 : 1
        }
        
        // Then by feature code importance
        const getFeatureScore = (code: string) => {
          switch (code) {
            case 'PPLC': return 100
            case 'PPLA': return 90
            case 'PPLA2': return 80
            case 'PPLA3': return 70
            default: return 60
          }
        }
        
        const scoreA = getFeatureScore(a.feature_code)
        const scoreB = getFeatureScore(b.feature_code)
        if (scoreA !== scoreB) {
          return scoreB - scoreA
        }
        
        // Then by population
        const popA = a.population || 0
        const popB = b.population || 0
        if (popA !== popB) {
          return popB - popA
        }
        
        return a.name.localeCompare(b.name)
      })
      
      filteredResults = filteredResults.slice(0, 15)
    }
    
    // Format results
    const cities: CityOption[] = filteredResults
      .map(result => {
        // Create display name with city, state/province, country
        let displayName = result.name
        
        if (result.admin1 && result.admin1 !== result.country) {
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
    
    // Cache the result
    citySearchCache.set(cacheKey, cities)
    
    return cities
  } catch (error) {
    console.error('Error searching cities:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    if (!rateLimiter.isAllowed(clientIP)) {
      return createErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED')
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return createErrorResponse('Query must be at least 2 characters long', 400, 'INVALID_QUERY_LENGTH')
    }

    if (query.length > 200) {
      return createErrorResponse('Query too long', 400, 'QUERY_TOO_LONG')
    }
    
    const cities = await withTimeout(
      searchCities(query.trim()),
      10000, // 10 second timeout
      'City search timeout'
    )
    
    return createSuccessResponse({ cities }, 3600) // 1 hour cache
    
  } catch (error) {
    console.error('Error in cities API:', error)
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return createErrorResponse('Search timeout', 504, 'TIMEOUT')
    }
    
    return createErrorResponse('Failed to search cities', 500, 'INTERNAL_ERROR')
  }
}