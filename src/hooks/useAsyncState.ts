import { useState, useCallback, useRef, useEffect } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export interface UseAsyncStateReturn<T> extends AsyncState<T> {
  execute: (asyncFunction: () => Promise<T>) => Promise<T | null>
  reset: () => void
}

export function useAsyncState<T = any>(
  initialData: T | null = null
): UseAsyncStateReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async (asyncFunction: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await asyncFunction()
      
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null })
      }
      
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('An unknown error occurred')
      
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false, error: errorObj }))
      }
      
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    })
  }, [initialData])

  return {
    ...state,
    execute,
    reset,
  }
}