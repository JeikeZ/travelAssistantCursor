import React, { memo, useId } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: string
}

function CheckboxComponent({ className, label, description, error, disabled, ...props }: CheckboxProps) {
  const id = useId()
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="flex items-start space-x-3">
      <div className="relative flex-shrink-0 pt-0.5">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          disabled={disabled}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={!!error}
          {...props}
        />
        <div
          className={cn(
            'w-5 h-5 border-2 rounded flex items-center justify-center transition-all cursor-pointer',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2',
            props.checked
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300 hover:border-blue-400',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-500',
            className
          )}
          role="presentation"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (!disabled) {
              // Trigger the hidden input's change event
              const input = e.currentTarget.previousElementSibling as HTMLInputElement
              if (input) {
                input.click()
              }
            }
          }}
        >
          {props.checked && (
            <Check className="w-3 h-3 text-white" aria-hidden="true" />
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        {label && (
          <label 
            htmlFor={id}
            className={cn(
              'text-sm font-medium text-slate-900 cursor-pointer select-none',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
          </label>
        )}
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-slate-600 mt-1"
          >
            {description}
          </p>
        )}
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-600 mt-1"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export const Checkbox = memo(CheckboxComponent)