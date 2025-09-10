'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  CheckCircle, 
  Edit3, 
  Trash2,
  ArrowLeft,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PackingItem } from '@/lib/openai'

const categories = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'toiletries', label: 'Toiletries' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'travel_documents', label: 'Travel Documents' },
  { value: 'medication', label: 'Medication' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
]

export default function PackingListPage() {
  const router = useRouter()
  const [tripData, setTripData] = useState<{
    destinationCountry: string
    destinationCity: string
    duration: number
    tripType: string
  } | null>(null)
  const [packingList, setPackingList] = useState<PackingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'miscellaneous',
    essential: false,
  })
  const [editingItem, setEditingItem] = useState<string | null>(null)

  useEffect(() => {
    // Get trip data from localStorage
    const storedTripData = localStorage.getItem('currentTrip')
    if (!storedTripData) {
      router.push('/')
      return
    }

    const parsedTripData = JSON.parse(storedTripData)
    setTripData(parsedTripData)

    // Check if we already have a packing list
    const storedPackingList = localStorage.getItem('currentPackingList')
    if (storedPackingList) {
      setPackingList(JSON.parse(storedPackingList))
      setIsLoading(false)
    } else {
      // Generate new packing list
      generatePackingList(parsedTripData)
    }
  }, [router])

  const generatePackingList = async (tripData: {
    destinationCountry: string
    destinationCity: string
    duration: number
    tripType: string
  }) => {
    try {
      const response = await fetch('/api/generate-packing-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        throw new Error('Failed to generate packing list')
      }

      const data = await response.json()
      setPackingList(data.packingList)
      localStorage.setItem('currentPackingList', JSON.stringify(data.packingList))
    } catch (error) {
      console.error('Error generating packing list:', error)
      // Show fallback message or default list
    } finally {
      setIsLoading(false)
    }
  }

  const updatePackingList = (updatedList: PackingItem[]) => {
    setPackingList(updatedList)
    localStorage.setItem('currentPackingList', JSON.stringify(updatedList))
  }

  const toggleItemPacked = (itemId: string) => {
    const updatedList = packingList.map(item =>
      item.id === itemId ? { ...item, packed: !item.packed } : item
    )
    updatePackingList(updatedList)
  }

  const addCustomItem = () => {
    if (!newItem.name.trim()) return

    const customItem: PackingItem = {
      id: `custom-${Date.now()}`,
      name: newItem.name.trim(),
      category: newItem.category,
      essential: newItem.essential,
      packed: false,
      custom: true,
    }

    const updatedList = [...packingList, customItem]
    updatePackingList(updatedList)

    setNewItem({ name: '', category: 'miscellaneous', essential: false })
    setIsAddingItem(false)
  }

  const deleteItem = (itemId: string) => {
    const updatedList = packingList.filter(item => item.id !== itemId)
    updatePackingList(updatedList)
  }

  const editItem = (itemId: string, newName: string) => {
    const updatedList = packingList.map(item =>
      item.id === itemId ? { ...item, name: newName } : item
    )
    updatePackingList(updatedList)
    setEditingItem(null)
  }

  // Calculate progress
  const totalItems = packingList.length
  const packedItems = packingList.filter(item => item.packed).length
  const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0

  // Group items by category
  const groupedItems = packingList.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = []
    }
    groups[item.category].push(item)
    return groups
  }, {} as Record<string, PackingItem[]>)

  // Sort categories to show essential items first
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const aHasEssential = groupedItems[a].some(item => item.essential)
    const bHasEssential = groupedItems[b].some(item => item.essential)
    if (aHasEssential && !bHasEssential) return -1
    if (!aHasEssential && bHasEssential) return 1
    return a.localeCompare(b)
  })

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || category
  }

  const handleFinishPacking = () => {
    router.push('/completion')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-700">Generating your personalized packing list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Packing List
              </h1>
              {tripData && (
                <p className="text-slate-700">
                  {tripData.destinationCity}, {tripData.destinationCountry} • {tripData.duration} days • {tripData.tripType}
                </p>
              )}
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <ProgressBar
              value={packedItems}
              max={totalItems}
              showPercentage={true}
            />
            <div className="flex justify-between text-sm text-slate-700 mt-2">
              <span>{packedItems} of {totalItems} items packed</span>
              <span>
                {progress === 100 ? (
                  <span className="text-green-600 font-medium">Ready to go! 🎉</span>
                ) : (
                  `${Math.round(progress)}% complete`
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Add Item */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {!isAddingItem ? (
              <Button
                variant="outline"
                onClick={() => setIsAddingItem(true)}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Item</span>
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Select
                    options={categories}
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  />
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={newItem.essential}
                      onChange={(e) => setNewItem(prev => ({ ...prev, essential: e.target.checked }))}
                      label="Essential"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={addCustomItem} disabled={!newItem.name.trim()}>
                    Add Item
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingItem(false)
                      setNewItem({ name: '', category: 'miscellaneous', essential: false })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Packing List by Category */}
        <div className="space-y-6">
          {sortedCategories.map((category) => (
            <Card key={category}>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {getCategoryLabel(category)}
                  <span className="ml-2 text-sm font-normal text-slate-600">
                    ({groupedItems[category].filter(item => item.packed).length}/{groupedItems[category].length})
                  </span>
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupedItems[category]
                    .sort((a, b) => {
                      // Sort essential items first
                      if (a.essential && !b.essential) return -1
                      if (!a.essential && b.essential) return 1
                      return a.name.localeCompare(b.name)
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                          item.packed
                            ? 'bg-green-50 border-green-200'
                            : item.essential
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Checkbox
                          checked={item.packed}
                          onChange={() => toggleItemPacked(item.id)}
                        />
                        
                        {item.essential && (
                          <Star className="w-4 h-4 text-orange-500 fill-current" />
                        )}
                        
                        <div className="flex-1">
                          {editingItem === item.id ? (
                            <Input
                              defaultValue={item.name}
                              onBlur={(e) => editItem(item.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  editItem(item.id, e.currentTarget.value)
                                } else if (e.key === 'Escape') {
                                  setEditingItem(null)
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`${
                                item.packed ? 'line-through text-slate-600' : 'text-slate-900'
                              }`}
                            >
                              {item.name}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-1">
                          {item.custom && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingItem(item.id)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Complete Button */}
        {progress === 100 && (
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
      </main>
    </div>
  )
}