import { NextResponse } from 'next/server'
import { AuthResponse } from '@/types'

// Force dynamic rendering - no caching for auth endpoints
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  try {
    const response = NextResponse.json<AuthResponse>(
      { success: true },
      { status: 200 }
    )

    // Clear session cookie
    response.cookies.delete('session')

    // Ensure no caching of auth responses
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'An unexpected error occurred during logout.' },
      { status: 500 }
    )
  }
}
