import { LRUCache, RequestDeduplicator, CACHE_CONFIGS } from '@/lib/cache'

describe('LRUCache', () => {
  let cache: LRUCache<string>

  beforeEach(() => {
    jest.useFakeTimers()
    cache = new LRUCache({
      maxSize: 3,
      maxMemoryMB: 1,
      cacheDuration: 1000,
      cleanupInterval: 500
    })
  })

  afterEach(() => {
    cache.destroy()
    jest.useRealTimers()
  })

  describe('basic operations', () => {
    it('stores and retrieves values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('returns null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBe(null)
    })

    it('overwrites existing values', () => {
      cache.set('key1', 'value1')
      cache.set('key1', 'value2')
      expect(cache.get('key1')).toBe('value2')
    })
  })

  describe('size-based eviction', () => {
    it('evicts least recently used items when size limit is reached', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      // All items should be present
      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
      
      // Add another item, should evict the least recently used
      cache.set('key4', 'value4')
      
      // key1 should be evicted (least recently used)
      expect(cache.get('key1')).toBe(null)
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
      expect(cache.get('key4')).toBe('value4')
    })

    it('updates access count on get', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      // Access key1 to make it more recently used
      cache.get('key1')
      
      // Add another item
      cache.set('key4', 'value4')
      
      // key2 should be evicted instead of key1
      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBe(null)
      expect(cache.get('key3')).toBe('value3')
      expect(cache.get('key4')).toBe('value4')
    })

    it('considers timestamp when access counts are equal', () => {
      cache.set('key1', 'value1')
      
      jest.advanceTimersByTime(100)
      
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      // Add another item
      cache.set('key4', 'value4')
      
      // key1 should be evicted (oldest with same access count)
      expect(cache.get('key1')).toBe(null)
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
      expect(cache.get('key4')).toBe('value4')
    })
  })

  describe('memory-based eviction', () => {
    it('evicts items when memory limit is exceeded', () => {
      // Create cache with very small memory limit
      const smallCache = new LRUCache({
        maxSize: 10,
        maxMemoryMB: 0.000001, // Very small limit
        cacheDuration: 1000,
        cleanupInterval: 500
      })

      smallCache.set('key1', 'a'.repeat(1000))
      smallCache.set('key2', 'b'.repeat(1000))
      
      // First item should be evicted due to memory pressure
      expect(smallCache.get('key1')).toBe(null)
      expect(smallCache.get('key2')).toBe('b'.repeat(1000))
      
      smallCache.destroy()
    })
  })

  describe('time-based expiration', () => {
    it('expires items after cache duration', () => {
      cache.set('key1', 'value1')
      
      expect(cache.get('key1')).toBe('value1')
      
      // Fast forward past cache duration
      jest.advanceTimersByTime(1001)
      
      expect(cache.get('key1')).toBe(null)
    })

    it('does not expire items within cache duration', () => {
      cache.set('key1', 'value1')
      
      // Fast forward within cache duration
      jest.advanceTimersByTime(999)
      
      expect(cache.get('key1')).toBe('value1')
    })
  })

  describe('automatic cleanup', () => {
    it('automatically cleans up expired items', () => {
      cache.set('key1', 'value1')
      
      // Fast forward past cache duration and cleanup interval
      jest.advanceTimersByTime(1001)
      
      // Trigger cleanup
      jest.advanceTimersByTime(500)
      
      // Item should be cleaned up
      expect(cache.get('key1')).toBe(null)
    })

    it('stops cleanup on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      
      cache.destroy()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
      
      clearIntervalSpy.mockRestore()
    })
  })

  describe('cache statistics', () => {
    it('reports correct cache size', () => {
      expect(cache.getStats().size).toBe(0)
      
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      expect(cache.getStats().size).toBe(2)
    })

    it('reports memory usage', () => {
      cache.set('key1', 'value1')
      
      const stats = cache.getStats()
      expect(stats.memoryUsageMB).toBeGreaterThan(0)
    })

    it('updates stats after eviction', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      cache.set('key4', 'value4') // Should evict key1
      
      expect(cache.getStats().size).toBe(3)
    })
  })

  describe('clear functionality', () => {
    it('clears all items', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      cache.clear()
      
      expect(cache.get('key1')).toBe(null)
      expect(cache.get('key2')).toBe(null)
      expect(cache.getStats().size).toBe(0)
      expect(cache.getStats().memoryUsageMB).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty values', () => {
      cache.set('key1', '')
      expect(cache.get('key1')).toBe('')
    })

    it('handles null values', () => {
      cache.set('key1', null as any)
      expect(cache.get('key1')).toBe(null)
    })

    it('handles undefined values', () => {
      cache.set('key1', undefined as any)
      expect(cache.get('key1')).toBe(undefined)
    })

    it('handles complex objects', () => {
      const complexObject = { nested: { data: [1, 2, 3] } }
      cache.set('key1', JSON.stringify(complexObject))
      expect(JSON.parse(cache.get('key1')!)).toEqual(complexObject)
    })

    it('handles zero cache duration', () => {
      const zeroCache = new LRUCache({
        maxSize: 3,
        maxMemoryMB: 1,
        cacheDuration: 0,
        cleanupInterval: 500
      })

      zeroCache.set('key1', 'value1')
      expect(zeroCache.get('key1')).toBe(null) // Should expire immediately
      
      zeroCache.destroy()
    })
  })
})

describe('RequestDeduplicator', () => {
  let deduplicator: RequestDeduplicator

  beforeEach(() => {
    deduplicator = new RequestDeduplicator()
  })

  describe('request deduplication', () => {
    it('deduplicates identical requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('result')

      const promise1 = deduplicator.deduplicate('key1', mockFn)
      const promise2 = deduplicator.deduplicate('key1', mockFn)

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(result1).toBe('result')
      expect(result2).toBe('result')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('allows different keys to execute separately', async () => {
      const mockFn1 = jest.fn().mockResolvedValue('result1')
      const mockFn2 = jest.fn().mockResolvedValue('result2')

      const promise1 = deduplicator.deduplicate('key1', mockFn1)
      const promise2 = deduplicator.deduplicate('key2', mockFn2)

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(result1).toBe('result1')
      expect(result2).toBe('result2')
      expect(mockFn1).toHaveBeenCalledTimes(1)
      expect(mockFn2).toHaveBeenCalledTimes(1)
    })

    it('cleans up after request completion', async () => {
      const mockFn = jest.fn().mockResolvedValue('result')

      await deduplicator.deduplicate('key1', mockFn)

      // Second request with same key should execute again
      await deduplicator.deduplicate('key1', mockFn)

      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('handles rejected promises correctly', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('test error'))

      const promise1 = deduplicator.deduplicate('key1', mockFn)
      const promise2 = deduplicator.deduplicate('key1', mockFn)

      await expect(promise1).rejects.toThrow('test error')
      await expect(promise2).rejects.toThrow('test error')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('cleans up after rejected promises', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('test error'))

      try {
        await deduplicator.deduplicate('key1', mockFn)
      } catch {
        // Ignore error
      }

      // Second request should execute again
      try {
        await deduplicator.deduplicate('key1', mockFn)
      } catch {
        // Ignore error
      }

      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('clear functionality', () => {
    it('clears all pending requests', () => {
      const mockFn = jest.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

      deduplicator.deduplicate('key1', mockFn)
      deduplicator.deduplicate('key2', mockFn)

      deduplicator.clear()

      // New requests should execute
      deduplicator.deduplicate('key1', mockFn)
      deduplicator.deduplicate('key1', mockFn)

      expect(mockFn).toHaveBeenCalledTimes(3) // 2 initial + 1 after clear
    })
  })

  describe('edge cases', () => {
    it('handles functions that throw synchronously', async () => {
      const mockFn = jest.fn().mockImplementation(() => {
        throw new Error('sync error')
      })

      await expect(deduplicator.deduplicate('key1', mockFn)).rejects.toThrow('sync error')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('handles empty string keys', async () => {
      const mockFn = jest.fn().mockResolvedValue('result')

      const result = await deduplicator.deduplicate('', mockFn)

      expect(result).toBe('result')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('handles null and undefined keys', async () => {
      const mockFn = jest.fn().mockResolvedValue('result')

      const result1 = await deduplicator.deduplicate(null as any, mockFn)
      const result2 = await deduplicator.deduplicate(undefined as any, mockFn)

      expect(result1).toBe('result')
      expect(result2).toBe('result')
      expect(mockFn).toHaveBeenCalledTimes(2) // Different keys
    })
  })
})

describe('CACHE_CONFIGS', () => {
  it('exports predefined cache configurations', () => {
    expect(CACHE_CONFIGS.weather).toBeDefined()
    expect(CACHE_CONFIGS.cities).toBeDefined()
    expect(CACHE_CONFIGS.packingList).toBeDefined()
  })

  it('has reasonable default values', () => {
    expect(CACHE_CONFIGS.weather.maxSize).toBeGreaterThan(0)
    expect(CACHE_CONFIGS.weather.maxMemoryMB).toBeGreaterThan(0)
    expect(CACHE_CONFIGS.weather.cacheDuration).toBeGreaterThan(0)
    expect(CACHE_CONFIGS.weather.cleanupInterval).toBeGreaterThan(0)
  })

  it('has different configurations for different cache types', () => {
    expect(CACHE_CONFIGS.weather.cacheDuration).not.toBe(CACHE_CONFIGS.cities.cacheDuration)
    expect(CACHE_CONFIGS.cities.maxSize).not.toBe(CACHE_CONFIGS.packingList.maxSize)
  })

  it('has appropriate cache durations for different data types', () => {
    // Weather data should have shorter cache duration than cities
    expect(CACHE_CONFIGS.weather.cacheDuration).toBeLessThan(CACHE_CONFIGS.cities.cacheDuration)
    
    // Packing lists should have longer cache duration
    expect(CACHE_CONFIGS.packingList.cacheDuration).toBeGreaterThan(CACHE_CONFIGS.weather.cacheDuration)
  })
})