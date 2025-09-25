import { GET } from '@/app/api/cities/route'
import { NextRequest } from 'next/server'

// Mock the external API
global.fetch = jest.fn()

describe('/api/cities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('GET /api/cities', () => {
    it('should return cities for valid query', async () => {
      // Mock successful API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 1850147,
              name: 'Tokyo',
              latitude: 35.6895,
              longitude: 139.69171,
              country: 'Japan',
              admin1: 'Tokyo',
              feature_code: 'PPLC',
              population: 37977000
            }
          ]
        })
      })

      const request = new NextRequest('http://localhost:3000/api/cities?q=Tokyo')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cities).toBeDefined()
      expect(data.cities).toHaveLength(1)
      expect(data.cities[0]).toMatchObject({
        name: 'Tokyo',
        country: 'Japan',
        displayName: expect.stringContaining('Tokyo')
      })
    })

    it('should handle country search', async () => {
      // Mock API response for country search
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                id: 1861060,
                name: 'Japan',
                country: 'Japan',
                feature_code: 'PCLI',
                latitude: 36,
                longitude: 138
              },
              {
                id: 1850147,
                name: 'Tokyo',
                latitude: 35.6895,
                longitude: 139.69171,
                country: 'Japan',
                admin1: 'Tokyo',
                feature_code: 'PPLC',
                population: 37977000
              }
            ]
          })
        })
        // Mock additional API calls for major cities
        .mockResolvedValue({
          ok: true,
          json: async () => ({ results: [] })
        })

      const request = new NextRequest('http://localhost:3000/api/cities?q=Japan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cities).toBeDefined()
      expect(data.cities.length).toBeGreaterThan(0)
      expect(data.cities.every((city: any) => city.country === 'Japan')).toBe(true)
    })

    it('should return 400 for missing query', async () => {
      const request = new NextRequest('http://localhost:3000/api/cities')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query must be at least 2 characters long')
      expect(data.code).toBe('INVALID_QUERY_LENGTH')
    })

    it('should return 400 for short query', async () => {
      const request = new NextRequest('http://localhost:3000/api/cities?q=a')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query must be at least 2 characters long')
    })

    it('should return 400 for too long query', async () => {
      const longQuery = 'a'.repeat(201)
      const request = new NextRequest(`http://localhost:3000/api/cities?q=${longQuery}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query too long')
      expect(data.code).toBe('QUERY_TOO_LONG')
    })

    it('should handle API timeout', async () => {
      // Mock a timeout
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 15000)
        )
      )

      const request = new NextRequest('http://localhost:3000/api/cities?q=Tokyo')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(504)
      expect(data.error).toBe('Search timeout')
      expect(data.code).toBe('TIMEOUT')
    })

    it('should handle API error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const request = new NextRequest('http://localhost:3000/api/cities?q=Tokyo')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to search cities')
      expect(data.code).toBe('INTERNAL_ERROR')
    })

    it('should return empty results for no matches', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      })

      const request = new NextRequest('http://localhost:3000/api/cities?q=nonexistent')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cities).toEqual([])
    })

    it('should filter results correctly for city search', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 1,
              name: 'Tokyo',
              latitude: 35.6895,
              longitude: 139.69171,
              country: 'Japan',
              admin1: 'Tokyo',
              feature_code: 'PPLC',
              population: 37977000
            },
            {
              id: 2,
              name: 'Japan',
              country: 'Japan',
              feature_code: 'PCLI',
              latitude: 36,
              longitude: 138
            }
          ]
        })
      })

      const request = new NextRequest('http://localhost:3000/api/cities?q=Tokyo')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cities).toBeDefined()
      // Should exclude country results for city search
      expect(data.cities.every((city: any) => city.name !== 'Japan')).toBe(true)
    })

    it('should handle malformed API response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' })
      })

      const request = new NextRequest('http://localhost:3000/api/cities?q=Tokyo')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cities).toEqual([])
    })
  })

  describe('Rate limiting', () => {
    it('should apply rate limiting', async () => {
      // This test would require mocking the rate limiter
      // For now, we'll test that the rate limiter is called
      const request = new NextRequest('http://localhost:3000/api/cities?q=Tokyo')
      
      // Mock rate limiter to return false (rate limited)
      jest.mock('@/lib/api-utils', () => ({
        ...jest.requireActual('@/lib/api-utils'),
        rateLimiter: {
          isAllowed: jest.fn().mockReturnValue(false)
        }
      }))

      // Note: This test would need to be restructured to properly test rate limiting
      // as the current implementation uses a singleton
    })
  })

  describe('Caching', () => {
    it('should include cache headers in response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      })

      const request = new NextRequest('http://localhost:3000/api/cities?q=Tokyo')
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toContain('public')
      expect(response.headers.get('Cache-Control')).toContain('max-age=3600')
    })
  })
})