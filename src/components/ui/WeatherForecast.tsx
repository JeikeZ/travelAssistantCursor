'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { Cloud, CloudRain, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardContent } from './Card'
import { formatDate, convertTemperature } from '@/lib/utils'
import { WeatherData, TemperatureUnit } from '@/types'
import { API_ENDPOINTS } from '@/lib/constants'

interface WeatherForecastProps {
  city: string
  country: string
}

function WeatherForecastComponent({ city, country }: WeatherForecastProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('C')

  const fetchWeather = useCallback(async () => {
    if (!city || !country) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_ENDPOINTS.weather}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }
      
      const data: WeatherData = await response.json()
      setWeatherData(data)
    } catch (err) {
      console.error('Error fetching weather:', err)
      setError('Unable to load weather data')
    } finally {
      setIsLoading(false)
    }
  }, [city, country])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  const toggleToCelsius = useCallback(() => {
    setTemperatureUnit('C')
  }, [])

  const toggleToFahrenheit = useCallback(() => {
    setTemperatureUnit('F')
  }, [])

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weather Forecast</h3>
            </div>
          {/* Temperature Unit Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={toggleToCelsius}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                temperatureUnit === 'C'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              onClick={toggleToFahrenheit}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                temperatureUnit === 'F'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              °F
            </button>
          </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-600 dark:text-gray-400" />
            <span className="ml-2 text-gray-700 dark:text-gray-300">Loading weather...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weather Forecast</h3>
            </div>
          {/* Temperature Unit Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={toggleToCelsius}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                temperatureUnit === 'C'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              onClick={toggleToFahrenheit}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                temperatureUnit === 'F'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              °F
            </button>
          </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <CloudRain className="w-6 h-6 text-gray-400" />
            <span className="ml-2 text-gray-700 dark:text-gray-300">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weatherData) return null

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weather Forecast</h3>
          </div>
          {/* Temperature Unit Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTemperatureUnit('C')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                temperatureUnit === 'C'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setTemperatureUnit('F')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                temperatureUnit === 'F'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              °F
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{weatherData.location}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weatherData.forecast.map((day) => {
            // Check if this day is today
            const isToday = (() => {
              try {
                const dayDate = new Date(day.date)
                const today = new Date()
                dayDate.setHours(0, 0, 0, 0)
                today.setHours(0, 0, 0, 0)
                return dayDate.getTime() === today.getTime()
              } catch {
                return false
              }
            })()
            
            return (
              <div
                key={day.date}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  isToday
                    ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className={`${isToday ? 'text-3xl' : 'text-2xl'}`}>{day.icon}</span>
                  <div>
                    <div className={`font-medium ${isToday ? 'text-gray-900 dark:text-white text-lg' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatDate(day.date)}
                    </div>
                    <div className={`text-sm ${isToday ? 'text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {day.description}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-semibold ${isToday ? 'text-gray-900 dark:text-white text-lg' : 'text-gray-900 dark:text-gray-100'}`}>
                    {convertTemperature(day.maxTemp, 'C', temperatureUnit)}° / {convertTemperature(day.minTemp, 'C', temperatureUnit)}°
                  </div>
                  {day.precipitationProbability > 0 && (
                    <div className={`text-sm flex items-center ${isToday ? 'text-gray-600 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      <CloudRain className="w-3 h-3 mr-1" />
                      {day.precipitationProbability}%
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Weather data provided by Open-Meteo
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export const WeatherForecast = memo(WeatherForecastComponent)