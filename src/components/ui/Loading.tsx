import React, { memo } from 'react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export const Loading = memo(function Loading({ 
  size = 'md', 
  className,
  text 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-3">
        <div 
          className={cn(
            'animate-spin rounded-full border-b-2 border-blue-600',
            sizeClasses[size]
          )}
          role="status"
          aria-label="Loading"
        />
        {text && (
          <p className={cn('text-gray-700 dark:text-gray-300', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
})

export const LoadingSkeleton = memo(function LoadingSkeleton({
  className
}: {
  className?: string
}) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
})