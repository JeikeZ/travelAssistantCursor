import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyPassword, hashPasswordBcrypt } from '@/lib/auth-utils-server'
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

    // Get user from database including password_hash_type and is_guest
    const { data: user, error: queryError } = await supabaseServer
      .from('users')
      .select('id, username, password, password_hash_type, is_guest, created_at')
      .eq('username', username)
      .single()

    if (queryError || !user) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'The username or password entered is incorrect.' },
        { status: 401 }
      )
    }

    // Type cast due to Supabase type inference issue
    type UserWithPassword = {
      id: string
      username: string
      password: string | null
      password_hash_type: 'base64' | 'bcrypt' | null
      is_guest: boolean
      created_at: string
    }
    const typedUser = user as unknown as UserWithPassword

    // Prevent guest users from logging in
    if (typedUser.is_guest || !typedUser.password) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Guest accounts cannot login. Please create a new account or continue as a guest.' },
        { status: 400 }
      )
    }

    // Verify password with the appropriate hash type
    // Default to 'base64' for existing users who don't have the field set yet
    const hashType = typedUser.password_hash_type || 'base64'
    const isPasswordValid = await verifyPassword(password, typedUser.password, hashType)
    
    if (!isPasswordValid) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'The username or password entered is incorrect.' },
        { status: 401 }
      )
    }

    // Opportunistic upgrade: If user authenticated successfully with base64,
    // upgrade their password to bcrypt
    if (hashType === 'base64') {
      try {
        const newBcryptHash = await hashPasswordBcrypt(password)
        await supabaseServer
          .from('users')
          .update({
            password: newBcryptHash,
            password_hash_type: 'bcrypt',
          } as never)
          .eq('id', typedUser.id)
        
        console.log(`Successfully upgraded password hash for user: ${typedUser.username}`)
      } catch (upgradeError) {
        // Log error but don't fail the login
        console.error('Failed to upgrade password hash:', upgradeError)
      }
    }

    // Remove password and password_hash_type from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, password_hash_type: __, ...userWithoutPassword } = typedUser

    // Create session cookie
    const session = {
      user: userWithoutPassword
    }

    const response = NextResponse.json<AuthResponse>(
      { success: true, user: userWithoutPassword },
      { status: 200 }
    )

    // Set session cookie
    response.cookies.set('session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
