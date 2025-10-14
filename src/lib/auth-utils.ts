/**
 * Client-safe authentication utilities
 * 
 * These utilities can be safely imported in both client and server components.
 * For password hashing (server-only), use auth-utils-server.ts instead.
 */

import { PasswordValidation } from '@/types'

/**
 * Validates password requirements:
 * - At least 8 characters long
 * - At least one uppercase letter
 * - At least one lowercase letter
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validates username requirements:
 * - Not empty
 * - At least 3 characters long
 * - Only alphanumeric characters and underscores
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username is required' }
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' }
  }

  return { isValid: true }
}

