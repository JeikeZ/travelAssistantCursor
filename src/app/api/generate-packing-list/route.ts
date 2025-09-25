import { NextRequest } from 'next/server'
import { generatePackingList } from '@/lib/openai'
import { TripData } from '@/types'
import { LRUCache, RequestDeduplicator, CACHE_CONFIGS } from '@/lib/cache'
import { createErrorResponse, createSuccessResponse, validateRequiredFields, rateLimiter, getClientIP, withTimeout } from '@/lib/api-utils'

const packingListCache = new LRUCache(CACHE_CONFIGS.packingList)
const packingListDeduplicator = new RequestDeduplicator()

async function getCachedPackingList(tripData: TripData) {
  // Create cache key based on trip parameters
  const cacheKey = `${tripData.destinationCountry.toLowerCase()}-${tripData.destinationCity.toLowerCase()}-${tripData.duration}-${tripData.tripType}`
  
  // Check cache first
  const cached = packingListCache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  // Use request deduplication
  return packingListDeduplicator.deduplicate(cacheKey, async () => {
    const packingList = await generatePackingList(tripData)
    
    // Cache the result
    packingListCache.set(cacheKey, packingList)
    
    return packingList
  })
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    if (!rateLimiter.isAllowed(clientIP)) {
      return createErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED')
    }

    const tripData: TripData = await request.json()

    // Validate required fields
    const validation = validateRequiredFields(tripData, [
      'destinationCountry',
      'destinationCity', 
      'duration',
      'tripType'
    ])

    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400,
        'MISSING_REQUIRED_FIELDS'
      )
    }

    // Validate field values
    if (tripData.duration < 1 || tripData.duration > 365) {
      return createErrorResponse('Duration must be between 1 and 365 days', 400, 'INVALID_DURATION')
    }

    const packingList = await withTimeout(
      getCachedPackingList(tripData),
      30000, // 30 second timeout for AI generation
      'Packing list generation timeout'
    )

    return createSuccessResponse({ packingList }, 86400) // 24 hours cache
    
  } catch (error) {
    console.error('Error in generate-packing-list API:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return createErrorResponse('Generation timeout', 504, 'TIMEOUT')
      }
      if (error.message.includes('API key')) {
        return createErrorResponse('Service configuration error', 503, 'SERVICE_UNAVAILABLE')
      }
    }
    
    return createErrorResponse('Failed to generate packing list', 500, 'INTERNAL_ERROR')
  }
}