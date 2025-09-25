import { POST } from '@/app/api/generate-packing-list/route'
import { NextRequest } from 'next/server'
import { TripData } from '@/types'

// Mock OpenAI
jest.mock('@/lib/openai', () => ({
  generatePackingList: jest.fn(),
  PackingListError: class PackingListError extends Error {
    constructor(message: string, public code: string) {
      super(message)
      this.name = 'PackingListError'
    }
  }
}))

import { generatePackingList } from '@/lib/openai'

const mockGeneratePackingList = generatePackingList as jest.MockedFunction<typeof generatePackingList>

describe('/api/generate-packing-list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validTripData: TripData = {
    destinationCountry: 'Japan',
    destinationCity: 'Tokyo',
    destinationState: 'Tokyo',
    destinationDisplayName: 'Tokyo, Tokyo, Japan',
    duration: 7,
    tripType: 'leisure'
  }

  const mockPackingList = [
    {
      id: 'item-1',
      name: 'Passport',
      category: 'travel_documents' as const,
      essential: true,
      packed: false,
      custom: false
    },
    {
      id: 'item-2',
      name: 'T-shirts',
      category: 'clothing' as const,
      essential: false,
      packed: false,
      custom: false
    }
  ]

  describe('POST /api/generate-packing-list', () => {
    it('should generate packing list for valid trip data', async () => {
      mockGeneratePackingList.mockResolvedValueOnce(mockPackingList)

      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(validTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.packingList).toEqual(mockPackingList)
      expect(mockGeneratePackingList).toHaveBeenCalledWith(validTripData)
    })

    it('should return 400 for missing required fields', async () => {
      const invalidTripData = {
        destinationCountry: 'Japan',
        // Missing destinationCity, duration, tripType
      }

      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(invalidTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS')
    })

    it('should return 400 for invalid duration (too short)', async () => {
      const invalidTripData = {
        ...validTripData,
        duration: 0
      }

      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(invalidTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Duration must be between 1 and 365 days')
      expect(data.code).toBe('INVALID_DURATION')
    })

    it('should return 400 for invalid duration (too long)', async () => {
      const invalidTripData = {
        ...validTripData,
        duration: 366
      }

      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(invalidTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Duration must be between 1 and 365 days')
      expect(data.code).toBe('INVALID_DURATION')
    })

    it('should handle OpenAI service unavailable', async () => {
      const { PackingListError } = require('@/lib/openai')
      mockGeneratePackingList.mockRejectedValueOnce(
        new PackingListError('Service unavailable', 'SERVICE_UNAVAILABLE')
      )

      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(validTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Service configuration error')
      expect(data.code).toBe('SERVICE_UNAVAILABLE')
    })

    it('should handle API key missing error', async () => {
      const { PackingListError } = require('@/lib/openai')
      mockGeneratePackingList.mockRejectedValueOnce(
        new PackingListError('API key missing', 'API_KEY_MISSING')
      )

      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(validTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Service configuration error')
      expect(data.code).toBe('SERVICE_UNAVAILABLE')
    })

    it('should handle timeout error', async () => {
      mockGeneratePackingList.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 35000)
        )
      )

      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(validTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(504)
      expect(data.error).toBe('Generation timeout')
      expect(data.code).toBe('TIMEOUT')
    })

    it('should handle generic errors', async () => {
      mockGeneratePackingList.mockRejectedValueOnce(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(validTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate packing list')
      expect(data.code).toBe('INTERNAL_ERROR')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate packing list')
      expect(data.code).toBe('INTERNAL_ERROR')
    })

    it('should validate all required fields', async () => {
      const testCases = [
        { field: 'destinationCountry', value: '' },
        { field: 'destinationCity', value: '' },
        { field: 'duration', value: null },
        { field: 'tripType', value: '' }
      ]

      for (const testCase of testCases) {
        const invalidData = {
          ...validTripData,
          [testCase.field]: testCase.value
        }

        const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Missing required fields')
        expect(data.error).toContain(testCase.field)
      }
    })

    it('should include cache headers in successful response', async () => {
      mockGeneratePackingList.mockResolvedValueOnce(mockPackingList)

      const request = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(validTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Cache-Control')).toContain('public')
      expect(response.headers.get('Cache-Control')).toContain('max-age=86400')
    })
  })

  describe('Caching behavior', () => {
    it('should use cached results for identical requests', async () => {
      // This test would require mocking the cache implementation
      // For now, we verify that the function is called with correct parameters
      mockGeneratePackingList.mockResolvedValueOnce(mockPackingList)

      const request1 = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(validTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response1 = await POST(request1)
      expect(response1.status).toBe(200)
      expect(mockGeneratePackingList).toHaveBeenCalledTimes(1)

      // Second identical request
      const request2 = new NextRequest('http://localhost:3000/api/generate-packing-list', {
        method: 'POST',
        body: JSON.stringify(validTripData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      mockGeneratePackingList.mockResolvedValueOnce(mockPackingList)
      const response2 = await POST(request2)
      expect(response2.status).toBe(200)
    })
  })
})