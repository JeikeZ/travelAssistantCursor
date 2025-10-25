import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AuthResponse } from '@/types'

export async function POST() {
  try {
    // Get the next guest number from the database
    const { data: counterData, error: counterError } = await supabase
      .rpc('get_next_guest_number')

    if (counterError) {
      console.error('Error getting next guest number:', counterError)
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Failed to create guest account. Please try again.' },
        { status: 500 }
      )
    }

    const guestNumber = counterData as number
    const guestUsername = `guest_user${guestNumber}`

    // Create the guest user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username: guestUsername,
          password: null,
          password_hash_type: null,
          is_guest: true,
        },
      ])
      .select('id, username, created_at, is_guest')
      .single()

    if (insertError) {
      console.error('Error creating guest user:', insertError)
      
      // If username already exists (race condition), try again recursively
      if (insertError.code === '23505') { // Unique constraint violation
        console.log('Guest username collision detected, retrying...')
        // Retry the request
        return POST()
      }
      
      return NextResponse.json<AuthResponse>(
        { success: false, error: 'Failed to create guest account. Please try again.' },
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

    return response
  } catch (error) {
    console.error('Guest account creation error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
