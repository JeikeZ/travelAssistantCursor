import { NextRequest } from 'next/server'
import { generatePackingList } from '@/lib/openai'
import { TripData } from '@/types'
import { LRUCache, RequestDeduplicator, CACHE_CONFIGS } from '@/lib/cache'
import { createErrorResponse, createSuccessResponse, validateRequiredFields, rateLimiter, getClientIP, withTimeout } from '@/lib/api-utils'

// Configure runtime for Vercel serverless functions
export const runtime = 'nodejs'
export const maxDuration = 45 // 45 seconds to allow buffer for OpenAI calls
export const dynamic = 'force-dynamic' // Disable caching at the route level

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
  console.log('=== Generate Packing List API Called ===')
  console.log('Environment check:', {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7),
    nodeVersion: process.version
  })
  
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    if (!rateLimiter.isAllowed(clientIP)) {
      console.warn('Rate limit exceeded for IP:', clientIP)
      return createErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED')
    }

    const tripData: TripData = await request.json()
    console.log('Received trip data:', {
      destination: `${tripData.destinationCity}, ${tripData.destinationCountry}`,
      duration: tripData.duration,
      tripType: tripData.tripType
    })

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
      40000, // 40 second timeout for AI generation (increased)
      'Packing list generation timeout'
    )

    console.log('Successfully generated packing list with', packingList.length, 'items')
    return createSuccessResponse({ packingList }, 86400) // 24 hours cache
    
  } catch (error) {
    console.error('Error in generate-packing-list API:', error)
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      // Handle specific error types with appropriate status codes
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return createErrorResponse('Request timed out. Please try again.', 504, 'TIMEOUT')
      }
      
      if (errorMessage.includes('api key') || errorMessage.includes('api_key_missing') || errorMessage.includes('invalid_api_key')) {
        return createErrorResponse('OpenAI API key is not configured correctly. Please contact support.', 503, 'API_KEY_ERROR')
      }
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('rate_limit_exceeded')) {
        return createErrorResponse('Too many requests to AI service. Please try again in a moment.', 429, 'RATE_LIMIT')
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('quota_exceeded')) {
        return createErrorResponse('AI service quota exceeded. Please try again later.', 503, 'QUOTA_EXCEEDED')
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return createErrorResponse('Network error. Please check your connection and try again.', 503, 'NETWORK_ERROR')
      }
      
      // Log detailed error for debugging
      console.error('Detailed error:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      })
    }
    
    return createErrorResponse('Failed to generate packing list. Please try again.', 500, 'INTERNAL_ERROR')
  }
}