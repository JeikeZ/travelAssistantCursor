import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showPercentage?: boolean
}

export function ProgressBar({ 
  value, 
  max = 100, 
  className, 
  showPercentage = true 
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100)
  
  return (
    <div className="space-y-2">
      {showPercentage && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Packing Progress</span>
          <span className="font-medium text-blue-600">{percentage}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full h-3', className)}>
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}