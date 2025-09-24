'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CityOption {
  id: string
  name: string
  country: string
  admin1?: string // State/Province
  admin2?: string // County/District
  latitude: number
  longitude: number
  displayName: string
}

interface CitySearchInputProps {
  value?: CityOption | null
  onChange: (city: CityOption | null) => void
  placeholder?: string
  error?: string
  className?: string
  disabled?: boolean
}

export function CitySearchInput({
  value,
  onChange,
  placeholder = "Search for a city or country...",
  error,
  className,
  disabled = false
}: CitySearchInputProps) {
  const [inputValue, setInputValue] = useState(value?.displayName || '')
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<CityOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // Handle search with debouncing
  const searchCities = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setOptions([])
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/cities?q=${encodeURIComponent(query.trim())}`)
      if (!response.ok) {
        throw new Error('Failed to search cities')
      }
      
      const data = await response.json()
      setOptions(data.cities || [])
    } catch (error) {
      console.error('Error searching cities:', error)
      setOptions([])
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      searchCities(query)
    }, 300)
  }, [searchCities])
  
  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setHighlightedIndex(-1)
    
    if (newValue !== value?.displayName) {
      onChange(null) // Clear selection when typing
    }
    
    if (newValue.trim()) {
      setIsOpen(true)
      debouncedSearch(newValue)
    } else {
      setIsOpen(false)
      setOptions([])
    }
  }, [value, onChange, debouncedSearch])
  
  // Handle option selection
  const handleOptionSelect = useCallback((option: CityOption) => {
    setInputValue(option.displayName)
    onChange(option)
    setIsOpen(false)
    setOptions([])
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }, [onChange])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        if (inputValue.trim()) {
          debouncedSearch(inputValue)
        }
      }
      return
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleOptionSelect(options[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, options, highlightedIndex, handleOptionSelect, inputValue, debouncedSearch])
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value?.displayName || '')
  }, [value])
  
  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])
  
  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim()) {
              setIsOpen(true)
              debouncedSearch(inputValue)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <ChevronDown className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              isOpen && "transform rotate-180"
            )} />
          )}
        </div>
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {options.length === 0 && !isLoading && inputValue.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <Search className="h-4 w-4 mx-auto mb-2 text-gray-400" />
              No cities found for &ldquo;{inputValue}&rdquo;
            </div>
          )}
          
          {options.length > 0 && inputValue.trim().length >= 2 && (
            <div className="px-4 py-2 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">
              {options.length > 10 ? 
                `Showing major cities for "${inputValue}"` : 
                `Found ${options.length} cities matching "${inputValue}"`
              }
            </div>
          )}
          
          {options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              className={cn(
                'w-full px-4 py-3 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                index === highlightedIndex && 'bg-blue-50 text-blue-700',
                'border-b border-gray-100 last:border-b-0'
              )}
              onClick={() => handleOptionSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {option.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {option.admin1 && `${option.admin1}, `}{option.country}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}