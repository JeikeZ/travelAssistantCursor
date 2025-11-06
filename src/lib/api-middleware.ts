/**
 * API Middleware and Response Utilities
 * 
 * Provides reusable middleware functions for:
 * - Authentication and authorization
 * - Error handling
 * - Standardized responses
 * - Cache headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from './supabase-server'
import { logger } from './logger'
import type { User, Trip } from '@/types'

// ============================================================================
// Types
// ============================================================================

export interface ApiError {
  message: string
  code?: string
  status: number
}

export interface ApiSuccessResponse<T = any> {
  success: boolean
  data?: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Get user from session cookie
 */
export async function getUserFromSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return null
    }
    
    const session = JSON.parse(sessionCookie.value)
    return session.user || null
  } catch (error) {
    logger.error('Error parsing session cookie', error as Error)
    return null
  }
}

/**
 * Authentication middleware - requires user to be logged in
 * @param handler Handler function that receives the authenticated user
 * @param options Configuration options
 */
export async function withAuth<T = any>(
  handler: (user: User, request: NextRequest) => Promise<NextResponse<T>>,
  options?: {
    allowGuest?: boolean
    requireVerified?: boolean
  }
): Promise<NextResponse<T> | NextResponse<ApiErrorResponse>> {
  try {
    const user = await getUserFromSession()
    
    // Check if user is authenticated
    if (!user) {
      logger.warn('Unauthorized access attempt - no user session')
      return createErrorResponse('Authentication required', 401, 'AUTH_REQUIRED')
    }
    
    // Check if guests are allowed
    if (!options?.allowGuest && user.is_guest) {
      logger.warn('Forbidden access attempt by guest user', { userId: user.id })
      return createErrorResponse('Guests cannot perform this action', 403, 'GUEST_FORBIDDEN')
    }
    
    // Check if user needs to be verified (future feature)
    if (options?.requireVerified && !user.verified) {
      logger.warn('Unverified user access attempt', { userId: user.id })
      return createErrorResponse('Email verification required', 403, 'VERIFICATION_REQUIRED')
    }
    
    // Execute handler with authenticated user
    const request = new NextRequest(new Request('http://localhost'))
    return await handler(user, request)
  } catch (error) {
    logger.error('Error in auth middleware', error as Error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

// ============================================================================
// Authorization Middleware
// ============================================================================

/**
 * Verify trip ownership
 */
export async function verifyTripOwnership(
  tripId: string,
  userId: string
): Promise<Trip | null> {
  try {
    const { data: trip, error } = await supabaseServer
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .single()
    
    if (error || !trip) {
      logger.warn('Trip not found or unauthorized', { tripId, userId })
      return null
    }
    
    return trip as Trip
  } catch (error) {
    logger.error('Error verifying trip ownership', error as Error, { tripId, userId })
    return null
  }
}

/**
 * Trip authorization middleware - requires user to own the trip
 * @param tripId Trip ID to verify ownership
 * @param handler Handler function that receives user and trip
 */
export async function withTripAuth<T = any>(
  request: NextRequest,
  tripId: string,
  handler: (user: User, trip: Trip, request: NextRequest) => Promise<NextResponse<T>>
): Promise<NextResponse<T> | NextResponse<ApiErrorResponse>> {
  return withAuth(async (user, req) => {
    try {
      const trip = await verifyTripOwnership(tripId, user.id)
      
      if (!trip) {
        return createErrorResponse('Trip not found', 404, 'TRIP_NOT_FOUND') as any
      }
      
      return await handler(user, trip, req)
    } catch (error) {
      logger.error('Error in trip auth middleware', error as Error, { tripId, userId: user.id })
      return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR') as any
    }
  }) as any
}

// ============================================================================
// Error Handling Middleware
// ============================================================================

/**
 * Error handling wrapper
 * Catches errors and returns standardized error responses
 */
export async function withErrorHandling<T = any>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T> | NextResponse<ApiErrorResponse>> {
  try {
    return await handler()
  } catch (error) {
    logger.error('Unhandled error in API route', error as Error)
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout')) {
        return createErrorResponse('Request timeout', 504, 'TIMEOUT')
      }
      
      if (error.message.includes('validation')) {
        return createErrorResponse(error.message, 400, 'VALIDATION_ERROR')
      }
      
      if (error.message.includes('not found')) {
        return createErrorResponse(error.message, 404, 'NOT_FOUND')
      }
    }
    
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create authentication response with session cookie
 */
export function createAuthResponse(
  user: User,
  sessionData?: Record<string, any>
): NextResponse {
  const response = NextResponse.json({
    success: true,
    user
  } as ApiSuccessResponse)
  
  // Set session cookie
  const session = sessionData || { user }
  response.cookies.set('session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
  
  return response
}

/**
 * Create error response with standardized format
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error
  }
  
  if (code) {
    response.code = code
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Create success response with optional caching
 */
export function createSuccessResponse<T = any>(
  data: T,
  options?: {
    message?: string
    cacheMaxAge?: number
    privateCache?: boolean
  }
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    message: options?.message
  } as ApiSuccessResponse<T>)
  
  // Set cache headers if specified
  if (options?.cacheMaxAge !== undefined) {
    const cacheType = options.privateCache ? 'private' : 'public'
    response.headers.set(
      'Cache-Control',
      `${cacheType}, max-age=${options.cacheMaxAge}, must-revalidate`
    )
  } else {
    // Default: no cache for dynamic content
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    )
    response.headers.set('Vary', 'Cookie')
  }
  
  return response
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T = any>(
  data: T[],
  pagination: {
    total: number
    limit: number
    offset: number
  }
): NextResponse {
  return createSuccessResponse({
    items: data,
    pagination: {
      ...pagination,
      hasMore: pagination.offset + pagination.limit < pagination.total
    }
  } as any)
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing?: string[] } {
  const missing = requiredFields.filter(field => {
    const value = body[field]
    return value === undefined || value === null || value === ''
  })
  
  if (missing.length > 0) {
    return { valid: false, missing }
  }
  
  return { valid: true }
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// ============================================================================
// Rate Limiting (Simple Implementation)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiting
 * @param identifier Unique identifier (e.g., user ID, IP address)
 * @param limit Maximum requests allowed
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || record.resetTime < now) {
    // Create new record or reset expired one
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimit: { allowed: boolean; remaining: number; resetTime: number }
): void {
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())
}
