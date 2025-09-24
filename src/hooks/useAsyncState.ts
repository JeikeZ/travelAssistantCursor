import { useState, useCallback, useRef, useEffect } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export interface AsyncActions<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => Promise<T>
  reset: () => void
  setData: (data: T) => void
}

export function useAsyncState<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asyncFunction?: (...args: any[]) => Promise<T>,
  initialData: T | null = null
): AsyncState<T> & AsyncActions<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (...args: any[]): Promise<T> => {
      if (!asyncFunction) {
        throw new Error('No async function provided')
      }

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const result = await asyncFunction(...args)
        
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, data: result, loading: false }))
        }
        
        return result
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error))
        
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, error: errorObj, loading: false }))
        }
        
        throw errorObj
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    })
  }, [initialData])

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
  }
}