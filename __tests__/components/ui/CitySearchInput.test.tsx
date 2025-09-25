import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CitySearchInput } from '@/components/ui/CitySearchInput'
import { CityOption } from '@/types'

// Mock the debounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebouncedCallback: jest.fn((callback) => [callback])
}))

// Mock fetch
global.fetch = jest.fn()

const mockCities: CityOption[] = [
  {
    id: '1',
    name: 'Tokyo',
    country: 'Japan',
    admin1: 'Tokyo',
    latitude: 35.6895,
    longitude: 139.69171,
    displayName: 'Tokyo, Tokyo, Japan'
  },
  {
    id: '2',
    name: 'Osaka',
    country: 'Japan',
    admin1: 'Osaka',
    latitude: 34.6937,
    longitude: 135.5023,
    displayName: 'Osaka, Osaka, Japan'
  }
]

describe('CitySearchInput', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('renders correctly with default props', () => {
    render(<CitySearchInput value={null} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Search for a city or country...')
    expect(input).toHaveValue('')
  })

  it('renders with custom placeholder', () => {
    render(
      <CitySearchInput 
        value={null} 
        onChange={mockOnChange} 
        placeholder="Custom placeholder"
      />
    )
    
    const input = screen.getByRole('textbox')
    
    expect(input).toHaveAttribute('placeholder', 'Custom placeholder')
  })

  it('displays selected city value', () => {
    render(<CitySearchInput value={mockCities[0]} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    
    expect(input).toHaveValue('Tokyo, Tokyo, Japan')
  })

  it('shows error message when provided', () => {
    render(
      <CitySearchInput 
        value={null} 
        onChange={mockOnChange} 
        error="This field is required"
      />
    )
    
    const error = screen.getByText('This field is required')
    
    expect(error).toBeInTheDocument()
    expect(error).toHaveClass('text-sm', 'text-red-600')
  })

  it('is disabled when disabled prop is true', () => {
    render(<CitySearchInput value={null} onChange={mockOnChange} disabled />)
    
    const input = screen.getByRole('textbox')
    
    expect(input).toBeDisabled()
  })

  describe('Search functionality', () => {
    it('fetches cities when user types', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Tokyo')
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/cities?q=Tokyo')
      })
    })

    it('does not search for queries shorter than 2 characters', async () => {
      const user = userEvent.setup()
      
      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'T')
      
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('shows loading spinner during search', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ cities: mockCities })
        }), 100))
      )

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Tokyo')
      
      // Check for loading spinner
      const spinner = screen.getByText('', { selector: '.animate-spin' })
      expect(spinner).toBeInTheDocument()
    })

    it('displays search results in dropdown', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Japan')
      
      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument()
        expect(screen.getByText('Osaka')).toBeInTheDocument()
      })
    })

    it('shows "No cities found" message when no results', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: [] })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Nonexistent')
      
      await waitFor(() => {
        expect(screen.getByText(/No cities found for "Nonexistent"/)).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Tokyo')
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error searching cities:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })

    it('cancels previous requests when new search is made', async () => {
      const user = userEvent.setup()
      const abortSpy = jest.fn()
      
      // Mock AbortController
      const mockAbortController = {
        abort: abortSpy,
        signal: {} as AbortSignal
      }
      
      global.AbortController = jest.fn(() => mockAbortController) as any
      
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      )

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'To')
      await user.type(input, 'kyo')
      
      expect(abortSpy).toHaveBeenCalled()
    })
  })

  describe('Selection functionality', () => {
    it('selects city when option is clicked', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Japan')
      
      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument()
      })
      
      const tokyoOption = screen.getByRole('button', { name: /Tokyo/ })
      await user.click(tokyoOption)
      
      expect(mockOnChange).toHaveBeenCalledWith(mockCities[0])
      expect(input).toHaveValue('Tokyo, Tokyo, Japan')
    })

    it('clears selection when user types different text', async () => {
      const user = userEvent.setup()
      
      render(<CitySearchInput value={mockCities[0]} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.clear(input)
      await user.type(input, 'Different text')
      
      expect(mockOnChange).toHaveBeenCalledWith(null)
    })
  })

  describe('Keyboard navigation', () => {
    it('opens dropdown on ArrowDown key', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Japan')
      await user.keyboard('{ArrowDown}')
      
      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument()
      })
    })

    it('navigates through options with arrow keys', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Japan')
      
      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument()
      })
      
      await user.keyboard('{ArrowDown}')
      
      // First option should be highlighted
      const firstOption = screen.getByRole('button', { name: /Tokyo/ })
      expect(firstOption).toHaveClass('bg-blue-50')
      
      await user.keyboard('{ArrowDown}')
      
      // Second option should be highlighted
      const secondOption = screen.getByRole('button', { name: /Osaka/ })
      expect(secondOption).toHaveClass('bg-blue-50')
    })

    it('selects highlighted option on Enter key', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Japan')
      
      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument()
      })
      
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      expect(mockOnChange).toHaveBeenCalledWith(mockCities[0])
    })

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Japan')
      
      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument()
      })
      
      await user.keyboard('{Escape}')
      
      expect(screen.queryByText('Tokyo')).not.toBeInTheDocument()
    })
  })

  describe('Click outside behavior', () => {
    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(
        <div>
          <CitySearchInput value={null} onChange={mockOnChange} />
          <button>Outside button</button>
        </div>
      )
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Japan')
      
      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument()
      })
      
      const outsideButton = screen.getByRole('button', { name: 'Outside button' })
      await user.click(outsideButton)
      
      expect(screen.queryByText('Tokyo')).not.toBeInTheDocument()
    })
  })

  describe('Focus behavior', () => {
    it('opens dropdown on focus if input has value', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      // Type something first
      await user.type(input, 'Japan')
      
      // Blur the input
      await user.tab()
      
      // Focus again
      await user.click(input)
      
      // Should trigger search again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveAttribute('type', 'text')
      expect(input).toHaveAccessibleName() // Should have accessible name from placeholder or label
    })

    it('maintains focus management correctly', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: mockCities })
      })

      render(<CitySearchInput value={null} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'Japan')
      
      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument()
      })
      
      const tokyoOption = screen.getByRole('button', { name: /Tokyo/ })
      await user.click(tokyoOption)
      
      // Input should lose focus after selection
      expect(input).not.toHaveFocus()
    })
  })

  describe('Custom styling', () => {
    it('applies custom className', () => {
      render(
        <CitySearchInput 
          value={null} 
          onChange={mockOnChange} 
          className="custom-class"
        />
      )
      
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('custom-class')
    })

    it('applies error styling when error is provided', () => {
      render(
        <CitySearchInput 
          value={null} 
          onChange={mockOnChange} 
          error="Error message"
        />
      )
      
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('border-red-500', 'focus:border-red-500')
    })
  })
})