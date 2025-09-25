'use client'

import { useState, useCallback, memo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { Card, CardContent } from '@/components/ui/Card'
import { PackingItem, PackingCategory } from '@/types'
import { PACKING_CATEGORIES } from '@/lib/constants'

interface AddItemFormProps {
  onAddItem: (item: Omit<PackingItem, 'id' | 'packed' | 'custom'>) => void
}

interface NewItemData {
  name: string
  category: PackingCategory
  essential: boolean
}

export const AddItemForm = memo(function AddItemForm({ onAddItem }: AddItemFormProps) {
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItem, setNewItem] = useState<NewItemData>({
    name: '',
    category: 'miscellaneous',
    essential: false,
  })

  const handleAddCustomItem = useCallback(() => {
    if (!newItem.name.trim()) return

    onAddItem({
      name: newItem.name.trim(),
      category: newItem.category,
      essential: newItem.essential,
    })

    setNewItem({ name: '', category: 'miscellaneous', essential: false })
    setIsAddingItem(false)
  }, [newItem, onAddItem])

  const handleCancel = useCallback(() => {
    setIsAddingItem(false)
    setNewItem({ name: '', category: 'miscellaneous', essential: false })
  }, [])

  return (
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
                options={PACKING_CATEGORIES}
                value={newItem.category}
                onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as PackingCategory }))}
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
              <Button onClick={handleAddCustomItem} disabled={!newItem.name.trim()}>
                Add Item
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})