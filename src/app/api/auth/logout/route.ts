import { NextResponse } from 'next/server'
import { AuthResponse } from '@/types'

export async function POST() {
  try {
    const response = NextResponse.json<AuthResponse>(
      { success: true },
      { status: 200 }
    )

    // Clear session cookie
    response.cookies.delete('session')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'An unexpected error occurred during logout.' },
      { status: 500 }
    )
  }
}
