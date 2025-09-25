'use client'

import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import { MapPin, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { API_ENDPOINTS, TIMEOUTS } from '@/lib/constants'

import { CityOption } from '@/types'

interface CitySearchInputProps {
  value?: CityOption | null
  onChange: (city: CityOption | null) => void
  placeholder?: string
  error?: string
  className?: string
  disabled?: boolean
}

function CitySearchInputComponent({
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
  const [hasSearched, setHasSearched] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Handle search with abort controller for cleanup
  const searchCities = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setOptions([])
      setHasSearched(false)
      return
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    setIsLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.cities}?q=${encodeURIComponent(query.trim())}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response?.ok) {
        const statusText = response?.statusText || 'Unknown error'
        const status = response?.status || 0
        throw new Error(`HTTP ${status}: ${statusText}`)
      }
      
      const data = await response.json()
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server')
      }
      
      if (!Array.isArray(data.cities)) {
        console.warn('Response does not contain cities array:', data)
        setOptions([])
      } else {
        setOptions(data.cities)
      }
      
      setHasSearched(true)
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error searching cities:', error)
        
        // Set user-friendly error state
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          console.error('Network error - check internet connection')
        } else if (error.message.includes('HTTP 429')) {
          console.error('Too many requests - please wait before searching again')
        } else if (error.message.includes('HTTP 5')) {
          console.error('Server error - please try again later')
        }
        
        setOptions([])
        setHasSearched(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Debounced search using custom hook with increased delay for better UX
  const [debouncedSearch] = useDebouncedCallback(searchCities, 500)
  
  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setHighlightedIndex(-1)
    
    if (newValue !== value?.displayName) {
      onChange(null) // Clear selection when typing
    }
    
    const trimmedValue = newValue.trim()
    
    if (trimmedValue.length >= 2) {
      setIsOpen(true)
      setHasSearched(false) // Reset search state when user types
      debouncedSearch(newValue)
    } else if (trimmedValue.length === 0) {
      // Clear everything when input is empty
      setIsOpen(false)
      setOptions([])
      setHasSearched(false)
    } else {
      // For single character, just close dropdown but don't search
      setIsOpen(false)
      setOptions([])
      setHasSearched(false)
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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
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
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Search for destination city or country"
          aria-activedescendant={highlightedIndex >= 0 ? `city-option-${highlightedIndex}` : undefined}
          aria-describedby={error ? 'search-error' : undefined}
          aria-autocomplete="list"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            const trimmedValue = inputValue.trim()
            if (trimmedValue.length >= 2) {
              setIsOpen(true)
              if (!hasSearched) {
                debouncedSearch(inputValue)
              }
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
          role="listbox"
          aria-label="Search results"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {options.length === 0 && !isLoading && inputValue.trim().length >= 2 && hasSearched && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <Search className="h-4 w-4 mx-auto mb-2 text-gray-400" />
              No cities found for &ldquo;{inputValue}&rdquo;
            </div>
          )}
          
          {options.length > 0 && inputValue.trim().length >= 2 && (
            <div className="px-4 py-2 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">
              {(() => {
                // Check if this might be a country search by looking at the results
                const queryLower = inputValue.toLowerCase().trim()
                const allFromSameCountry = options.every(option => 
                  option.country.toLowerCase() === queryLower || 
                  options[0].country === option.country
                )
                
                if (allFromSameCountry && options.length > 3) {
                  const countryName = options[0].country
                  return `Cities in ${countryName} matching "${inputValue}"`
                }
                
                return options.length > 10 ? 
                  `Showing major cities for "${inputValue}"` : 
                  `Found ${options.length} cities matching "${inputValue}"`
              })()}
            </div>
          )}
          
          {options.map((option, index) => (
            <button
              key={option.id}
              id={`city-option-${index}`}
              type="button"
              role="option"
              aria-selected={index === highlightedIndex}
              aria-label={`Select ${option.displayName}`}
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
        <p id="search-error" className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export const CitySearchInput = memo(CitySearchInputComponent)