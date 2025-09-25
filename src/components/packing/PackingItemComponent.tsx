'use client'

import { memo } from 'react'
import { Edit3, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { PackingItem } from '@/types'

interface PackingItemComponentProps {
  item: PackingItem
  editingItem: string | null
  onTogglePacked: (itemId: string) => void
  onEdit: (itemId: string, newName: string) => void
  onDelete: (itemId: string) => void
  onStartEdit: (itemId: string) => void
  onCancelEdit: () => void
}

export const PackingItemComponent = memo(function PackingItemComponent({
  item,
  editingItem,
  onTogglePacked,
  onEdit,
  onDelete,
  onStartEdit,
  onCancelEdit
}: PackingItemComponentProps) {
  return (
    <div
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
        onChange={() => onTogglePacked(item.id)}
      />
      
      {item.essential && (
        <Star className="w-4 h-4 text-orange-500 fill-current" />
      )}
      
      <div className="flex-1">
        {editingItem === item.id ? (
          <Input
            defaultValue={item.name}
            onBlur={(e) => onEdit(item.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEdit(item.id, e.currentTarget.value)
              } else if (e.key === 'Escape') {
                onCancelEdit()
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
              onClick={() => onStartEdit(item.id)}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
})