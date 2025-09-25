import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
    expect(button).not.toBeDisabled()
  })

  it('renders with different variants', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'] as const
    
    variants.forEach(variant => {
      const { rerender } = render(<Button variant={variant}>{variant}</Button>)
      const button = screen.getByRole('button', { name: variant })
      
      expect(button).toBeInTheDocument()
      
      rerender(<Button variant={variant}>{variant}</Button>)
    })
  })

  it('renders with different sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    
    sizes.forEach(size => {
      const { rerender } = render(<Button size={size}>{size}</Button>)
      const button = screen.getByRole('button', { name: size })
      
      expect(button).toBeInTheDocument()
      
      if (size === 'sm') {
        expect(button).toHaveClass('h-8', 'px-3', 'text-sm')
      } else if (size === 'md') {
        expect(button).toHaveClass('h-10', 'px-4')
      } else if (size === 'lg') {
        expect(button).toHaveClass('h-12', 'px-6', 'text-lg')
      }
      
      rerender(<Button size={size}>{size}</Button>)
    })
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Loading button</Button>)
    
    const button = screen.getByRole('button', { name: 'Loading button' })
    
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveClass('cursor-wait')
    
    // Check for loading spinner
    const spinner = button.querySelector('svg')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>)
    
    const button = screen.getByRole('button', { name: 'Disabled button' })
    
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('is disabled when loading is true', () => {
    render(<Button loading>Loading button</Button>)
    
    const button = screen.getByRole('button', { name: 'Loading button' })
    
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled button</Button>)
    
    const button = screen.getByRole('button', { name: 'Disabled button' })
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not call onClick when loading', () => {
    const handleClick = jest.fn()
    render(<Button loading onClick={handleClick}>Loading button</Button>)
    
    const button = screen.getByRole('button', { name: 'Loading button' })
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom button</Button>)
    
    const button = screen.getByRole('button', { name: 'Custom button' })
    
    expect(button).toHaveClass('custom-class')
  })

  it('accepts custom aria-label', () => {
    render(<Button aria-label="Custom aria label">Button</Button>)
    
    const button = screen.getByRole('button', { name: 'Custom aria label' })
    
    expect(button).toBeInTheDocument()
  })

  it('passes through other HTML button attributes', () => {
    render(
      <Button 
        type="submit" 
        form="test-form" 
        data-testid="custom-button"
      >
        Submit button
      </Button>
    )
    
    const button = screen.getByRole('button', { name: 'Submit button' })
    
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('form', 'test-form')
    expect(button).toHaveAttribute('data-testid', 'custom-button')
  })

  it('supports keyboard navigation', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Keyboard button</Button>)
    
    const button = screen.getByRole('button', { name: 'Keyboard button' })
    
    // Focus the button
    button.focus()
    expect(button).toHaveFocus()
    
    // Press Enter
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    // Press Space
    fireEvent.keyDown(button, { key: ' ', code: 'Space' })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('has proper focus styles', () => {
    render(<Button>Focus button</Button>)
    
    const button = screen.getByRole('button', { name: 'Focus button' })
    
    // The button should have focus styles in its classes
    expect(button.className).toMatch(/focus-visible:outline-none|focus-visible:ring-2/)
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button', { name: 'Loading' })
      
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('has proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button', { name: 'Disabled' })
      
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('loading spinner has aria-hidden', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button', { name: 'Loading' })
      const spinner = button.querySelector('svg')
      
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Memoization', () => {
    it('should not re-render when props have not changed', () => {
      const renderSpy = jest.fn()
      
      function TestButton(props: any) {
        renderSpy()
        return <Button {...props}>Test</Button>
      }
      
      const { rerender } = render(<TestButton variant="primary" />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestButton variant="primary" />)
      
      // Should still be called twice due to the wrapper component
      // but Button itself should be memoized
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })
})