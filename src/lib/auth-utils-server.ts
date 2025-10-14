/**
 * Server-side authentication utilities
 * 
 * IMPORTANT: This file contains bcrypt and should ONLY be imported in server-side code
 * (API routes, server components, server actions)
 * 
 * DO NOT import this file in client components - use auth-utils.ts instead
 */

import bcrypt from 'bcrypt'

/**
 * Hash password using bcrypt (recommended for all new passwords)
 * Uses 12 salt rounds for strong security
 */
export async function hashPasswordBcrypt(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Hash password using base64 (legacy method - kept for backward compatibility)
 * Only used for verifying existing base64 passwords
 */
export async function hashPasswordBase64(password: string): Promise<string> {
  return Buffer.from(password).toString('base64')
}

/**
 * Hash password using the default method (bcrypt)
 * This is the function to use for all new password hashing
 */
export async function hashPassword(password: string): Promise<string> {
  return hashPasswordBcrypt(password)
}

/**
 * Verify password against hash
 * Supports both bcrypt and base64 hash types for backward compatibility
 */
export async function verifyPassword(
  password: string,
  hash: string,
  hashType: 'base64' | 'bcrypt' = 'bcrypt'
): Promise<boolean> {
  if (hashType === 'bcrypt') {
    return bcrypt.compare(password, hash)
  } else {
    // Legacy base64 verification
    const passwordHash = await hashPasswordBase64(password)
    return passwordHash === hash
  }
}
