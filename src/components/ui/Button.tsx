import React, { memo } from 'react'
import { cn, commonStyles } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  loading?: boolean
  'aria-label'?: string
}

function ButtonComponent({
  className,
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: commonStyles.button.primary,
    secondary: commonStyles.button.secondary,
    outline: commonStyles.button.outline,
    ghost: commonStyles.button.ghost,
  }
  
  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  }
  
  const isDisabled = disabled || loading

  return (
    <button
      className={cn(
        commonStyles.button.base,
        variantStyles[variant],
        sizeStyles[size],
        loading && 'cursor-wait',
        className
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

export const Button = memo(ButtonComponent)