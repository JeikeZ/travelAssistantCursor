import { useState, useCallback, useMemo, useRef } from 'react'
import { PackingItem } from '@/lib/openai'
import { useLocalStorage } from './useLocalStorage'

export interface UsePackingListReturn {
  packingList: PackingItem[]
  updatePackingList: (updatedList: PackingItem[]) => void
  toggleItemPacked: (itemId: string) => void
  addCustomItem: (item: Omit<PackingItem, 'id' | 'packed' | 'custom'>) => void
  deleteItem: (itemId: string) => void
  editItem: (itemId: string, newName: string) => void
  progress: {
    totalItems: number
    packedItems: number
    progress: number
  }
  groupedItems: Record<string, PackingItem[]>
  sortedCategories: string[]
}

export function usePackingList(): UsePackingListReturn {
  const [packingList, setPackingList] = useLocalStorage<PackingItem[]>('currentPackingList', [])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const updatePackingList = useCallback((updatedList: PackingItem[]) => {
    setPackingList(updatedList)
    
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

  // Optimized grouping and sorting with single pass
  const { groupedItems, sortedCategories } = useMemo(() => {
    const groups: Record<string, PackingItem[]> = {}
    const categoryEssentialMap = new Map<string, boolean>()
    
    // Single pass through items to group and track essential status
    packingList.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = []
        categoryEssentialMap.set(item.category, false)
      }
      groups[item.category].push(item)
      
      // Track if category has essential items
      if (item.essential && !categoryEssentialMap.get(item.category)) {
        categoryEssentialMap.set(item.category, true)
      }
    })
    
    // Sort items within each category once (essential first, then alphabetical)
    Object.keys(groups).forEach(category => {
      groups[category].sort((a, b) => {
        if (a.essential && !b.essential) return -1
        if (!a.essential && b.essential) return 1
        return a.name.localeCompare(b.name)
      })
    })
    
    // Sort categories efficiently
    const sortedCats = Object.keys(groups).sort((a, b) => {
      const aHasEssential = categoryEssentialMap.get(a)
      const bHasEssential = categoryEssentialMap.get(b)
      if (aHasEssential && !bHasEssential) return -1
      if (!aHasEssential && bHasEssential) return 1
      return a.localeCompare(b)
    })
    
    return {
      groupedItems: groups,
      sortedCategories: sortedCats
    }
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