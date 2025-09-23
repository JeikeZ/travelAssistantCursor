import { NextRequest, NextResponse } from 'next/server'
import { generatePackingList, TripData } from '@/lib/openai'

// Cache for packing lists (in production, use Redis or similar)
const packingListCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Request deduplication
const pendingRequests = new Map<string, Promise<unknown>>()

async function getCachedPackingList(tripData: TripData) {
  // Create cache key based on trip parameters
  const cacheKey = `${tripData.destinationCountry.toLowerCase()}-${tripData.destinationCity.toLowerCase()}-${tripData.duration}-${tripData.tripType}`
  
  // Check cache first
  const cached = packingListCache.get(cacheKey)
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
      const packingList = await generatePackingList(tripData)
      
      // Cache the result
      packingListCache.set(cacheKey, { data: packingList, timestamp: Date.now() })
      
      return packingList
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey)
    }
  })()
  
  // Store the pending request
  pendingRequests.set(cacheKey, requestPromise)
  
  return await requestPromise
}

export async function POST(request: NextRequest) {
  try {
    const tripData: TripData = await request.json()

    // Validate required fields
    if (!tripData.destinationCountry || !tripData.destinationCity || !tripData.duration || !tripData.tripType) {
      return NextResponse.json(
        { error: 'Missing required trip data' },
        { status: 400 }
      )
    }

    const packingList = await getCachedPackingList(tripData)

    const response = NextResponse.json({ packingList })
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=172800') // 24 hours cache, 48 hours stale
    response.headers.set('CDN-Cache-Control', 'public, max-age=86400')
    
    return response
  } catch (error) {
    console.error('Error in generate-packing-list API:', error)
    return NextResponse.json(
      { error: 'Failed to generate packing list' },
      { status: 500 }
    )
  }
}