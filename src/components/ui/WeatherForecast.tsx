'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { Cloud, CloudRain, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardContent } from './Card'
import { WeatherData, formatDate, convertTemperature } from '@/lib/utils'

interface WeatherForecastProps {
  city: string
  country: string
}

function WeatherForecastComponent({ city, country }: WeatherForecastProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C')

  const fetchWeather = useCallback(async () => {
    if (!city || !country) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`)
      
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
              <Cloud className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Weather Forecast</h3>
            </div>
            {/* Temperature Unit Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={toggleToCelsius}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  temperatureUnit === 'C'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                °C
              </button>
              <button
                onClick={toggleToFahrenheit}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  temperatureUnit === 'F'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600">Loading weather...</span>
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
              <Cloud className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Weather Forecast</h3>
            </div>
            {/* Temperature Unit Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={toggleToCelsius}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  temperatureUnit === 'C'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                °C
              </button>
              <button
                onClick={toggleToFahrenheit}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  temperatureUnit === 'F'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
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
            <span className="ml-2 text-slate-600">{error}</span>
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
            <Cloud className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Weather Forecast</h3>
          </div>
          {/* Temperature Unit Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTemperatureUnit('C')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                temperatureUnit === 'C'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setTemperatureUnit('F')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                temperatureUnit === 'F'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              °F
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-600">{weatherData.location}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weatherData.forecast.map((day, index) => (
            <div
              key={day.date}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                index === 0
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{day.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {formatDate(day.date)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {day.description}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {convertTemperature(day.maxTemp, 'C', temperatureUnit)}° / {convertTemperature(day.minTemp, 'C', temperatureUnit)}°
                </div>
                {day.precipitationProbability > 0 && (
                  <div className="text-sm text-blue-600 flex items-center">
                    <CloudRain className="w-3 h-3 mr-1" />
                    {day.precipitationProbability}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-slate-500 text-center">
            Weather data provided by Open-Meteo
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export const WeatherForecast = memo(WeatherForecastComponent)