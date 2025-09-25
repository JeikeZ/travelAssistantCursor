import { cn, celsiusToFahrenheit, fahrenheitToCelsius, convertTemperature, formatDate } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })

    it('merges tailwind classes correctly', () => {
      // This tests the tailwind-merge functionality
      expect(cn('p-4', 'p-2')).toBe('p-2') // Later padding should override
    })

    it('handles empty input', () => {
      expect(cn()).toBe('')
    })

    it('handles arrays', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('handles objects', () => {
      expect(cn({
        'class1': true,
        'class2': false,
        'class3': true
      })).toBe('class1 class3')
    })
  })

  describe('temperature conversion', () => {
    describe('celsiusToFahrenheit', () => {
      it('converts 0°C to 32°F', () => {
        expect(celsiusToFahrenheit(0)).toBe(32)
      })

      it('converts 100°C to 212°F', () => {
        expect(celsiusToFahrenheit(100)).toBe(212)
      })

      it('converts 25°C to 77°F', () => {
        expect(celsiusToFahrenheit(25)).toBe(77)
      })

      it('converts negative temperatures', () => {
        expect(celsiusToFahrenheit(-10)).toBe(14)
      })

      it('rounds to nearest integer', () => {
        expect(celsiusToFahrenheit(23.7)).toBe(75) // 74.66 rounded to 75
      })
    })

    describe('fahrenheitToCelsius', () => {
      it('converts 32°F to 0°C', () => {
        expect(fahrenheitToCelsius(32)).toBe(0)
      })

      it('converts 212°F to 100°C', () => {
        expect(fahrenheitToCelsius(212)).toBe(100)
      })

      it('converts 77°F to 25°C', () => {
        expect(fahrenheitToCelsius(77)).toBe(25)
      })

      it('converts negative temperatures', () => {
        expect(fahrenheitToCelsius(14)).toBe(-10)
      })

      it('rounds to nearest integer', () => {
        expect(fahrenheitToCelsius(75)).toBe(24) // 23.89 rounded to 24
      })
    })

    describe('convertTemperature', () => {
      it('returns same temperature when units are the same', () => {
        expect(convertTemperature(25, 'C', 'C')).toBe(25)
        expect(convertTemperature(77, 'F', 'F')).toBe(77)
      })

      it('converts Celsius to Fahrenheit', () => {
        expect(convertTemperature(0, 'C', 'F')).toBe(32)
        expect(convertTemperature(25, 'C', 'F')).toBe(77)
      })

      it('converts Fahrenheit to Celsius', () => {
        expect(convertTemperature(32, 'F', 'C')).toBe(0)
        expect(convertTemperature(77, 'F', 'C')).toBe(25)
      })

      it('handles edge cases', () => {
        expect(convertTemperature(0, 'F', 'C')).toBe(-18)
        expect(convertTemperature(-40, 'C', 'F')).toBe(-40) // -40 is the same in both scales
        expect(convertTemperature(-40, 'F', 'C')).toBe(-40)
      })
    })
  })

  describe('formatDate', () => {
    beforeEach(() => {
      // Mock Date to have consistent tests
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('formats today as "Today"', () => {
      const today = '2024-01-15'
      expect(formatDate(today)).toBe('Today')
    })

    it('formats tomorrow as "Tomorrow"', () => {
      const tomorrow = '2024-01-16'
      expect(formatDate(tomorrow)).toBe('Tomorrow')
    })

    it('formats other dates with day and month', () => {
      const futureDate = '2024-01-20'
      const result = formatDate(futureDate)
      
      // Should contain day of week and month/day
      expect(result).toMatch(/\w{3}, \w{3} \d{1,2}/)
    })

    it('formats past dates correctly', () => {
      const pastDate = '2024-01-10'
      const result = formatDate(pastDate)
      
      expect(result).toMatch(/\w{3}, \w{3} \d{1,2}/)
    })

    it('handles different date formats', () => {
      const isoDate = '2024-01-20T15:30:00.000Z'
      const result = formatDate(isoDate)
      
      expect(result).toMatch(/\w{3}, \w{3} \d{1,2}/)
    })

    it('ignores time when comparing dates', () => {
      // Today at different times should still be "Today"
      const todayMorning = '2024-01-15T06:00:00.000Z'
      const todayEvening = '2024-01-15T23:59:59.999Z'
      
      expect(formatDate(todayMorning)).toBe('Today')
      expect(formatDate(todayEvening)).toBe('Today')
    })

    it('handles year boundaries correctly', () => {
      jest.setSystemTime(new Date('2024-12-31T12:00:00.000Z'))
      
      const nextYear = '2025-01-01'
      expect(formatDate(nextYear)).toBe('Tomorrow')
    })

    it('handles leap years', () => {
      jest.setSystemTime(new Date('2024-02-28T12:00:00.000Z')) // 2024 is a leap year
      
      const leapDay = '2024-02-29'
      expect(formatDate(leapDay)).toBe('Tomorrow')
    })
  })

  describe('commonStyles', () => {
    it('exports common style objects', () => {
      const { commonStyles } = require('@/lib/utils')
      
      expect(commonStyles).toBeDefined()
      expect(commonStyles.button).toBeDefined()
      expect(commonStyles.button.base).toBeDefined()
      expect(commonStyles.button.primary).toBeDefined()
      expect(commonStyles.input).toBeDefined()
      expect(commonStyles.text).toBeDefined()
    })

    it('has consistent button styles', () => {
      const { commonStyles } = require('@/lib/utils')
      
      expect(commonStyles.button.base).toContain('inline-flex')
      expect(commonStyles.button.base).toContain('items-center')
      expect(commonStyles.button.primary).toContain('bg-blue-600')
      expect(commonStyles.button.secondary).toContain('bg-gray-100')
    })

    it('has accessible focus styles', () => {
      const { commonStyles } = require('@/lib/utils')
      
      expect(commonStyles.focusRing).toContain('focus:outline-none')
      expect(commonStyles.focusRing).toContain('focus:ring-2')
      expect(commonStyles.focusVisible).toContain('focus-visible:outline-none')
    })

    it('has consistent spacing utilities', () => {
      const { commonStyles } = require('@/lib/utils')
      
      expect(commonStyles.spacing.sm).toBe('space-y-2')
      expect(commonStyles.spacing.md).toBe('space-y-4')
      expect(commonStyles.spacing.lg).toBe('space-y-6')
    })
  })

  describe('edge cases and error handling', () => {
    it('handles extreme temperature values', () => {
      expect(celsiusToFahrenheit(1000)).toBe(1832)
      expect(celsiusToFahrenheit(-273.15)).toBe(-459) // Absolute zero
      expect(fahrenheitToCelsius(-459)).toBe(-273)
    })

    it('handles invalid date strings gracefully', () => {
      const invalidDate = 'invalid-date'
      const result = formatDate(invalidDate)
      
      // Should not throw error, but might return "Invalid Date" or similar
      expect(typeof result).toBe('string')
    })

    it('handles empty date strings', () => {
      expect(() => formatDate('')).not.toThrow()
    })

    it('handles null and undefined in cn', () => {
      expect(cn(null, undefined, 'valid')).toBe('valid')
    })

    it('handles very large numbers in temperature conversion', () => {
      expect(() => celsiusToFahrenheit(Number.MAX_SAFE_INTEGER)).not.toThrow()
      expect(() => fahrenheitToCelsius(Number.MAX_SAFE_INTEGER)).not.toThrow()
    })

    it('handles decimal precision correctly', () => {
      // Test that rounding works consistently
      expect(celsiusToFahrenheit(23.4)).toBe(74)
      expect(celsiusToFahrenheit(23.5)).toBe(74)
      expect(celsiusToFahrenheit(23.6)).toBe(74)
    })
  })

  describe('performance considerations', () => {
    it('cn function handles many classes efficiently', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class${i}`)
      
      const startTime = performance.now()
      const result = cn(...manyClasses)
      const endTime = performance.now()
      
      expect(result).toContain('class0')
      expect(result).toContain('class99')
      expect(endTime - startTime).toBeLessThan(10) // Should be very fast
    })

    it('temperature conversions are fast', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        celsiusToFahrenheit(i)
        fahrenheitToCelsius(i)
      }
      
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(50) // Should be very fast
    })
  })

  describe('type safety', () => {
    it('handles different input types for cn', () => {
      expect(() => cn('string', 123 as any, true, { key: 'value' })).not.toThrow()
    })

    it('temperature functions handle numeric edge cases', () => {
      expect(celsiusToFahrenheit(NaN)).toBeNaN()
      expect(fahrenheitToCelsius(NaN)).toBeNaN()
      expect(celsiusToFahrenheit(Infinity)).toBe(Infinity)
      expect(fahrenheitToCelsius(Infinity)).toBe(Infinity)
    })
  })
})