import React, { memo, useId, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  description?: string
  required?: boolean
}

const InputComponent = forwardRef<HTMLInputElement, InputProps>(
  function InputComponent({ className, label, error, description, required, ...props }, ref) {
    const id = useId()
    const descriptionId = description ? `${id}-description` : undefined
    const errorId = error ? `${id}-error` : undefined

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={id}
            className="text-sm font-medium text-slate-900 select-none"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900',
            'placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
            'transition-colors duration-200',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={!!error}
          aria-required={required}
          {...props}
        />
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-slate-600"
          >
            {description}
          </p>
        )}
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

export const Input = memo(InputComponent)