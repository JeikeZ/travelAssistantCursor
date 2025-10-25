import { NextRequest } from 'next/server'
import { generatePackingList } from '@/lib/openai'
import { TripData } from '@/types'
import { LRUCache, RequestDeduplicator, CACHE_CONFIGS } from '@/lib/cache'
import { createErrorResponse, createSuccessResponse, validateRequiredFields, rateLimiter, getClientIP, withTimeout } from '@/lib/api-utils'

// Force Node.js runtime for OpenAI SDK compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  let tripData: TripData | undefined
  
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    if (!rateLimiter.isAllowed(clientIP)) {
      return createErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED')
    }

    const requestData = await request.json()
    
    // Basic validation that we have data
    if (!requestData || typeof requestData !== 'object') {
      return createErrorResponse('Invalid request body', 400, 'INVALID_REQUEST')
    }
    
    tripData = requestData as TripData

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
      35000, // 35 second timeout for AI generation (less than Vercel's 45s)
      'Packing list generation timeout'
    )

    return createSuccessResponse({ packingList }, 86400) // 24 hours cache
    
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('Error in generate-packing-list API:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      // @ts-expect-error - accessing custom property that may not exist
      errorCode: error?.code || 'NO_CODE',
      timestamp: new Date().toISOString(),
      ...(tripData && {
        tripData: {
          country: tripData.destinationCountry,
          city: tripData.destinationCity,
          duration: tripData.duration,
          type: tripData.tripType
        }
      })
    })
    
    if (error instanceof Error) {
      // Timeout errors
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return createErrorResponse(
          'Request timed out while generating packing list. Please try again.',
          504,
          'TIMEOUT'
        )
      }
      
      // API key errors
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        return createErrorResponse(
          'OpenAI API key is not configured or invalid. Please check environment variables.',
          503,
          'SERVICE_UNAVAILABLE'
        )
      }
      
      // Rate limit errors
      if (error.message.includes('rate limit') || error.message.includes('RATE_LIMIT')) {
        return createErrorResponse(
          'OpenAI rate limit exceeded. Please try again later.',
          429,
          'RATE_LIMIT_EXCEEDED'
        )
      }
      
      // Quota errors
      if (error.message.includes('quota') || error.message.includes('INSUFFICIENT_QUOTA')) {
        return createErrorResponse(
          'OpenAI account has insufficient credits. Please check your OpenAI account.',
          503,
          'INSUFFICIENT_QUOTA'
        )
      }
      
      // Network errors
      if (error.message.includes('network') || error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
        return createErrorResponse(
          'Network error while connecting to OpenAI. Please try again.',
          503,
          'NETWORK_ERROR'
        )
      }
    }
    
    // Generic error fallback
    return createErrorResponse(
      'Failed to generate packing list. Please try again or contact support.',
      500,
      'INTERNAL_ERROR'
    )
  }
}