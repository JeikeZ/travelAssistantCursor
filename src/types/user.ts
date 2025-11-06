/**
 * User and Authentication Types
 */

export interface User {
  id: string
  username: string
  created_at: string
  is_guest?: boolean
  verified?: boolean  // Future feature
}

export interface UserCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

export interface PasswordValidation {
  isValid: boolean
  errors: string[]
}
