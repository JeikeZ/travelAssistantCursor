'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  CheckCircle, 
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PackingItem, PackingItemDb } from '@/types'
import { usePackingList } from '@/hooks/usePackingList'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useToast } from '@/components/ui/Toast'

// Lazy load WeatherForecast component
const WeatherForecast = lazy(() => 
  import('@/components/ui/WeatherForecast').then(module => ({ default: module.WeatherForecast }))
)

import { PACKING_CATEGORIES, STORAGE_KEYS, API_ENDPOINTS, TRIP_TYPES } from '@/lib/constants'

import { PackingItemComponent } from '@/components/packing/PackingItemComponent'
import { AddItemForm } from '@/components/packing/AddItemForm'
import { PageHeader } from '@/components/layout/Header'

export default function PackingListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const [tripData] = useLocalStorage<{
    destinationCountry: string
    destinationCity: string
    destinationState?: string
    destinationDisplayName?: string
    duration: number
    tripType: string
  } | null>(STORAGE_KEYS.currentTrip, null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  
  // Solution 1 & 3: Synchronously initialize trip ID from URL or localStorage
  const [currentTripId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    
    // Priority 1: Get trip ID from URL query parameter
    const urlTripId = searchParams.get('tripId')
    if (urlTripId) {
      // Store in localStorage for page refreshes
      localStorage.setItem('currentTripId', urlTripId)
      return urlTripId
    }
    
    // Priority 2: Fallback to localStorage (for page refreshes)
    const storedTripId = localStorage.getItem('currentTripId')
    const userStr = localStorage.getItem('user')
    
    try {
      const user = userStr ? JSON.parse(userStr) : null
      // Only use trip ID if user is authenticated and not a guest
      return (storedTripId && user && !user.is_guest) ? storedTripId : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  })
  
  const [isSyncingToDb, setIsSyncingToDb] = useState(false)
  
  // Synchronously initialize hasUser state
  const [hasUser] = useState(() => {
    if (typeof window === 'undefined') return false
    const userStr = localStorage.getItem('user')
    try {
      const user = userStr ? JSON.parse(userStr) : null
      return !!user && !user.is_guest
    } catch (error) {
      console.error('Error parsing user data:', error)
      return false
    }
  })
  
  const {
    packingList,
    updatePackingList,
    toggleItemPacked: toggleItemPackedLocal,
    addCustomItem: addCustomItemLocal,
    deleteItem: deleteItemLocal,
    editItem: editItemLocal,
    progress,
    groupedItems,
    sortedCategories
  } = usePackingList(currentTripId || undefined)

  // Cleanup: Remove trip-specific packing list data when leaving the page
  // This prevents stale data from affecting other trips
  useEffect(() => {
    return () => {
      // On unmount, we keep the data in localStorage for quick return
      // but the trip-specific key ensures it won't interfere with other trips
    }
  }, [currentTripId])

  // Save packing list items to database and return ID mapping
  const savePackingListToDatabase = useCallback(async (items: PackingItem[], tripId: string): Promise<Map<string, string>> => {
    const idMapping = new Map<string, string>()
    const failedItems: string[] = []
    
    try {
      setIsSyncingToDb(true)
      
      // Sequential insert to capture database-generated IDs
      for (const item of items) {
        try {
          const response = await fetch(`/api/trips/${tripId}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: item.name,
              category: item.category,
              essential: item.essential,
              custom: item.custom, // Preserve custom field from AI-generated items
              quantity: 1,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.item) {
              // Map old client-side ID to new database UUID
              idMapping.set(item.id, data.item.id)
            } else {
              failedItems.push(item.name)
            }
          } else {
            failedItems.push(item.name)
          }
        } catch (itemError) {
          console.error(`Error saving item "${item.name}":`, itemError)
          failedItems.push(item.name)
        }
      }
      
      console.log(`Successfully saved ${idMapping.size} items to database`)
      
      if (failedItems.length > 0) {
        console.warn(`Failed to save ${failedItems.length} items:`, failedItems)
        addToast({
          type: 'warning',
          title: 'Partial Save',
          description: `${failedItems.length} item(s) could not be saved to database. They will remain in localStorage only.`,
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error saving packing list to database:', error)
      addToast({
        type: 'error',
        title: 'Database Sync Failed',
        description: 'Could not save items to database. Your items are saved locally.',
        duration: 5000
      })
    } finally {
      setIsSyncingToDb(false)
    }
    
    return idMapping
  }, [addToast])

  // Load packing list from database if trip exists
  const loadPackingListFromDatabase = useCallback(async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load trip')
      }

      const data = await response.json()
      if (data.packingItems && data.packingItems.length > 0) {
        // Convert database items to PackingItem format
        const items: PackingItem[] = data.packingItems.map((dbItem: PackingItemDb) => ({
          id: dbItem.id,
          name: dbItem.name,
          category: dbItem.category,
          essential: dbItem.essential,
          packed: dbItem.packed,
          custom: dbItem.custom,
        }))
        
        updatePackingList(items)
        return true
      }
      return false
    } catch (error) {
      console.error('Error loading packing list from database:', error)
      return false
    }
  }, [updatePackingList])

  const generatePackingList = useCallback(async (tripData: {
    destinationCountry: string
    destinationCity: string
    destinationState?: string
    destinationDisplayName?: string
    duration: number
    tripType: string
  }, tripId: string | null) => {
    try {
      const response = await fetch(API_ENDPOINTS.packingList, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.packingList || !Array.isArray(data.packingList)) {
        throw new Error('Invalid packing list data received')
      }
      
      let finalList = data.packingList
      
      // Save to database if we have a trip ID and replace with database IDs
      if (tripId) {
        const idMapping = await savePackingListToDatabase(data.packingList, tripId)
        
        // Update items with database-generated IDs
        if (idMapping.size > 0) {
          finalList = data.packingList.map((item: PackingItem) => ({
            ...item,
            id: idMapping.get(item.id) || item.id // Use database ID if available, fallback to client ID
          }))
          
          addToast({
            type: 'success',
            title: 'List Synced',
            description: `Your packing list has been saved to your account.`,
            duration: 3000
          })
        }
      }
      
      // Update localStorage with final list (with database IDs if available)
      updatePackingList(finalList)
    } catch (error) {
      console.error('Error generating packing list:', error)
      
      // Show user-friendly error and fallback to basic list
      const basicList: PackingItem[] = [
        { id: 'fallback-1', name: 'Passport', category: 'travel_documents', essential: true, packed: false, custom: false },
        { id: 'fallback-2', name: 'Phone Charger', category: 'electronics', essential: true, packed: false, custom: false },
        { id: 'fallback-3', name: 'Medications', category: 'medication', essential: true, packed: false, custom: false },
        { id: 'fallback-4', name: 'Underwear', category: 'clothing', essential: false, packed: false, custom: false },
        { id: 'fallback-5', name: 'Toothbrush', category: 'toiletries', essential: false, packed: false, custom: false },
      ]
      
      let finalBasicList = basicList
      
      // Save basic list to database if we have a trip ID
      if (tripId) {
        const idMapping = await savePackingListToDatabase(basicList, tripId)
        
        // Update basic items with database-generated IDs
        if (idMapping.size > 0) {
          finalBasicList = basicList.map((item: PackingItem) => ({
            ...item,
            id: idMapping.get(item.id) || item.id
          }))
        }
      }
      
      updatePackingList(finalBasicList)
      
      // Check if it's an API key issue
      const isApiKeyIssue = error instanceof Error && error.message.includes('API key')
      
      addToast({
        type: 'warning',
        title: isApiKeyIssue ? 'OpenAI API Key Required' : 'Using Basic Packing List',
        description: isApiKeyIssue 
          ? 'To generate personalized packing lists, please add your OpenAI API key to the .env.local file and restart the server.'
          : 'We had trouble generating a custom list, but provided a basic one to get you started.',
        duration: isApiKeyIssue ? 10000 : 7000
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast, updatePackingList, savePackingListToDatabase])

  useEffect(() => {
    // Check if we have trip data
    if (!tripData) {
      router.push('/')
      return
    }

    // Always load from database first if we have a trip ID (database is source of truth)
    // This prevents issues where localStorage contains data from a different trip
    if (currentTripId) {
      loadPackingListFromDatabase(currentTripId).then(loaded => {
        if (!loaded) {
          // No items in database, generate new list
          generatePackingList(tripData, currentTripId)
        } else {
          setIsLoading(false)
        }
      })
    } else {
      // No trip ID (guest user) - check localStorage or generate new list
      if (packingList.length === 0) {
        generatePackingList(tripData, null)
      } else {
        setIsLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripData, router, currentTripId])
  // Note: generatePackingList and loadPackingListFromDatabase are intentionally excluded to prevent unnecessary re-generation
  // packingList.length removed from deps to ensure we always load from database for authenticated users

  // Wrapper functions to sync with database
  const toggleItemPacked = useCallback(async (itemId: string) => {
    const item = packingList.find(i => i.id === itemId)
    if (!item) return
    
    // Optimistically update UI
    toggleItemPackedLocal(itemId)
    
    if (currentTripId && !isSyncingToDb) {
      try {
        const response = await fetch(`/api/trips/${currentTripId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ packed: !item.packed }),
        })
        
        if (!response.ok) {
          // Rollback on failure
          toggleItemPackedLocal(itemId)
          addToast({
            type: 'error',
            title: 'Sync Failed',
            description: 'Could not update item in database. Changes saved locally only.',
            duration: 3000
          })
        }
      } catch (error) {
        console.error('Error syncing packed status to database:', error)
        // Rollback on error
        toggleItemPackedLocal(itemId)
        addToast({
          type: 'error',
          title: 'Sync Failed',
          description: 'Could not update item in database. Changes saved locally only.',
          duration: 3000
        })
      }
    }
  }, [toggleItemPackedLocal, currentTripId, packingList, isSyncingToDb, addToast])

  const addCustomItem = useCallback(async (item: Omit<PackingItem, 'id' | 'packed' | 'custom'>) => {
    // First add locally (generates client-side ID)
    addCustomItemLocal(item)
    
    if (currentTripId && !isSyncingToDb) {
      try {
        const response = await fetch(`/api/trips/${currentTripId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: item.name,
            category: item.category,
            essential: item.essential,
            custom: true, // User-added items are marked as custom
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.item) {
            // Replace the locally-generated ID with database ID
            const updatedList = packingList.map((listItem) => {
              // Find the item we just added (it will have the most recent timestamp in its ID)
              if (listItem.name === item.name && listItem.id.startsWith('custom-')) {
                return { ...listItem, id: data.item.id }
              }
              return listItem
            })
            // Append the new item if not found in map (race condition safety)
            const existingItem = updatedList.find(i => i.id === data.item.id)
            if (!existingItem) {
              updatedList.push({
                id: data.item.id,
                name: data.item.name,
                category: data.item.category,
                essential: data.item.essential,
                packed: data.item.packed,
                custom: data.item.custom,
              })
            }
            updatePackingList(updatedList)
          }
        }
      } catch (error) {
        console.error('Error syncing new item to database:', error)
        addToast({
          type: 'warning',
          title: 'Item Added Locally',
          description: 'Item saved locally but could not sync to database.',
          duration: 3000
        })
      }
    }
  }, [addCustomItemLocal, currentTripId, isSyncingToDb, packingList, updatePackingList, addToast])

  const deleteItem = useCallback(async (itemId: string) => {
    // Store item for potential rollback
    const itemToDelete = packingList.find(i => i.id === itemId)
    
    // Optimistically delete from UI
    deleteItemLocal(itemId)
    
    if (currentTripId && !isSyncingToDb) {
      try {
        const response = await fetch(`/api/trips/${currentTripId}/items/${itemId}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          // Rollback on failure
          if (itemToDelete) {
            const restoredList = [...packingList, itemToDelete]
            updatePackingList(restoredList)
          }
          addToast({
            type: 'error',
            title: 'Delete Failed',
            description: 'Could not delete item from database.',
            duration: 3000
          })
        }
      } catch (error) {
        console.error('Error syncing item deletion to database:', error)
        // Rollback on error
        if (itemToDelete) {
          const restoredList = [...packingList, itemToDelete]
          updatePackingList(restoredList)
        }
        addToast({
          type: 'error',
          title: 'Delete Failed',
          description: 'Could not delete item from database.',
          duration: 3000
        })
      }
    }
  }, [deleteItemLocal, currentTripId, isSyncingToDb, packingList, updatePackingList, addToast])

  const editItem = useCallback(async (itemId: string, newName: string) => {
    // Store old name for potential rollback
    const oldItem = packingList.find(i => i.id === itemId)
    const oldName = oldItem?.name
    
    // Optimistically update UI
    editItemLocal(itemId, newName)
    
    if (currentTripId && !isSyncingToDb) {
      try {
        const response = await fetch(`/api/trips/${currentTripId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName }),
        })
        
        if (!response.ok) {
          // Rollback on failure
          if (oldName) {
            editItemLocal(itemId, oldName)
          }
          addToast({
            type: 'error',
            title: 'Update Failed',
            description: 'Could not update item in database.',
            duration: 3000
          })
        }
      } catch (error) {
        console.error('Error syncing item edit to database:', error)
        // Rollback on error
        if (oldName) {
          editItemLocal(itemId, oldName)
        }
        addToast({
          type: 'error',
          title: 'Update Failed',
          description: 'Could not update item in database.',
          duration: 3000
        })
      }
    }
  }, [editItemLocal, currentTripId, isSyncingToDb, packingList, addToast])

  const handleEditItem = useCallback((itemId: string, newName: string) => {
    editItem(itemId, newName)
    setEditingItem(null)
  }, [editItem])

  const getCategoryLabel = useCallback((category: string) => {
    return PACKING_CATEGORIES.find(cat => cat.value === category)?.label || category
  }, [])

  const handleFinishPacking = useCallback(() => {
    router.push('/completion')
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800 dark:text-gray-200">
            {isSyncingToDb ? 'Syncing with database...' : 'Generating your personalized packing list...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PageHeader
        title="Packing List"
        subtitle={tripData ? `${tripData.destinationDisplayName || `${tripData.destinationCity}, ${tripData.destinationCountry}`} • ${tripData.duration} Days • ${TRIP_TYPES.find(t => t.value === tripData.tripType)?.label || tripData.tripType}` : undefined}
        backButton={
          <Button
            variant="ghost"
            onClick={() => router.push(hasUser ? '/trips' : '/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weather Forecast - Left Side */}
          <div className="lg:col-span-1">
            {tripData && (
              <div className="sticky top-8">
                <Suspense fallback={
                  <Card className="w-full">
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Weather Forecast</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Loading weather...</span>
                      </div>
                    </CardContent>
                  </Card>
                }>
                  <WeatherForecast 
                    city={tripData.destinationCity}
                    country={tripData.destinationCountry}
                  />
                </Suspense>
              </div>
            )}
          </div>

          {/* Packing List - Right Side */}
          <div className="lg:col-span-2">
            {/* Progress */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <ProgressBar
                  value={progress.packedItems}
                  max={progress.totalItems}
                  showPercentage={true}
                />
                <div className="flex justify-between text-sm text-gray-800 dark:text-gray-200 mt-2">
                  <span>{progress.packedItems} of {progress.totalItems} items packed</span>
                  <span>
                    {progress.progress === 100 ? (
                      <span className="text-green-600 font-medium">Ready to go!</span>
                    ) : (
                      `${Math.round(progress.progress)}% complete`
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Add Item */}
            <AddItemForm onAddItem={addCustomItem} />

            {/* Packing List by Category */}
            <div className="space-y-6">
              {sortedCategories.map((category) => (
                <Card key={category}>
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {getCategoryLabel(category)}
                      <span className="ml-2 text-sm font-normal text-gray-700 dark:text-gray-300">
                        ({groupedItems[category].filter(item => item.packed).length}/{groupedItems[category].length})
                      </span>
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {groupedItems[category].map((item) => (
                        <PackingItemComponent
                          key={item.id}
                          item={item}
                          editingItem={editingItem}
                          onTogglePacked={toggleItemPacked}
                          onEdit={handleEditItem}
                          onDelete={deleteItem}
                          onStartEdit={setEditingItem}
                          onCancelEdit={() => setEditingItem(null)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Complete Button */}
            {progress.progress === 100 && (
              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  onClick={handleFinishPacking}
                  className="px-8"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  I&apos;m Ready to Go!
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}