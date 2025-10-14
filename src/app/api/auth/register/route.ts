import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validatePassword, validateUsername } from '@/lib/auth-utils'
import { hashPassword } from '@/lib/auth-utils-server'
import { AuthResponse } from '@/types'

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
    const { data: existingUser } = await supabase
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
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username,
          password: hashedPassword,
          password_hash_type: 'bcrypt',
        },
      ])
      .select('id, username, created_at')
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json<AuthResponse>(
      { success: true, user: newUser },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
