import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

    // Get user from database including password_hash_type
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, username, password, password_hash_type, created_at')
      .eq('username', username)
      .single()

    if (queryError || !user) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'The username or password entered is incorrect.' },
        { status: 401 }
      )
    }

    // Verify password with the appropriate hash type
    // Default to 'base64' for existing users who don't have the field set yet
    const hashType = user.password_hash_type || 'base64'
    const isPasswordValid = await verifyPassword(password, user.password, hashType)
    
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
        await supabase
          .from('users')
          .update({
            password: newBcryptHash,
            password_hash_type: 'bcrypt',
          })
          .eq('id', user.id)
        
        console.log(`Successfully upgraded password hash for user: ${user.username}`)
      } catch (upgradeError) {
        // Log error but don't fail the login
        console.error('Failed to upgrade password hash:', upgradeError)
      }
    }

    // Remove password and password_hash_type from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, password_hash_type: __, ...userWithoutPassword } = user

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
