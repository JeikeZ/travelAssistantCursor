import React, { memo } from 'react'
import { cn, commonStyles } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

function ButtonComponent({
  className,
  variant = 'primary',
  size = 'md',
  children,
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
  
  return (
    <button
      className={cn(
        commonStyles.button.base,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export const Button = memo(ButtonComponent)