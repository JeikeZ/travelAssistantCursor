'use client'

import React from 'react'
import { Trip } from '@/types'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface TripCardProps {
  trip: Trip
  onView?: (tripId: string) => void
  onDuplicate?: (tripId: string) => void
  onDelete?: (tripId: string) => void
  onToggleFavorite?: (tripId: string) => void
}

export function TripCard({
  trip,
  onView,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}: TripCardProps) {
  const handleView = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onView) {
      onView(trip.id)
    }
  }

  const handleCardClick = () => {
    if (onView) {
      onView(trip.id)
    }
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDuplicate) {
      onDuplicate(trip.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(trip.id)
    }
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(trip.id)
    }
  }

  const statusColors = {
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  }

  const tripTypeLabels = {
    business: 'Business',
    leisure: 'Leisure',
    beach: 'Beach',
    hiking: 'Hiking',
    city: 'City',
    winter: 'Winter',
    backpacking: 'Backpacking',
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {trip.destination_display_name || `${trip.destination_city}, ${trip.destination_country}`}
                </h3>
                {trip.is_favorite && (
                  <button
                    onClick={handleToggleFavorite}
                    className="text-yellow-500 hover:text-yellow-600"
                    aria-label="Remove from favorites"
                  >
                    ★
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {trip.duration} {trip.duration === 1 ? 'day' : 'days'} • {tripTypeLabels[trip.trip_type]}
              </p>
            </div>
            <span
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                statusColors[trip.status]
              )}
            >
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </span>
          </div>

          {/* Dates */}
          {trip.start_date && (
            <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
              <span>{formatDate(trip.start_date)}</span>
              {trip.end_date && (
                <>
                  <span className="mx-1">→</span>
                  <span>{formatDate(trip.end_date)}</span>
                </>
              )}
            </div>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Packing Progress
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {trip.completion_percentage}%
              </span>
            </div>
              <ProgressBar value={trip.completion_percentage} showPercentage={false} />
          </div>

          {/* Notes (if any) */}
          {trip.notes && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
              {trip.notes}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="flex-1"
            >
              View Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicate}
              aria-label="Duplicate trip"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              aria-label="Delete trip"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          </div>
        </div>
    </Card>
  )
}
