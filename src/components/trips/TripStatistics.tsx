'use client'

import React from 'react'
import { TripStatistics as TripStatsType } from '@/types'
import { Card } from '@/components/ui/Card'

interface TripStatisticsProps {
  stats: TripStatsType
}

export function TripStatistics({ stats }: TripStatisticsProps) {
  const statCards = [
    {
      label: 'Total Trips',
      value: stats.totalTrips,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
          />
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Active Trips',
      value: stats.activeTrips,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      label: 'Completed',
      value: stats.completedTrips,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Countries Visited',
      value: stats.totalCountriesVisited,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Most Visited Destinations */}
      {stats.mostVisitedDestinations.length > 0 && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Visited Destinations
          </h3>
          <div className="space-y-3">
            {stats.mostVisitedDestinations.map((dest, index) => (
              <div
                key={dest.destination}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {dest.destination}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {dest.count} {dest.count === 1 ? 'trip' : 'trips'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Favorite Trips */}
      {stats.favoriteTrips.length > 0 && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-500">★</span>
            Favorite Trips
          </h3>
          <div className="space-y-2">
            {stats.favoriteTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {trip.destination_display_name || `${trip.destination_city}, ${trip.destination_country}`}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {trip.duration} {trip.duration === 1 ? 'day' : 'days'} • {trip.trip_type}
                  </p>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(trip.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
