'use client'

import React, { useState, useEffect } from 'react'
import { Trip } from '@/types'
import { WeatherForecast } from '@/components/ui/WeatherForecast'
import { Card } from '@/components/ui/Card'
import { Cloud, ChevronDown } from 'lucide-react'

interface WeatherSidebarProps {
  trips: Trip[]
  selectedTripId?: string | null
  onTripSelect: (tripId: string) => void
}

export function WeatherSidebar({ trips, selectedTripId, onTripSelect }: WeatherSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Get unique destinations to avoid showing weather for duplicate locations
  const uniqueDestinations = trips.reduce((acc, trip) => {
    const key = `${trip.destination_city}-${trip.destination_country}`
    if (!acc.some(t => `${t.destination_city}-${t.destination_country}` === key)) {
      acc.push(trip)
    }
    return acc
  }, [] as Trip[])

  const selectedTrip = selectedTripId 
    ? trips.find(t => t.id === selectedTripId) 
    : null

  // Auto-select the first active trip or most recent trip
  useEffect(() => {
    if (!selectedTripId && uniqueDestinations.length > 0) {
      const activeTrip = uniqueDestinations.find(t => t.status === 'active')
      const tripToSelect = activeTrip || uniqueDestinations[0]
      onTripSelect(tripToSelect.id)
    }
  }, [selectedTripId, uniqueDestinations, onTripSelect])

  if (trips.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center">
          <Cloud className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Trips Yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create a trip to see weather forecasts
          </p>
        </div>
      </Card>
    )
  }

  if (!selectedTrip) {
    return null
  }

  const formatTripLabel = (trip: Trip) => {
    const displayName = trip.destination_display_name || 
      `${trip.destination_city}, ${trip.destination_country}`
    const statusEmoji = trip.status === 'active' ? '✈️' : 
                       trip.status === 'completed' ? '✅' : '📁'
    return `${statusEmoji} ${displayName}`
  }

  return (
    <div className="space-y-4">
      {/* Mobile Toggle Header */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900 dark:text-white">
              Weather Forecast
            </span>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Weather Content */}
      <div className={`${!isExpanded ? 'hidden lg:block' : 'block'}`}>
        {/* Trip Selector Dropdown */}
        {uniqueDestinations.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Destination
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {formatTripLabel(selectedTrip)}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 ml-2 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  
                  {/* Dropdown Content */}
                  <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {uniqueDestinations.map(trip => {
                      const isSelected = trip.id === selectedTripId
                      return (
                        <button
                          key={trip.id}
                          onClick={() => {
                            onTripSelect(trip.id)
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' 
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                isSelected 
                                  ? 'text-blue-900 dark:text-blue-200' 
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {trip.destination_display_name || 
                                  `${trip.destination_city}, ${trip.destination_country}`}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {trip.duration} {trip.duration === 1 ? 'day' : 'days'} • {
                                  trip.status.charAt(0).toUpperCase() + trip.status.slice(1)
                                }
                              </p>
                            </div>
                            {isSelected && (
                              <span className="ml-2 text-blue-600 dark:text-blue-400">✓</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Weather Forecast Component */}
        <WeatherForecast
          city={selectedTrip.destination_city}
          country={selectedTrip.destination_country}
        />

        {/* Info Card */}
        <Card className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Planning Tip
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Weather forecasts are most accurate within 7 days. Check again closer to your trip date!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
