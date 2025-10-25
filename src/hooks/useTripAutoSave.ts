import { useState, useEffect, useRef, useCallback } from 'react'
import { useDebounce } from './useDebounce'

interface UseTripAutoSaveOptions {
  tripId: string | null
  enabled?: boolean
  debounceMs?: number
  onSave?: () => Promise<void>
  onError?: (error: Error) => void
}

interface UseTripAutoSaveReturn {
  isSaving: boolean
  lastSaved: Date | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  triggerSave: () => Promise<void>
  markDirty: () => void
}

export function useTripAutoSave({
  tripId,
  enabled = true,
  debounceMs = 2000,
  onSave,
  onError,
}: UseTripAutoSaveOptions): UseTripAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isDirty, setIsDirty] = useState(false)
  
  const debouncedIsDirty = useDebounce(isDirty, debounceMs)
  const saveInProgressRef = useRef(false)

  const triggerSave = useCallback(async () => {
    if (!enabled || !tripId || !onSave) return

    // Prevent concurrent saves
    if (saveInProgressRef.current) {
      return
    }

    saveInProgressRef.current = true
    setIsSaving(true)
    setSaveStatus('saving')

    try {
      await onSave()
      setLastSaved(new Date())
      setSaveStatus('saved')
      setIsDirty(false)

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Auto-save error:', error)
      setSaveStatus('error')
      
      if (onError && error instanceof Error) {
        onError(error)
      }

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 5000)
    } finally {
      setIsSaving(false)
      saveInProgressRef.current = false
    }
  }, [enabled, tripId, onSave, onError])

  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  // Auto-save when data becomes dirty (debounced)
  useEffect(() => {
    if (debouncedIsDirty && enabled && tripId) {
      triggerSave()
    }
  }, [debouncedIsDirty, enabled, tripId, triggerSave])

  // Save before unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirty && enabled && tripId && onSave) {
        // Fire and forget - best effort save on unmount
        onSave().catch(error => {
          console.error('Save on unmount error:', error)
        })
      }
    }
  }, [isDirty, enabled, tripId, onSave])

  return {
    isSaving,
    lastSaved,
    saveStatus,
    triggerSave,
    markDirty,
  }
}
