import { useState, useEffect, useCallback } from 'react'
import type { Trip, PackingItemDb, AddPackingItemRequest, UpdatePackingItemRequest } from '@/types'

interface TripStatistics {
  totalItems: number
  packedItems: number
  completionPercentage: number
}

interface UseTripDetailReturn {
  trip: Trip | null
  packingItems: PackingItemDb[]
  statistics: TripStatistics
  isLoading: boolean
  error: string | null
  fetchTrip: () => Promise<void>
  updateTrip: (updates: Partial<Trip>) => Promise<boolean>
  addItem: (item: AddPackingItemRequest) => Promise<PackingItemDb | null>
  updateItem: (itemId: string, updates: UpdatePackingItemRequest) => Promise<boolean>
  deleteItem: (itemId: string) => Promise<boolean>
  toggleItemPacked: (itemId: string) => Promise<boolean>
  refreshTrip: () => Promise<void>
}

export function useTripDetail(tripId: string): UseTripDetailReturn {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [packingItems, setPackingItems] = useState<PackingItemDb[]>([])
  const [statistics, setStatistics] = useState<TripStatistics>({
    totalItems: 0,
    packedItems: 0,
    completionPercentage: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrip = useCallback(async () => {
    if (!tripId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch trip')
      }

      const data = await response.json()
      setTrip(data.trip)
      setPackingItems(data.packingItems)
      setStatistics(data.statistics)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trip'
      setError(errorMessage)
      console.error('Error fetching trip:', err)
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  const updateTrip = useCallback(async (updates: Partial<Trip>): Promise<boolean> => {
    if (!tripId) return false

    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update trip')
      }

      const data = await response.json()
      if (data.success && data.trip) {
        setTrip(data.trip)
        return true
      }

      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trip'
      setError(errorMessage)
      console.error('Error updating trip:', err)
      return false
    }
  }, [tripId])

  const addItem = useCallback(async (item: AddPackingItemRequest): Promise<PackingItemDb | null> => {
    if (!tripId) return null

    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add item')
      }

      const data = await response.json()
      if (data.success && data.item) {
        // Add item to local state
        setPackingItems(prevItems => [...prevItems, data.item])
        
        // Recalculate statistics
        const newItems = [...packingItems, data.item]
        const totalItems = newItems.length
        const packedItems = newItems.filter(i => i.packed).length
        setStatistics({
          totalItems,
          packedItems,
          completionPercentage: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
        })

        return data.item
      }

      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item'
      setError(errorMessage)
      console.error('Error adding item:', err)
      return null
    }
  }, [tripId, packingItems])

  const updateItem = useCallback(async (
    itemId: string,
    updates: UpdatePackingItemRequest
  ): Promise<boolean> => {
    if (!tripId) return false

    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update item')
      }

      const data = await response.json()
      if (data.success && data.item) {
        // Update item in local state
        setPackingItems(prevItems =>
          prevItems.map(item => (item.id === itemId ? data.item : item))
        )

        // Recalculate statistics if packed status changed
        if (updates.packed !== undefined) {
          const newItems = packingItems.map(item =>
            item.id === itemId ? { ...item, packed: updates.packed! } : item
          )
          const totalItems = newItems.length
          const packedItems = newItems.filter(i => i.packed).length
          setStatistics({
            totalItems,
            packedItems,
            completionPercentage: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
          })
        }

        return true
      }

      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item'
      setError(errorMessage)
      console.error('Error updating item:', err)
      return false
    }
  }, [tripId, packingItems])

  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!tripId) return false

    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/items/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete item')
      }

      const data = await response.json()
      if (data.success) {
        // Remove item from local state
        setPackingItems(prevItems => prevItems.filter(item => item.id !== itemId))

        // Recalculate statistics
        const newItems = packingItems.filter(item => item.id !== itemId)
        const totalItems = newItems.length
        const packedItems = newItems.filter(i => i.packed).length
        setStatistics({
          totalItems,
          packedItems,
          completionPercentage: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
        })

        return true
      }

      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item'
      setError(errorMessage)
      console.error('Error deleting item:', err)
      return false
    }
  }, [tripId, packingItems])

  const toggleItemPacked = useCallback(async (itemId: string): Promise<boolean> => {
    const item = packingItems.find(i => i.id === itemId)
    if (!item) return false

    return updateItem(itemId, { packed: !item.packed })
  }, [packingItems, updateItem])

  const refreshTrip = useCallback(async () => {
    await fetchTrip()
  }, [fetchTrip])

  // Fetch trip on mount and when tripId changes
  useEffect(() => {
    if (tripId) {
      fetchTrip()
    }
  }, [tripId, fetchTrip])

  return {
    trip,
    packingItems,
    statistics,
    isLoading,
    error,
    fetchTrip,
    updateTrip,
    addItem,
    updateItem,
    deleteItem,
    toggleItemPacked,
    refreshTrip,
  }
}
