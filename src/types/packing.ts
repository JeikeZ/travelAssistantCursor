/**
 * Packing List Types
 */

export type PackingCategory = 'clothing' | 'toiletries' | 'electronics' | 'travel_documents' | 'medication' | 'miscellaneous'

export interface PackingItem {
  id: string
  name: string
  category: PackingCategory
  essential: boolean
  packed: boolean
  custom: boolean
}

export interface PackingItemDb {
  id: string
  trip_id: string
  name: string
  category: PackingCategory
  essential: boolean
  packed: boolean
  custom: boolean
  quantity: number
  created_at: string
  updated_at: string
  notes: string | null
  deleted_at: string | null  // Soft delete timestamp
}

export interface PackingItemInsert {
  id?: string
  trip_id: string
  name: string
  category: PackingCategory
  essential?: boolean
  packed?: boolean
  custom?: boolean
  quantity?: number
  notes?: string | null
}

export interface PackingItemUpdate {
  name?: string
  category?: PackingCategory
  essential?: boolean
  packed?: boolean
  custom?: boolean
  quantity?: number
  notes?: string | null
  updated_at?: string
}

export interface PackingListResponse {
  items: Omit<PackingItem, 'id' | 'packed' | 'custom'>[]
}
