'use client'

import React, { useState, use, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useTripDetail } from '@/hooks/useTripDetail'
import { PackingItemComponent } from '@/components/packing/PackingItemComponent'
import { AddItemForm } from '@/components/packing/AddItemForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Loading } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import type { PackingCategory, PackingItem } from '@/types'

// Lazy load WeatherForecast component
const WeatherForecast = lazy(() =>
  import('@/components/ui/WeatherForecast').then(module => ({ default: module.WeatherForecast }))
)

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const tripId = resolvedParams.id

  const {
    trip,
    packingItems,
    statistics,
    isLoading,
    error,
    updateTrip,
    addItem,
    updateItem,
    deleteItem,
    toggleItemPacked,
  } = useTripDetail(tripId)

  const { addToast } = useToast()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)

  const handleTogglePacked = async (itemId: string) => {
    const success = await toggleItemPacked(itemId)
    if (!success) {
      addToast({ title: 'Failed to update item', type: 'error' })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    const confirmed = window.confirm('Delete this item?')
    if (!confirmed) return

    const success = await deleteItem(itemId)
    if (success) {
      addToast({ title: 'Item deleted', type: 'success' })
    } else {
      addToast({ title: 'Failed to delete item', type: 'error' })
    }
  }

  const handleEditItem = async (itemId: string, newName: string) => {
    if (!newName.trim()) return
    const success = await updateItem(itemId, { name: newName })
    if (success) {
      addToast({ title: 'Item updated', type: 'success' })
      setEditingItem(null)
    } else {
      addToast({ title: 'Failed to update item', type: 'error' })
    }
  }

  const handleAddItem = async (item: Omit<PackingItem, 'id' | 'packed' | 'custom'>) => {
    const newItem = await addItem({
      name: item.name,
      category: item.category,
      essential: item.essential,
    })
    if (newItem) {
      addToast({ title: 'Item added', type: 'success' })
      setShowAddItem(false)
    } else {
      addToast({ title: 'Failed to add item', type: 'error' })
    }
  }

  const handleSaveNotes = async () => {
    const success = await updateTrip({ notes })
    if (success) {
      addToast({ title: 'Notes saved', type: 'success' })
      setIsEditingNotes(false)
    } else {
      addToast({ title: 'Failed to save notes', type: 'error' })
    }
  }

  const handleMarkComplete = async () => {
    const confirmed = window.confirm('Mark this trip as completed?')
    if (!confirmed) return

    const success = await updateTrip({ status: 'completed' })
    if (success) {
      addToast({ title: 'Trip marked as completed!', type: 'success' })
    } else {
      addToast({ title: 'Failed to update trip', type: 'error' })
    }
  }

  const handleArchiveTrip = async () => {
    const confirmed = window.confirm('Archive this trip?')
    if (!confirmed) return

    const success = await updateTrip({ status: 'archived' })
    if (success) {
      addToast({ title: 'Trip archived', type: 'success' })
    } else {
      addToast({ title: 'Failed to archive trip', type: 'error' })
    }
  }

  const handleToggleFavorite = async () => {
    if (!trip) return
    const success = await updateTrip({ is_favorite: !trip.is_favorite })
    if (success) {
      addToast({
        title: trip.is_favorite ? 'Removed from favorites' : 'Added to favorites',
        type: 'success',
      })
    } else {
      addToast({ title: 'Failed to update trip', type: 'error' })
    }
  }

  // Group items by category
  const groupedItems = packingItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof packingItems>)

  const categories: PackingCategory[] = [
    'clothing',
    'toiletries',
    'electronics',
    'travel_documents',
    'medication',
    'miscellaneous',
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Trip Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'This trip could not be loaded.'}
          </p>
          <Button onClick={() => router.push('/trips')}>Back to Trips</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push('/trips')} className="mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Trips
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weather Sidebar - Left */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Suspense fallback={
                <Card className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading weather...</span>
                  </div>
                </Card>
              }>
                <WeatherForecast
                  city={trip.destination_city}
                  country={trip.destination_country}
                />
              </Suspense>
            </div>
          </div>

          {/* Trip Content - Right */}
          <div className="lg:col-span-2">
            {/* Header */}

            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {trip.destination_display_name || `${trip.destination_city}, ${trip.destination_country}`}
                    </h1>
                    <button
                      onClick={handleToggleFavorite}
                      className={`text-2xl ${trip.is_favorite ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500`}
                    >
                      {trip.is_favorite ? '★' : '☆'}
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {trip.duration} {trip.duration === 1 ? 'day' : 'days'} • {trip.trip_type} trip
                  </p>
                  {trip.start_date && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(trip.start_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {trip.end_date && (
                        <> → {new Date(trip.end_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}</>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {trip.status === 'active' && (
                    <Button variant="outline" size="sm" onClick={handleMarkComplete}>
                      Mark Complete
                    </Button>
                  )}
                  {trip.status !== 'archived' && (
                    <Button variant="outline" size="sm" onClick={handleArchiveTrip}>
                      Archive
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Packing Progress
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {statistics.packedItems} / {statistics.totalItems} items packed
                  </span>
                </div>
                <ProgressBar value={statistics.completionPercentage} showPercentage={false} />
              </div>

              {/* Notes */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trip Notes
                  </label>
                  {!isEditingNotes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNotes(trip.notes || '')
                        setIsEditingNotes(true)
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {isEditingNotes ? (
                  <div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Add notes about your trip..."
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={handleSaveNotes}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {trip.notes || 'No notes yet'}
                  </p>
                )}
              </div>
            </Card>

            {/* Packing List */}
            <div className="mb-6 mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Packing List</h2>
                <Button onClick={() => setShowAddItem(!showAddItem)}>
                  {showAddItem ? 'Cancel' : 'Add Item'}
                </Button>
              </div>

              {showAddItem && (
                <Card className="p-4 mb-4">
                  <AddItemForm onAddItem={handleAddItem} />
                </Card>
              )}

              {packingItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No packing items yet. Add your first item to get started!
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {categories.map(category => {
                    const items = groupedItems[category] || []
                    if (items.length === 0) return null

                    return (
                      <Card key={category} className="p-5">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                          {category.replace('_', ' ')}
                        </h3>
                        <div className="space-y-2">
                          {items.map(item => (
                            <PackingItemComponent
                              key={item.id}
                              item={{
                                id: item.id,
                                name: item.name,
                                category: item.category,
                                essential: item.essential,
                                packed: item.packed,
                                custom: item.custom,
                              }}
                              editingItem={editingItem}
                              onTogglePacked={() => handleTogglePacked(item.id)}
                              onDelete={() => handleDeleteItem(item.id)}
                              onEdit={(itemId, newName) => handleEditItem(itemId, newName)}
                              onStartEdit={(itemId) => setEditingItem(itemId)}
                              onCancelEdit={() => setEditingItem(null)}
                            />
                          ))}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
