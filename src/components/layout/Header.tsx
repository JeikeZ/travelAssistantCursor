'use client'

import { memo } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export const Header = memo(function Header({ title, subtitle, className = '' }: HeaderProps) {
  return (
    <header className={`bg-gray-200 dark:bg-gray-800 py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-gray-700 dark:text-gray-300">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  )
})

interface PageHeaderProps {
  title: string
  subtitle?: string
  backButton?: React.ReactNode
  actions?: React.ReactNode
}

export const PageHeader = memo(function PageHeader({ 
  title, 
  subtitle, 
  backButton, 
  actions 
}: PageHeaderProps) {
  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {backButton || <div className="w-20"></div>}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-700 dark:text-gray-300">
                {subtitle}
              </p>
            )}
          </div>
          {actions || <div className="w-20"></div>}
        </div>
      </div>
    </header>
  )
})