import { useCallback, useMemo, useRef } from 'react'
import { PackingItem, UsePackingListReturn } from '@/types'
import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'

// Cache for category grouping to avoid recalculation
const categoryGroupCache = new WeakMap<PackingItem[], { groupedItems: Record<string, PackingItem[]>, sortedCategories: string[] }>()

// Optimized comparison function for array equality
const areArraysEqual = (a: PackingItem[], b: PackingItem[]): boolean => {
  if (a.length !== b.length) return false
  return a.every((item, index) => {
    const bItem = b[index]
    return item.id === bItem.id && 
           item.name === bItem.name && 
           item.packed === bItem.packed && 
           item.essential === bItem.essential &&
           item.category === bItem.category &&
           item.custom === bItem.custom
  })
}

export function usePackingList(tripId?: string): UsePackingListReturn {
  // Use trip-specific localStorage key to prevent cross-contamination between trips
  const storageKey = tripId ? `${STORAGE_KEYS.currentPackingList}-${tripId}` : STORAGE_KEYS.currentPackingList
  const [packingList, setPackingList] = useLocalStorage<PackingItem[]>(storageKey, [])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPackingListRef = useRef<PackingItem[]>([])
  
  const updatePackingList = useCallback((updatedList: PackingItem[]) => {
    // Only update if the list actually changed to prevent unnecessary re-renders
    if (!areArraysEqual(updatedList, lastPackingListRef.current)) {
      setPackingList(updatedList)
      lastPackingListRef.current = updatedList
    }
    
    // Debounce localStorage operations to reduce frequency
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }, [setPackingList])

  const toggleItemPacked = useCallback((itemId: string) => {
    const updatedList = packingList.map(item =>
      item.id === itemId ? { ...item, packed: !item.packed } : item
    )
    updatePackingList(updatedList)
  }, [packingList, updatePackingList])

  const addCustomItem = useCallback((itemData: Omit<PackingItem, 'id' | 'packed' | 'custom'>) => {
    const customItem: PackingItem = {
      id: `custom-${Date.now()}`,
      ...itemData,
      packed: false,
      custom: true,
    }

    const updatedList = [...packingList, customItem]
    updatePackingList(updatedList)
  }, [packingList, updatePackingList])

  const deleteItem = useCallback((itemId: string) => {
    const updatedList = packingList.filter(item => item.id !== itemId)
    updatePackingList(updatedList)
  }, [packingList, updatePackingList])

  const editItem = useCallback((itemId: string, newName: string) => {
    const updatedList = packingList.map(item =>
      item.id === itemId ? { ...item, name: newName } : item
    )
    updatePackingList(updatedList)
  }, [packingList, updatePackingList])

  // Calculate progress
  const progress = useMemo(() => {
    const total = packingList.length
    const packed = packingList.filter(item => item.packed).length
    return {
      totalItems: total,
      packedItems: packed,
      progress: total > 0 ? (packed / total) * 100 : 0
    }
  }, [packingList])

  // Optimized grouping and sorting with caching
  const { groupedItems, sortedCategories } = useMemo(() => {
    // Check cache first
    const cached = categoryGroupCache.get(packingList)
    if (cached) {
      return cached
    }
    
    const groups: Record<string, PackingItem[]> = {}
    const categoryEssentialMap = new Map<string, boolean>()
    
    // Single pass through items to group and track essential status
    for (const item of packingList) {
      if (!groups[item.category]) {
        groups[item.category] = []
        categoryEssentialMap.set(item.category, false)
      }
      groups[item.category].push(item)
      
      // Track if category has essential items
      if (item.essential && !categoryEssentialMap.get(item.category)) {
        categoryEssentialMap.set(item.category, true)
      }
    }
    
    // Sort items within each category once (essential first, then alphabetical)
    const categoryKeys = Object.keys(groups)
    for (const category of categoryKeys) {
      groups[category].sort((a, b) => {
        if (a.essential && !b.essential) return -1
        if (!a.essential && b.essential) return 1
        return a.name.localeCompare(b.name)
      })
    }
    
    // Sort categories efficiently
    const sortedCats = categoryKeys.sort((a, b) => {
      const aHasEssential = categoryEssentialMap.get(a)
      const bHasEssential = categoryEssentialMap.get(b)
      if (aHasEssential && !bHasEssential) return -1
      if (!aHasEssential && bHasEssential) return 1
      return a.localeCompare(b)
    })
    
    const result = {
      groupedItems: groups,
      sortedCategories: sortedCats
    }
    
    // Cache the result
    categoryGroupCache.set(packingList, result)
    
    return result
  }, [packingList])

  return {
    packingList,
    updatePackingList,
    toggleItemPacked,
    addCustomItem,
    deleteItem,
    editItem,
    progress,
    groupedItems,
    sortedCategories,
  }
}