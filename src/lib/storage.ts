/**
 * Centralized Storage Service
 * 
 * Provides type-safe localStorage operations with:
 * - Centralized key management
 * - JSON serialization/deserialization
 * - Error handling
 * - Version management for data migrations
 * - Type safety
 */

import { logger } from './logger'
import type { User, Trip, PackingItem } from '@/types'

// ============================================================================
// Storage Keys - Centralized key management
// ============================================================================

export const STORAGE_KEYS = {
  // User authentication
  USER: 'user',
  SESSION: 'session',
  
  // Trip data
  CURRENT_TRIP: 'currentTrip',
  CURRENT_TRIP_ID: 'currentTripId',
  TRIP_CACHE: 'tripCache',
  
  // Packing list data
  PACKING_LIST: 'currentPackingList',
  PACKING_LIST_PREFIX: 'currentPackingList-',
  
  // UI preferences
  THEME: 'theme',
  TEMPERATURE_UNIT: 'temperatureUnit',
  
  // App state
  LAST_VISITED: 'lastVisited',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

// ============================================================================
// Storage Item Interface
// ============================================================================

interface StorageItem<T> {
  value: T
  timestamp: number
  version: string
  expiresAt?: number
}

// ============================================================================
// Storage Service Class
// ============================================================================

class StorageService {
  private version = '1.0.0'
  private isAvailable: boolean

  constructor() {
    this.isAvailable = this.checkAvailability()
  }

  /**
   * Check if localStorage is available
   */
  private checkAvailability(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    try {
      const testKey = '__storage_test__'
      window.localStorage.setItem(testKey, 'test')
      window.localStorage.removeItem(testKey)
      return true
    } catch (error) {
      logger.warn('localStorage not available', { error })
      return false
    }
  }

  /**
   * Get item from storage with type safety
   */
  get<T>(key: string, defaultValue?: T): T | null {
    if (!this.isAvailable) {
      logger.warn('Storage not available', { key })
      return defaultValue || null
    }

    try {
      const item = window.localStorage.getItem(key)
      
      if (!item) {
        return defaultValue || null
      }

      // Try to parse as StorageItem first
      try {
        const parsed: StorageItem<T> = JSON.parse(item)
        
        // Check if item has expired
        if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
          logger.debug('Storage item expired', { key })
          this.remove(key)
          return defaultValue || null
        }
        
        // Check version compatibility (future feature)
        if (parsed.version && parsed.version !== this.version) {
          logger.debug('Storage version mismatch', { 
            key, 
            stored: parsed.version, 
            current: this.version 
          })
        }
        
        return parsed.value
      } catch {
        // Fallback: try direct JSON parse for backward compatibility
        return JSON.parse(item) as T
      }
    } catch (error) {
      logger.error('Error reading from storage', error as Error, { key })
      return defaultValue || null
    }
  }

  /**
   * Set item in storage with type safety
   */
  set<T>(key: string, value: T, options?: { expiresIn?: number }): boolean {
    if (!this.isAvailable) {
      logger.warn('Storage not available', { key })
      return false
    }

    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        version: this.version,
        expiresAt: options?.expiresIn ? Date.now() + options.expiresIn : undefined
      }

      window.localStorage.setItem(key, JSON.stringify(item))
      logger.debug('Storage item saved', { key })
      return true
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        logger.error('Storage quota exceeded', error, { key })
        this.cleanupExpired()
      } else {
        logger.error('Error writing to storage', error as Error, { key })
      }
      return false
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): boolean {
    if (!this.isAvailable) {
      return false
    }

    try {
      window.localStorage.removeItem(key)
      logger.debug('Storage item removed', { key })
      return true
    } catch (error) {
      logger.error('Error removing from storage', error as Error, { key })
      return false
    }
  }

  /**
   * Clear all storage (with optional prefix filter)
   */
  clear(prefix?: string): boolean {
    if (!this.isAvailable) {
      return false
    }

    try {
      if (prefix) {
        // Clear only items with specific prefix
        const keys: string[] = []
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key && key.startsWith(prefix)) {
            keys.push(key)
          }
        }
        keys.forEach(key => window.localStorage.removeItem(key))
        logger.info('Storage cleared with prefix', { prefix, count: keys.length })
      } else {
        // Clear all storage
        window.localStorage.clear()
        logger.info('All storage cleared')
      }
      return true
    } catch (error) {
      logger.error('Error clearing storage', error as Error, { prefix })
      return false
    }
  }

  /**
   * Get all keys in storage
   */
  keys(prefix?: string): string[] {
    if (!this.isAvailable) {
      return []
    }

    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key)
      }
    }
    return keys
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    if (!this.isAvailable) {
      return false
    }

    return window.localStorage.getItem(key) !== null
  }

  /**
   * Get storage size in bytes (approximate)
   */
  getSize(): number {
    if (!this.isAvailable) {
      return 0
    }

    let size = 0
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        const item = window.localStorage.getItem(key)
        if (item) {
          size += key.length + item.length
        }
      }
    }
    return size
  }

  /**
   * Cleanup expired items
   */
  cleanupExpired(): number {
    if (!this.isAvailable) {
      return 0
    }

    let count = 0
    const now = Date.now()
    const keys: string[] = []

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        keys.push(key)
      }
    }

    keys.forEach(key => {
      try {
        const item = window.localStorage.getItem(key)
        if (item) {
          const parsed: StorageItem<any> = JSON.parse(item)
          if (parsed.expiresAt && parsed.expiresAt < now) {
            window.localStorage.removeItem(key)
            count++
          }
        }
      } catch {
        // Ignore parse errors
      }
    })

    if (count > 0) {
      logger.info('Expired storage items cleaned up', { count })
    }

    return count
  }

  /**
   * Cleanup old items (keeping only N most recent)
   */
  cleanupOld(prefix: string, maxItems: number = 5): number {
    if (!this.isAvailable) {
      return 0
    }

    const items: Array<{ key: string; timestamp: number }> = []

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        try {
          const item = window.localStorage.getItem(key)
          if (item) {
            const parsed: StorageItem<any> = JSON.parse(item)
            items.push({ key, timestamp: parsed.timestamp || 0 })
          }
        } catch {
          // If parse fails, add with timestamp 0 so it gets cleaned up
          items.push({ key, timestamp: 0 })
        }
      }
    }

    if (items.length <= maxItems) {
      return 0
    }

    // Sort by timestamp (oldest first) and remove excess
    const toRemove = items
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, items.length - maxItems)

    toRemove.forEach(({ key }) => {
      window.localStorage.removeItem(key)
    })

    logger.info('Old storage items cleaned up', { 
      prefix, 
      removed: toRemove.length,
      kept: maxItems 
    })

    return toRemove.length
  }

  // ============================================================================
  // Typed Helper Methods for Common Operations
  // ============================================================================

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.get<User>(STORAGE_KEYS.USER)
  }

  /**
   * Set current user
   */
  setUser(user: User): boolean {
    return this.set(STORAGE_KEYS.USER, user)
  }

  /**
   * Remove current user
   */
  removeUser(): boolean {
    return this.remove(STORAGE_KEYS.USER)
  }

  /**
   * Get current trip
   */
  getCurrentTrip(): Trip | null {
    return this.get<Trip>(STORAGE_KEYS.CURRENT_TRIP)
  }

  /**
   * Set current trip
   */
  setCurrentTrip(trip: Trip): boolean {
    return this.set(STORAGE_KEYS.CURRENT_TRIP, trip)
  }

  /**
   * Get packing list for specific trip
   */
  getTripPackingList(tripId: string): PackingItem[] {
    const key = `${STORAGE_KEYS.PACKING_LIST_PREFIX}${tripId}`
    return this.get<PackingItem[]>(key) || []
  }

  /**
   * Set packing list for specific trip
   */
  setTripPackingList(tripId: string, items: PackingItem[]): boolean {
    const key = `${STORAGE_KEYS.PACKING_LIST_PREFIX}${tripId}`
    return this.set(key, items)
  }

  /**
   * Remove packing list for specific trip
   */
  removeTripPackingList(tripId: string): boolean {
    const key = `${STORAGE_KEYS.PACKING_LIST_PREFIX}${tripId}`
    return this.remove(key)
  }

  /**
   * Cleanup old packing lists
   */
  cleanupOldPackingLists(maxLists: number = 5): number {
    return this.cleanupOld(STORAGE_KEYS.PACKING_LIST_PREFIX, maxLists)
  }

  /**
   * Get temperature unit preference
   */
  getTemperatureUnit(): 'C' | 'F' {
    return this.get<'C' | 'F'>(STORAGE_KEYS.TEMPERATURE_UNIT) || 'C'
  }

  /**
   * Set temperature unit preference
   */
  setTemperatureUnit(unit: 'C' | 'F'): boolean {
    return this.set(STORAGE_KEYS.TEMPERATURE_UNIT, unit)
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const storage = new StorageService()

// Export types
export type { StorageItem }
