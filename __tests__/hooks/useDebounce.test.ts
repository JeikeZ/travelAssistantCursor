import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebouncedCallback } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    
    expect(result.current).toBe('initial')
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )
    
    expect(result.current).toBe('initial')
    
    // Change the value
    rerender({ value: 'updated', delay: 500 })
    
    // Value should not change immediately
    expect(result.current).toBe('initial')
    
    // Fast-forward time by 499ms (less than delay)
    act(() => {
      jest.advanceTimersByTime(499)
    })
    
    // Value should still be the old one
    expect(result.current).toBe('initial')
    
    // Fast-forward time by 1ms more (total 500ms)
    act(() => {
      jest.advanceTimersByTime(1)
    })
    
    // Now the value should be updated
    expect(result.current).toBe('updated')
  })

  it('cancels previous timeout when value changes quickly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )
    
    // Change value multiple times quickly
    rerender({ value: 'first', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    rerender({ value: 'second', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    rerender({ value: 'final', delay: 500 })
    
    // Value should still be initial
    expect(result.current).toBe('initial')
    
    // Fast-forward by the full delay
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Should have the final value, not intermediate ones
    expect(result.current).toBe('final')
  })

  it('works with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    )
    
    rerender({ value: 'updated', delay: 1000 })
    
    act(() => {
      jest.advanceTimersByTime(999)
    })
    
    expect(result.current).toBe('initial')
    
    act(() => {
      jest.advanceTimersByTime(1)
    })
    
    expect(result.current).toBe('updated')
  })

  it('handles delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )
    
    rerender({ value: 'updated', delay: 1000 })
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Should still be initial because delay was changed to 1000
    expect(result.current).toBe('initial')
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Now should be updated
    expect(result.current).toBe('updated')
  })

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    
    const { unmount } = renderHook(() => useDebounce('test', 500))
    
    unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
    
    clearTimeoutSpy.mockRestore()
  })

  describe('edge cases', () => {
    it('handles zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 0 } }
      )
      
      rerender({ value: 'updated', delay: 0 })
      
      act(() => {
        jest.advanceTimersByTime(0)
      })
      
      expect(result.current).toBe('updated')
    })

    it('handles negative delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: -100 } }
      )
      
      rerender({ value: 'updated', delay: -100 })
      
      act(() => {
        jest.advanceTimersByTime(0)
      })
      
      expect(result.current).toBe('updated')
    })

    it('handles undefined and null values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: undefined, delay: 500 } }
      )
      
      expect(result.current).toBe(undefined)
      
      rerender({ value: null as any, delay: 500 })
      
      act(() => {
        jest.advanceTimersByTime(500)
      })
      
      expect(result.current).toBe(null)
    })
  })
})

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns a debounced callback function', () => {
    const mockCallback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500))
    
    const [debouncedCallback] = result.current
    
    expect(typeof debouncedCallback).toBe('function')
  })

  it('debounces callback execution', () => {
    const mockCallback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500))
    
    const [debouncedCallback] = result.current
    
    // Call the debounced function multiple times
    act(() => {
      debouncedCallback('arg1')
      debouncedCallback('arg2')
      debouncedCallback('arg3')
    })
    
    // Callback should not be called yet
    expect(mockCallback).not.toHaveBeenCalled()
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Callback should be called once with the last arguments
    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(mockCallback).toHaveBeenCalledWith('arg3')
  })

  it('cancels previous calls when called again quickly', () => {
    const mockCallback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500))
    
    const [debouncedCallback] = result.current
    
    act(() => {
      debouncedCallback('first')
    })
    
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    act(() => {
      debouncedCallback('second')
    })
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Should only be called with the second argument
    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(mockCallback).toHaveBeenCalledWith('second')
  })

  it('provides a cancel function', () => {
    const mockCallback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500))
    
    const [debouncedCallback, cancel] = result.current
    
    act(() => {
      debouncedCallback('test')
    })
    
    act(() => {
      cancel()
    })
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Callback should not be called because it was cancelled
    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('handles multiple arguments correctly', () => {
    const mockCallback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500))
    
    const [debouncedCallback] = result.current
    
    act(() => {
      debouncedCallback('arg1', 'arg2', 'arg3')
    })
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
  })

  it('preserves callback reference when delay changes', () => {
    const mockCallback = jest.fn()
    const { result, rerender } = renderHook(
      ({ delay }) => useDebouncedCallback(mockCallback, delay),
      { initialProps: { delay: 500 } }
    )
    
    const [firstCallback] = result.current
    
    rerender({ delay: 1000 })
    
    const [secondCallback] = result.current
    
    // Callback reference should be the same
    expect(firstCallback).toBe(secondCallback)
  })

  it('updates when callback changes', () => {
    const mockCallback1 = jest.fn()
    const mockCallback2 = jest.fn()
    
    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 500),
      { initialProps: { callback: mockCallback1 } }
    )
    
    const [debouncedCallback1] = result.current
    
    rerender({ callback: mockCallback2 })
    
    const [debouncedCallback2] = result.current
    
    // Should get a new debounced callback
    expect(debouncedCallback1).not.toBe(debouncedCallback2)
    
    act(() => {
      debouncedCallback2('test')
    })
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    expect(mockCallback2).toHaveBeenCalledWith('test')
    expect(mockCallback1).not.toHaveBeenCalled()
  })

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const mockCallback = jest.fn()
    
    const { result, unmount } = renderHook(() => useDebouncedCallback(mockCallback, 500))
    
    const [debouncedCallback] = result.current
    
    act(() => {
      debouncedCallback('test')
    })
    
    unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
    
    clearTimeoutSpy.mockRestore()
  })

  describe('edge cases', () => {
    it('handles zero delay', () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useDebouncedCallback(mockCallback, 0))
      
      const [debouncedCallback] = result.current
      
      act(() => {
        debouncedCallback('test')
      })
      
      act(() => {
        jest.advanceTimersByTime(0)
      })
      
      expect(mockCallback).toHaveBeenCalledWith('test')
    })

    it('handles callback that throws error', () => {
      const mockCallback = jest.fn(() => {
        throw new Error('Test error')
      })
      
      const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500))
      
      const [debouncedCallback] = result.current
      
      act(() => {
        debouncedCallback('test')
      })
      
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(500)
        })
      }).toThrow('Test error')
    })

    it('handles undefined callback', () => {
      const { result } = renderHook(() => useDebouncedCallback(undefined as any, 500))
      
      const [debouncedCallback] = result.current
      
      expect(() => {
        act(() => {
          if (debouncedCallback) {
            debouncedCallback('test' as any)
          }
        })
      }).not.toThrow()
    })
  })
})