import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function Checkbox({ className, label, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            'w-5 h-5 border-2 rounded flex items-center justify-center transition-all',
            props.checked
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300 hover:border-blue-400',
            className
          )}
        >
          {props.checked && (
            <Check className="w-3 h-3 text-white" />
          )}
        </div>
      </div>
      {label && (
        <span className="text-sm text-slate-800 select-none">
          {label}
        </span>
      )}
    </label>
  )
}