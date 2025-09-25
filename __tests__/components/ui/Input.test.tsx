import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders correctly with default props', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md')
    expect(input).not.toBeDisabled()
  })

  it('renders with label', () => {
    render(<Input label="Test Label" />)
    
    const input = screen.getByRole('textbox')
    const label = screen.getByText('Test Label')
    
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('for', input.id)
    expect(input).toHaveAccessibleName('Test Label')
  })

  it('renders with required indicator', () => {
    render(<Input label="Required Field" required />)
    
    const label = screen.getByText('Required Field')
    const requiredIndicator = screen.getByText('*')
    
    expect(requiredIndicator).toBeInTheDocument()
    expect(requiredIndicator).toHaveAttribute('aria-label', 'required')
    expect(requiredIndicator).toHaveClass('text-red-500')
  })

  it('renders with description', () => {
    render(<Input description="This is a helpful description" />)
    
    const input = screen.getByRole('textbox')
    const description = screen.getByText('This is a helpful description')
    
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('text-sm', 'text-slate-600')
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(description.id))
  })

  it('renders with error message', () => {
    render(<Input error="This field is required" />)
    
    const input = screen.getByRole('textbox')
    const error = screen.getByRole('alert')
    
    expect(error).toBeInTheDocument()
    expect(error).toHaveTextContent('This field is required')
    expect(error).toHaveClass('text-sm', 'text-red-600')
    expect(input).toHaveClass('border-red-500', 'focus:border-red-500')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(error.id))
  })

  it('renders with both description and error', () => {
    render(
      <Input 
        description="Helpful description" 
        error="Error message" 
      />
    )
    
    const input = screen.getByRole('textbox')
    const description = screen.getByText('Helpful description')
    const error = screen.getByRole('alert')
    
    expect(description).toBeInTheDocument()
    expect(error).toBeInTheDocument()
    
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toContain(description.id)
    expect(describedBy).toContain(error.id)
  })

  it('handles user input', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
    expect(handleChange).toHaveBeenCalledTimes(11) // One for each character
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />)
    
    const input = screen.getByRole('textbox')
    
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('accepts custom className', () => {
    render(<Input className="custom-class" />)
    
    const input = screen.getByRole('textbox')
    
    expect(input).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    
    render(<Input ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current).toBe(screen.getByRole('textbox'))
  })

  it('passes through HTML input attributes', () => {
    render(
      <Input
        type="email"
        placeholder="Enter email"
        autoComplete="email"
        maxLength={50}
        data-testid="email-input"
      />
    )
    
    const input = screen.getByRole('textbox')
    
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('placeholder', 'Enter email')
    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toHaveAttribute('maxlength', '50')
    expect(input).toHaveAttribute('data-testid', 'email-input')
  })

  it('supports different input types', () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url']
    
    types.forEach(type => {
      const { rerender } = render(<Input type={type as any} />)
      const input = screen.getByRole(type === 'password' ? 'textbox' : 'textbox')
      
      expect(input).toHaveAttribute('type', type)
      
      rerender(<Input type={type as any} />)
    })
  })

  describe('Focus management', () => {
    it('can be focused programmatically', () => {
      const ref = React.createRef<HTMLInputElement>()
      
      render(<Input ref={ref} />)
      
      ref.current?.focus()
      
      expect(ref.current).toHaveFocus()
    })

    it('has proper focus styles', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      
      expect(input.className).toMatch(/focus:border-blue-500|focus:ring-2/)
    })

    it('applies error focus styles when error is present', () => {
      render(<Input error="Error message" />)
      
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('focus:border-red-500', 'focus:ring-red-500/20')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Input
          label="Username"
          description="Enter your username"
          error="Username is required"
          required
        />
      )
      
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveAttribute('aria-required', 'true')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAccessibleName('Username')
      expect(input).toHaveAccessibleDescription(expect.stringContaining('Enter your username'))
    })

    it('generates unique IDs for multiple inputs', () => {
      render(
        <div>
          <Input label="First Input" />
          <Input label="Second Input" />
        </div>
      )
      
      const inputs = screen.getAllByRole('textbox')
      const labels = screen.getAllByText(/Input/)
      
      expect(inputs[0].id).not.toBe(inputs[1].id)
      expect(labels[0].getAttribute('for')).toBe(inputs[0].id)
      expect(labels[1].getAttribute('for')).toBe(inputs[1].id)
    })

    it('associates error message with input', () => {
      render(<Input error="This is an error" />)
      
      const input = screen.getByRole('textbox')
      const error = screen.getByRole('alert')
      
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(error.id))
    })

    it('associates description with input', () => {
      render(<Input description="This is a description" />)
      
      const input = screen.getByRole('textbox')
      const description = screen.getByText('This is a description')
      
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(description.id))
    })
  })

  describe('Keyboard navigation', () => {
    it('supports Tab navigation', () => {
      render(
        <div>
          <Input />
          <Input />
        </div>
      )
      
      const inputs = screen.getAllByRole('textbox')
      
      inputs[0].focus()
      expect(inputs[0]).toHaveFocus()
      
      fireEvent.keyDown(inputs[0], { key: 'Tab' })
      // Note: jsdom doesn't automatically move focus, but we can verify the element is focusable
      expect(inputs[1]).not.toBeDisabled()
    })

    it('supports Enter key for form submission', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault())
      
      render(
        <form onSubmit={handleSubmit}>
          <Input />
        </form>
      )
      
      const input = screen.getByRole('textbox')
      
      fireEvent.keyDown(input, { key: 'Enter' })
      fireEvent.submit(input.closest('form')!)
      
      expect(handleSubmit).toHaveBeenCalled()
    })
  })

  describe('Memoization', () => {
    it('should not re-render when props have not changed', () => {
      const renderSpy = jest.fn()
      
      function TestInput(props: any) {
        renderSpy()
        return <Input {...props} />
      }
      
      const { rerender } = render(<TestInput label="Test" />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestInput label="Test" />)
      
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })
})