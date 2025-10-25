'use client'

import React, { useState } from 'react'
import { TripFilters as TripFiltersType, SortOptions, TripStatus } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface TripFiltersProps {
  onFilterChange: (filters: TripFiltersType) => void
  onSortChange: (sort: SortOptions) => void
}

export function TripFilters({ onFilterChange, onSortChange }: TripFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState<TripStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOptions['sortBy']>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOptions['sortOrder']>('desc')

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onFilterChange({ status: status !== 'all' ? status : undefined, searchQuery: value })
  }

  const handleStatusChange = (value: string) => {
    const newStatus = value as TripStatus | 'all'
    setStatus(newStatus)
    onFilterChange({
      status: newStatus !== 'all' ? newStatus : undefined,
      searchQuery: searchQuery || undefined,
    })
  }

  const handleSortChange = (field: string, order?: string) => {
    const newSortBy = field as SortOptions['sortBy']
    const newSortOrder = order ? (order as SortOptions['sortOrder']) : sortOrder
    
    setSortBy(newSortBy)
    if (order) setSortOrder(newSortOrder)
    
    onSortChange({ sortBy: newSortBy, sortOrder: newSortOrder })
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatus('all')
    setSortBy('created_at')
    setSortOrder('desc')
    onFilterChange({})
    onSortChange({ sortBy: 'created_at', sortOrder: 'desc' })
  }

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Search */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Search Trips
        </label>
        <Input
          id="search"
          type="text"
          placeholder="Search by destination..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <Select
            id="status"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={[
              { value: 'all', label: 'All Trips' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <Select
            id="sortBy"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            options={[
              { value: 'created_at', label: 'Date Created' },
              { value: 'updated_at', label: 'Last Updated' },
              { value: 'start_date', label: 'Start Date' },
            ]}
          />
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Order
          </label>
          <Select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => handleSortChange(sortBy, e.target.value)}
            options={[
              { value: 'desc', label: 'Newest First' },
              { value: 'asc', label: 'Oldest First' },
            ]}
          />
        </div>
      </div>

      {/* Clear Filters */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  )
}
