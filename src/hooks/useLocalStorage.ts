import { useState, useEffect, useCallback, useRef } from 'react'

type SetValue<T> = (value: T | ((val: T) => T)) => void

// Cache for localStorage operations to reduce I/O
const localStorageCache = new Map<string, { value: string; timestamp: number }>()
const CACHE_DURATION = 5000 // 5 seconds

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
  }
): [T, SetValue<T>, () => void] {
  const serialize = options?.serialize || JSON.stringify
  const deserialize = options?.deserialize || JSON.parse
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      // Check cache first
      const cached = localStorageCache.get(key)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return deserialize(cached.value)
      }

      const item = window.localStorage.getItem(key)
      if (item) {
        // Update cache
        localStorageCache.set(key, { value: item, timestamp: Date.now() })
        return deserialize(item)
      }
      return initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        // Save state immediately
        setStoredValue(valueToStore)
        
        // Debounce localStorage writes to improve performance
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(() => {
          try {
            if (typeof window !== 'undefined') {
              const serializedValue = serialize(valueToStore)
              window.localStorage.setItem(key, serializedValue)
              // Update cache
              localStorageCache.set(key, { value: serializedValue, timestamp: Date.now() })
            }
          } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error)
          }
        }, 100) // 100ms debounce
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, serialize, storedValue]
  )

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue))
        } catch (error) {
          console.error(`Error deserializing localStorage key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, deserialize])

  return [storedValue, setValue, removeValue]
}