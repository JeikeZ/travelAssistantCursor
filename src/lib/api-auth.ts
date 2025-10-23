/**
 * API Authentication and Authorization utilities
 * Helper functions for protecting API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './supabase'
import { User } from '@/types'

/**
 * Get authenticated user from request
 * Checks for user_id in cookies or headers
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  // Try to get user_id from cookie
  const userId = request.cookies.get('user_id')?.value
  
  if (!userId) {
    return null
  }

  // Fetch user from database
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, created_at, is_guest')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Verify user is authenticated (not guest)
 * Returns error response if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<User | NextResponse> {
  const user = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required. Please log in.' },
      { status: 401 }
    )
  }

  if (user.is_guest) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'This feature requires a registered account. Guest users cannot save trips.' 
      },
      { status: 403 }
    )
  }

  return user
}

/**
 * Verify user owns a specific trip
 */
export async function verifyTripOwnership(tripId: string, userId: string): Promise<boolean> {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single()

  if (error || !trip) {
    return false
  }

  return trip.user_id === userId
}

/**
 * Create error response
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, ...data },
    { status }
  )
}
