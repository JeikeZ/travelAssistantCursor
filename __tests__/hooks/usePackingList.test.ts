import { renderHook, act } from '@testing-library/react'
import { usePackingList } from '@/hooks/usePackingList'
import { PackingItem } from '@/types'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any

// Mock useLocalStorage hook
jest.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn()
}))

import { useLocalStorage } from '@/hooks/useLocalStorage'
const mockUseLocalStorage = useLocalStorage as jest.MockedFunction<typeof useLocalStorage>

describe('usePackingList', () => {
  const mockSetPackingList = jest.fn()
  
  const mockPackingList: PackingItem[] = [
    {
      id: '1',
      name: 'Passport',
      category: 'travel_documents',
      essential: true,
      packed: false,
      custom: false
    },
    {
      id: '2',
      name: 'T-shirts',
      category: 'clothing',
      essential: false,
      packed: true,
      custom: false
    },
    {
      id: '3',
      name: 'Custom Item',
      category: 'miscellaneous',
      essential: false,
      packed: false,
      custom: true
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalStorage.mockReturnValue([mockPackingList, mockSetPackingList])
  })

  it('initializes with empty array by default', () => {
    mockUseLocalStorage.mockReturnValue([[], mockSetPackingList])
    
    const { result } = renderHook(() => usePackingList())
    
    expect(result.current.packingList).toEqual([])
    expect(result.current.progress.totalItems).toBe(0)
    expect(result.current.progress.packedItems).toBe(0)
    expect(result.current.progress.progress).toBe(0)
  })

  it('returns correct packing list data', () => {
    const { result } = renderHook(() => usePackingList())
    
    expect(result.current.packingList).toEqual(mockPackingList)
    expect(result.current.progress.totalItems).toBe(3)
    expect(result.current.progress.packedItems).toBe(1)
    expect(result.current.progress.progress).toBe(33.333333333333336)
  })

  describe('updatePackingList', () => {
    it('updates the packing list', () => {
      const { result } = renderHook(() => usePackingList())
      
      const newList = [...mockPackingList, {
        id: '4',
        name: 'New Item',
        category: 'clothing' as const,
        essential: false,
        packed: false,
        custom: true
      }]
      
      act(() => {
        result.current.updatePackingList(newList)
      })
      
      expect(mockSetPackingList).toHaveBeenCalledWith(newList)
    })

    it('does not update if list is identical', () => {
      const { result } = renderHook(() => usePackingList())
      
      act(() => {
        result.current.updatePackingList(mockPackingList)
      })
      
      // Should not call setPackingList if the list is identical
      expect(mockSetPackingList).not.toHaveBeenCalled()
    })
  })

  describe('toggleItemPacked', () => {
    it('toggles item packed status', () => {
      const { result } = renderHook(() => usePackingList())
      
      act(() => {
        result.current.toggleItemPacked('1')
      })
      
      const expectedList = mockPackingList.map(item =>
        item.id === '1' ? { ...item, packed: !item.packed } : item
      )
      
      expect(mockSetPackingList).toHaveBeenCalledWith(expectedList)
    })

    it('does nothing for non-existent item', () => {
      const { result } = renderHook(() => usePackingList())
      
      act(() => {
        result.current.toggleItemPacked('non-existent')
      })
      
      expect(mockSetPackingList).toHaveBeenCalledWith(mockPackingList)
    })
  })

  describe('addCustomItem', () => {
    it('adds a custom item to the list', () => {
      const { result } = renderHook(() => usePackingList())
      
      const newItemData = {
        name: 'Custom Item',
        category: 'miscellaneous' as const,
        essential: false
      }
      
      act(() => {
        result.current.addCustomItem(newItemData)
      })
      
      expect(mockSetPackingList).toHaveBeenCalledWith([
        ...mockPackingList,
        expect.objectContaining({
          name: 'Custom Item',
          category: 'miscellaneous',
          essential: false,
          packed: false,
          custom: true,
          id: expect.stringContaining('custom-')
        })
      ])
    })

    it('generates unique IDs for custom items', () => {
      const { result } = renderHook(() => usePackingList())
      
      const newItemData = {
        name: 'Custom Item',
        category: 'miscellaneous' as const,
        essential: false
      }
      
      const originalDateNow = Date.now
      Date.now = jest.fn(() => 1234567890)
      
      act(() => {
        result.current.addCustomItem(newItemData)
      })
      
      expect(mockSetPackingList).toHaveBeenCalledWith([
        ...mockPackingList,
        expect.objectContaining({
          id: 'custom-1234567890'
        })
      ])
      
      Date.now = originalDateNow
    })
  })

  describe('deleteItem', () => {
    it('removes item from the list', () => {
      const { result } = renderHook(() => usePackingList())
      
      act(() => {
        result.current.deleteItem('2')
      })
      
      const expectedList = mockPackingList.filter(item => item.id !== '2')
      
      expect(mockSetPackingList).toHaveBeenCalledWith(expectedList)
    })

    it('does nothing for non-existent item', () => {
      const { result } = renderHook(() => usePackingList())
      
      act(() => {
        result.current.deleteItem('non-existent')
      })
      
      expect(mockSetPackingList).toHaveBeenCalledWith(mockPackingList)
    })
  })

  describe('editItem', () => {
    it('updates item name', () => {
      const { result } = renderHook(() => usePackingList())
      
      act(() => {
        result.current.editItem('1', 'Updated Passport')
      })
      
      const expectedList = mockPackingList.map(item =>
        item.id === '1' ? { ...item, name: 'Updated Passport' } : item
      )
      
      expect(mockSetPackingList).toHaveBeenCalledWith(expectedList)
    })

    it('does nothing for non-existent item', () => {
      const { result } = renderHook(() => usePackingList())
      
      act(() => {
        result.current.editItem('non-existent', 'New Name')
      })
      
      expect(mockSetPackingList).toHaveBeenCalledWith(mockPackingList)
    })
  })

  describe('progress calculation', () => {
    it('calculates progress correctly with mixed packed items', () => {
      const { result } = renderHook(() => usePackingList())
      
      expect(result.current.progress).toEqual({
        totalItems: 3,
        packedItems: 1,
        progress: 33.333333333333336
      })
    })

    it('returns 0 progress for empty list', () => {
      mockUseLocalStorage.mockReturnValue([[], mockSetPackingList])
      
      const { result } = renderHook(() => usePackingList())
      
      expect(result.current.progress).toEqual({
        totalItems: 0,
        packedItems: 0,
        progress: 0
      })
    })

    it('returns 100 progress when all items are packed', () => {
      const allPackedList = mockPackingList.map(item => ({ ...item, packed: true }))
      mockUseLocalStorage.mockReturnValue([allPackedList, mockSetPackingList])
      
      const { result } = renderHook(() => usePackingList())
      
      expect(result.current.progress).toEqual({
        totalItems: 3,
        packedItems: 3,
        progress: 100
      })
    })
  })

  describe('groupedItems and sortedCategories', () => {
    it('groups items by category', () => {
      const { result } = renderHook(() => usePackingList())
      
      expect(result.current.groupedItems).toEqual({
        travel_documents: [mockPackingList[0]],
        clothing: [mockPackingList[1]],
        miscellaneous: [mockPackingList[2]]
      })
    })

    it('sorts categories with essential items first', () => {
      const { result } = renderHook(() => usePackingList())
      
      // travel_documents should come first because it has essential items
      expect(result.current.sortedCategories[0]).toBe('travel_documents')
    })

    it('sorts items within categories (essential first, then alphabetical)', () => {
      const mixedCategoryList: PackingItem[] = [
        {
          id: '1',
          name: 'Z Item',
          category: 'clothing',
          essential: false,
          packed: false,
          custom: false
        },
        {
          id: '2',
          name: 'A Item',
          category: 'clothing',
          essential: true,
          packed: false,
          custom: false
        },
        {
          id: '3',
          name: 'B Item',
          category: 'clothing',
          essential: false,
          packed: false,
          custom: false
        }
      ]
      
      mockUseLocalStorage.mockReturnValue([mixedCategoryList, mockSetPackingList])
      
      const { result } = renderHook(() => usePackingList())
      
      const clothingItems = result.current.groupedItems.clothing
      expect(clothingItems[0].name).toBe('A Item') // Essential first
      expect(clothingItems[1].name).toBe('B Item') // Then alphabetical
      expect(clothingItems[2].name).toBe('Z Item')
    })

    it('uses caching for performance', () => {
      const { result, rerender } = renderHook(() => usePackingList())
      
      const firstGroupedItems = result.current.groupedItems
      const firstSortedCategories = result.current.sortedCategories
      
      // Re-render without changing the packing list
      rerender()
      
      // Should return the same objects (cached)
      expect(result.current.groupedItems).toBe(firstGroupedItems)
      expect(result.current.sortedCategories).toBe(firstSortedCategories)
    })

    it('invalidates cache when packing list changes', () => {
      const { result } = renderHook(() => usePackingList())
      
      const firstGroupedItems = result.current.groupedItems
      
      // Update the packing list
      const newList = [...mockPackingList, {
        id: '4',
        name: 'New Item',
        category: 'electronics' as const,
        essential: false,
        packed: false,
        custom: true
      }]
      
      mockUseLocalStorage.mockReturnValue([newList, mockSetPackingList])
      
      const { result: newResult } = renderHook(() => usePackingList())
      
      // Should return different objects (cache invalidated)
      expect(newResult.current.groupedItems).not.toBe(firstGroupedItems)
      expect(newResult.current.groupedItems.electronics).toBeDefined()
    })
  })

  describe('memoization and performance', () => {
    it('memoizes callbacks to prevent unnecessary re-renders', () => {
      const { result, rerender } = renderHook(() => usePackingList())
      
      const firstToggleItemPacked = result.current.toggleItemPacked
      const firstAddCustomItem = result.current.addCustomItem
      const firstDeleteItem = result.current.deleteItem
      const firstEditItem = result.current.editItem
      const firstUpdatePackingList = result.current.updatePackingList
      
      rerender()
      
      expect(result.current.toggleItemPacked).toBe(firstToggleItemPacked)
      expect(result.current.addCustomItem).toBe(firstAddCustomItem)
      expect(result.current.deleteItem).toBe(firstDeleteItem)
      expect(result.current.editItem).toBe(firstEditItem)
      expect(result.current.updatePackingList).toBe(firstUpdatePackingList)
    })

    it('memoizes progress calculation', () => {
      const { result, rerender } = renderHook(() => usePackingList())
      
      const firstProgress = result.current.progress
      
      rerender()
      
      expect(result.current.progress).toBe(firstProgress)
    })
  })

  describe('edge cases', () => {
    it('handles empty category names', () => {
      const listWithEmptyCategory: PackingItem[] = [
        {
          id: '1',
          name: 'Item',
          category: '' as any,
          essential: false,
          packed: false,
          custom: false
        }
      ]
      
      mockUseLocalStorage.mockReturnValue([listWithEmptyCategory, mockSetPackingList])
      
      const { result } = renderHook(() => usePackingList())
      
      expect(result.current.groupedItems['']).toBeDefined()
      expect(result.current.sortedCategories).toContain('')
    })

    it('handles items with undefined properties gracefully', () => {
      const listWithUndefined: PackingItem[] = [
        {
          id: '1',
          name: 'Item',
          category: 'clothing',
          essential: undefined as any,
          packed: undefined as any,
          custom: false
        }
      ]
      
      mockUseLocalStorage.mockReturnValue([listWithUndefined, mockSetPackingList])
      
      const { result } = renderHook(() => usePackingList())
      
      // Should not throw errors
      expect(() => {
        result.current.progress
        result.current.groupedItems
        result.current.sortedCategories
      }).not.toThrow()
    })
  })
})