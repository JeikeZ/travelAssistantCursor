import { GET } from '@/app/api/weather/route'
import { NextRequest } from 'next/server'

// Mock the external API
global.fetch = jest.fn()

describe('/api/weather', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  const mockGeocodingResponse = {
    results: [
      {
        id: 1850147,
        name: 'Tokyo',
        latitude: 35.6895,
        longitude: 139.69171,
        country: 'Japan',
        admin1: 'Tokyo',
        feature_code: 'PPLC'
      }
    ]
  }

  const mockWeatherResponse = {
    daily: {
      time: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'],
      temperature_2m_max: [15, 16, 14, 13, 17, 18, 16],
      temperature_2m_min: [8, 9, 7, 6, 10, 11, 9],
      weather_code: [0, 1, 2, 61, 0, 1, 3],
      precipitation_probability_max: [0, 10, 20, 80, 0, 5, 30]
    }
  }

  describe('GET /api/weather', () => {
    it('should return weather data for valid city and country', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodingResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherResponse
        })

      const request = new NextRequest('http://localhost:3000/api/weather?city=Tokyo&country=Japan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.location).toBe('Tokyo, Japan')
      expect(data.coordinates).toEqual({
        lat: 35.6895,
        lon: 139.69171
      })
      expect(data.forecast).toHaveLength(7)
      expect(data.forecast[0]).toMatchObject({
        date: '2024-01-01',
        maxTemp: 15,
        minTemp: 8,
        weatherCode: 0,
        description: 'Clear sky',
        icon: '☀️',
        precipitationProbability: 0
      })
    })

    it('should return 400 for missing city parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/weather?country=Japan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('City and country parameters are required')
      expect(data.code).toBe('MISSING_PARAMETERS')
    })

    it('should return 400 for missing country parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/weather?city=Tokyo')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('City and country parameters are required')
      expect(data.code).toBe('MISSING_PARAMETERS')
    })

    it('should return 400 for too long parameters', async () => {
      const longString = 'a'.repeat(101)
      const request = new NextRequest(`http://localhost:3000/api/weather?city=${longString}&country=Japan`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Parameter values too long')
      expect(data.code).toBe('INVALID_INPUT')
    })

    it('should return 404 for location not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      })

      const request = new NextRequest('http://localhost:3000/api/weather?city=NonExistent&country=Nowhere')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Location not found')
      expect(data.code).toBe('LOCATION_NOT_FOUND')
    })

    it('should handle geocoding API failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const request = new NextRequest('http://localhost:3000/api/weather?city=Tokyo&country=Japan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch weather data')
      expect(data.code).toBe('INTERNAL_ERROR')
    })

    it('should handle weather API failure', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodingResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        })

      const request = new NextRequest('http://localhost:3000/api/weather?city=Tokyo&country=Japan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch weather data')
      expect(data.code).toBe('INTERNAL_ERROR')
    })

    it('should handle API timeout', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 20000)
        )
      )

      const request = new NextRequest('http://localhost:3000/api/weather?city=Tokyo&country=Japan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(504)
      expect(data.error).toBe('Request timeout')
      expect(data.code).toBe('TIMEOUT')
    })

    it('should find best country match in geocoding results', async () => {
      const multipleResults = {
        results: [
          {
            id: 1,
            name: 'Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            country: 'France',
            admin1: 'Île-de-France'
          },
          {
            id: 2,
            name: 'Paris',
            latitude: 33.6617,
            longitude: -95.5555,
            country: 'United States',
            admin1: 'Texas'
          }
        ]
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => multipleResults
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherResponse
        })

      const request = new NextRequest('http://localhost:3000/api/weather?city=Paris&country=France')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.coordinates).toEqual({
        lat: 48.8566,
        lon: 2.3522
      })
    })

    it('should use first result if no country match found', async () => {
      const multipleResults = {
        results: [
          {
            id: 1,
            name: 'Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            country: 'France',
            admin1: 'Île-de-France'
          },
          {
            id: 2,
            name: 'Paris',
            latitude: 33.6617,
            longitude: -95.5555,
            country: 'United States',
            admin1: 'Texas'
          }
        ]
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => multipleResults
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherResponse
        })

      const request = new NextRequest('http://localhost:3000/api/weather?city=Paris&country=Germany')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should use first result when no country match
      expect(data.coordinates).toEqual({
        lat: 48.8566,
        lon: 2.3522
      })
    })

    it('should filter forecast to current day and 7 days', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const weatherResponseWithPastDates = {
        daily: {
          time: [
            yesterday.toISOString().split('T')[0],
            today.toISOString().split('T')[0],
            ...Array.from({ length: 6 }, (_, i) => {
              const date = new Date(today)
              date.setDate(date.getDate() + i + 1)
              return date.toISOString().split('T')[0]
            })
          ],
          temperature_2m_max: [10, 15, 16, 14, 13, 17, 18, 16],
          temperature_2m_min: [5, 8, 9, 7, 6, 10, 11, 9],
          weather_code: [0, 0, 1, 2, 61, 0, 1, 3],
          precipitation_probability_max: [0, 0, 10, 20, 80, 0, 5, 30]
        }
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodingResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => weatherResponseWithPastDates
        })

      const request = new NextRequest('http://localhost:3000/api/weather?city=Tokyo&country=Japan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.forecast).toHaveLength(7)
      // Should not include yesterday's data
      expect(data.forecast.every((day: any) => new Date(day.date) >= today)).toBe(true)
    })
  })

  describe('Caching', () => {
    it('should include cache headers in response', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodingResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherResponse
        })

      const request = new NextRequest('http://localhost:3000/api/weather?city=Tokyo&country=Japan')
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toContain('public')
      expect(response.headers.get('Cache-Control')).toContain('max-age=1800')
    })
  })

  describe('Weather code mapping', () => {
    it('should map weather codes to descriptions and icons', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodingResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherResponse
        })

      const request = new NextRequest('http://localhost:3000/api/weather?city=Tokyo&country=Japan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.forecast[0].description).toBe('Clear sky')
      expect(data.forecast[0].icon).toBe('☀️')
      expect(data.forecast[3].description).toBe('Slight rain')
      expect(data.forecast[3].icon).toBe('🌦️')
    })

    it('should handle unknown weather codes', async () => {
      const weatherWithUnknownCode = {
        daily: {
          time: ['2024-01-01'],
          temperature_2m_max: [15],
          temperature_2m_min: [8],
          weather_code: [999], // Unknown code
          precipitation_probability_max: [0]
        }
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeocodingResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => weatherWithUnknownCode
        })

      const request = new NextRequest('http://localhost:3000/api/weather?city=Tokyo&country=Japan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.forecast[0].description).toBe('Unknown')
      expect(data.forecast[0].icon).toBe('❓')
    })
  })
})