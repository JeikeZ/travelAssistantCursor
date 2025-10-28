// Utility functions for API routes

import { NextResponse } from 'next/server'
import { ApiError } from '@/types'

// Standard error responses
export function createErrorResponse(
  error: string,
  statusCode: number = 500,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    { error, code },
    { status: statusCode }
  )
}

// Standard success response with caching headers (for public APIs)
export function createSuccessResponse<T>(
  data: T,
  cacheMaxAge: number = 3600 // 1 hour default
): NextResponse<T> {
  const response = NextResponse.json(data)
  
  // Add optimized caching headers
  response.headers.set('Cache-Control', `public, max-age=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`)
  response.headers.set('CDN-Cache-Control', `public, max-age=${cacheMaxAge}`)
  response.headers.set('Vercel-CDN-Cache-Control', `public, max-age=${cacheMaxAge}`)
  
  // Note: Content-Encoding should only be set by the server/CDN when actually compressing
  // response.headers.set('Content-Encoding', 'gzip') // REMOVED - causes response parsing issues
  
  return response
}

// Success response for authenticated endpoints (no caching)
export function createAuthenticatedResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<T> {
  const response = NextResponse.json(data, { status: statusCode })
  
  // Prevent caching of authenticated responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Vary', 'Cookie')
  
  return response
}

// Validate required fields
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].toString().trim())) {
      missingFields.push(field.toString())
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}

// Rate limiting helper (simple in-memory implementation)
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (record.count >= this.maxRequests) {
      return false
    }

    record.count++
    return true
  }

  getRemainingRequests(identifier: string): number {
    const record = this.requests.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - record.count)
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter(100, 60000) // 100 requests per minute

// Request timeout helper
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ])
}

// Retry helper for external API calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// IP address helper
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddr || 'unknown'
}

// Request size limiter
export function validateRequestSize(
  request: Request,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): boolean {
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    return parseInt(contentLength) <= maxSizeBytes
  }
  return true
}

// CORS headers for API routes
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}