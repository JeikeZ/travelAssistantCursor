'use client'

import { useState, useCallback } from 'react'
import { validatePassword, validateUsername } from '@/lib/auth-utils'
import { User, UserCredentials } from '@/types'
import { X, Eye, EyeOff } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: User) => void
}

type AuthMode = 'login' | 'register'

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [credentials, setCredentials] = useState<UserCredentials>({
    username: '',
    password: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{
    username?: string
    password?: string
    confirmPassword?: string
    general?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const resetForm = useCallback(() => {
    setCredentials({ username: '', password: '' })
    setConfirmPassword('')
    setErrors({})
    setIsLoading(false)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    setMode('login')
    onClose()
  }, [onClose, resetForm])

  const handleBackdropClick = useCallback(() => {
    // Only close the modal if in login mode
    // In register mode, ignore backdrop clicks
    if (mode === 'login') {
      onClose()
    }
  }, [mode, onClose])

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {}

    // Validate username
    const usernameValidation = validateUsername(credentials.username)
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error
    }

    // Validate password
    if (!credentials.password) {
      newErrors.password = 'Password is required'
    } else if (mode === 'register') {
      const passwordValidation = validatePassword(credentials.password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0]
      }
    }

    // Validate password confirmation (only in register mode)
    if (mode === 'register') {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (credentials.password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [credentials, confirmPassword, mode])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (data.success && data.user) {
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Clear any cached trip data
        localStorage.removeItem('currentTrip')
        localStorage.removeItem('currentTripId')
        localStorage.removeItem('currentPackingList')
        
        onSuccess(data.user)
        handleClose()
      } else {
        setErrors({ general: data.error || 'An error occurred' })
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }, [credentials, mode, validateForm, onSuccess, handleClose])

  const handleGuestLogin = useCallback(async () => {
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success && data.user) {
        // Store guest user in localStorage
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Clear any cached trip data
        localStorage.removeItem('currentTrip')
        localStorage.removeItem('currentTripId')
        localStorage.removeItem('currentPackingList')
        
        onSuccess(data.user)
        handleClose()
      } else {
        setErrors({ general: data.error || 'Failed to create guest account' })
      }
    } catch (error) {
      console.error('Guest login error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }, [onSuccess, handleClose])

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'login' ? 'register' : 'login')
    setCredentials({ username: '', password: '' })
    setConfirmPassword('')
    setErrors({})
  }, [])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Content */}
        <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl shadow-2xl p-8 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to the Travel Assistant
            </h2>
            <p className="text-gray-700 text-sm">
              {mode === 'login' 
                ? 'Please login to access your trip information'
                : 'Please create an account with a unique username and password to store packing list information'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="w-full h-12 px-4 bg-white rounded-full border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-500"
                disabled={isLoading}
              />
              {credentials.username && (
                <button
                  type="button"
                  onClick={() => setCredentials(prev => ({ ...prev, username: '' }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="Clear username"
                >
                  <X size={18} />
                </button>
              )}
              {errors.username && (
                <p className="mt-2 text-sm text-red-600 ml-4">{errors.username}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full h-12 px-4 pr-12 bg-white rounded-full border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-500"
                disabled={isLoading}
              />
              {credentials.password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 ml-4">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Input (only show in register mode) */}
            {mode === 'register' && (
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-12 bg-white rounded-full border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-500"
                  disabled={isLoading}
                />
                {confirmPassword && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 ml-4">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Password Requirements (only show in register mode) */}
            {mode === 'register' && (
              <div className="text-xs text-gray-600 ml-4 space-y-1">
                <p>Password must:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Be at least 8 characters long</li>
                  <li>Contain at least one uppercase letter</li>
                  <li>Contain at least one lowercase letter</li>
                </ul>
              </div>
            )}

            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                mode === 'login' ? 'Login' : 'Create Account'
              )}
            </button>

            {/* Toggle Mode Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors underline"
              >
                {mode === 'login' ? 'Create an account' : 'Already have an account? Login'}
              </button>
            </div>

            {/* Guest Login Button */}
            <div className="text-center pt-4 border-t border-gray-300">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full h-12 bg-gray-400 hover:bg-gray-500 text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  'Continue as Guest'
                )}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                No account needed. Your data will be stored locally.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
