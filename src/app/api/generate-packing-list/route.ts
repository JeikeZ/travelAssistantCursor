import { NextRequest, NextResponse } from 'next/server'
import { generatePackingList, TripData } from '@/lib/openai'

// Enhanced cache for packing lists
class PackingListCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>()
  private readonly maxSize = 200
  private readonly cacheDuration = 24 * 60 * 60 * 1000 // 24 hours

  get(key: string): unknown | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() - entry.timestamp > this.cacheDuration) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set(key: string, data: unknown): void {
    // Simple LRU: remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }
}

const packingListCache = new PackingListCache()

// Request deduplication
class PackingListDeduplicator {
  private pendingRequests = new Map<string, Promise<unknown>>()

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }
}

const packingListDeduplicator = new PackingListDeduplicator()

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