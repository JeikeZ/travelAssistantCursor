import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword } from '@/lib/auth-utils'
import { AuthResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Get user from database
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, username, password, created_at')
      .eq('username', username)
      .single()

    if (queryError || !user) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'The username or password entered is incorrect.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'The username or password entered is incorrect.' },
        { status: 401 }
      )
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json<AuthResponse>(
      { success: true, user: userWithoutPassword },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
