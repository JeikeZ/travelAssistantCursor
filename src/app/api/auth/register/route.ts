import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { validatePassword, validateUsername } from '@/lib/auth-utils'
import { hashPassword } from '@/lib/auth-utils-server'
import { AuthResponse } from '@/types'

// Force dynamic rendering - no caching for auth endpoints
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validate username
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.isValid) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: usernameValidation.error },
        { status: 400 }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: passwordValidation.errors.join('. ') },
        { status: 400 }
      )
    }

    // Check if username already exists
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Username already exists. Please choose a different username.' },
        { status: 409 }
      )
    }

    // Hash password using bcrypt for all new users
    const hashedPassword = await hashPassword(password)

    // Create new user with bcrypt hash
    const { data: newUser, error: insertError } = await supabaseServer
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        password_hash_type: 'bcrypt',
      } as never)
      .select('id, username, created_at')
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    // Create session cookie
    const session = {
      user: newUser
    }

    const response = NextResponse.json<AuthResponse>(
      { success: true, user: newUser },
      { status: 201 }
    )

    // Set session cookie
    response.cookies.set('session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    // Ensure no caching of auth responses
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
