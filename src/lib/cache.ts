// Shared cache utilities for better memory management and code reuse

export interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
  size: number
}

export interface CacheOptions {
  maxSize: number
  maxMemoryMB: number
  cacheDuration: number
  cleanupInterval: number
}

export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly maxSize: number
  private readonly maxMemoryMB: number
  private readonly cacheDuration: number
  private cleanupInterval: NodeJS.Timeout | null = null
  private currentMemoryUsage = 0

  constructor(options: CacheOptions) {
    this.maxSize = options.maxSize
    this.maxMemoryMB = options.maxMemoryMB
    this.cacheDuration = options.cacheDuration

    // Auto-cleanup expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, options.cleanupInterval)
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() - entry.timestamp > this.cacheDuration) {
      if (entry) {
        this.currentMemoryUsage -= entry.size
      }
      this.cache.delete(key)
      return null
    }
    
    // Update access count for LRU
    entry.accessCount++
    return entry.data
  }

  set(key: string, data: T): void {
    // Estimate memory usage
    const dataSize = JSON.stringify(data).length * 2 // 2 bytes per character for UTF-16
    
    // Remove expired entries first
    this.cleanup()
    
    // Memory-based eviction
    const maxMemoryBytes = this.maxMemoryMB * 1024 * 1024
    while (this.currentMemoryUsage + dataSize > maxMemoryBytes && this.cache.size > 0) {
      this.evictLeastUsed()
    }
    
    // Size-based eviction
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }
    
    this.cache.set(key, { 
      data, 
      timestamp: Date.now(), 
      accessCount: 1,
      size: dataSize
    })
    this.currentMemoryUsage += dataSize
  }

  private evictLeastUsed(): void {
    if (this.cache.size === 0) return
    
    let leastUsedKey = ''
    let leastAccessCount = Infinity
    let oldestTimestamp = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastAccessCount || 
          (entry.accessCount === leastAccessCount && entry.timestamp < oldestTimestamp)) {
        leastUsedKey = key
        leastAccessCount = entry.accessCount
        oldestTimestamp = entry.timestamp
      }
    }
    
    if (leastUsedKey) {
      const entry = this.cache.get(leastUsedKey)
      if (entry) {
        this.currentMemoryUsage -= entry.size
      }
      this.cache.delete(leastUsedKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheDuration) {
        this.currentMemoryUsage -= entry.size
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
    this.currentMemoryUsage = 0
  }

  getStats() {
    return {
      size: this.cache.size,
      memoryUsageMB: this.currentMemoryUsage / (1024 * 1024)
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Request deduplication utility
export class RequestDeduplicator {
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

  clear(): void {
    this.pendingRequests.clear()
  }
}

// Predefined cache configurations
export const CACHE_CONFIGS = {
  weather: {
    maxSize: 1000,
    maxMemoryMB: 30,
    cacheDuration: 45 * 60 * 1000, // 45 minutes
    cleanupInterval: 15 * 60 * 1000 // 15 minutes
  },
  cities: {
    maxSize: 2000,
    maxMemoryMB: 50,
    cacheDuration: 2 * 60 * 60 * 1000, // 2 hours
    cleanupInterval: 30 * 60 * 1000 // 30 minutes
  },
  packingList: {
    maxSize: 500,
    maxMemoryMB: 20,
    cacheDuration: 48 * 60 * 60 * 1000, // 48 hours
    cleanupInterval: 60 * 60 * 1000 // 1 hour
  }
} as const