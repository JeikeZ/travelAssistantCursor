import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

/**
 * Server-side Supabase client using service role key
 * 
 * This client bypasses Row Level Security (RLS) and should ONLY be used
 * in server-side code (API routes, server components, server actions).
 * 
 * SECURITY: Never expose this client or its key to the client-side.
 * Application-level security checks must be performed before database operations.
 */

// Lazy-initialized Supabase client to avoid build-time failures
let _supabaseServer: SupabaseClient<Database> | null = null

/**
 * Get the server-side Supabase client (lazy initialization)
 * This prevents build-time failures when environment variables are not set
 */
export function getSupabaseServer(): SupabaseClient<Database> {
  if (_supabaseServer) {
    return _supabaseServer
  }

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  // Validate environment variables at runtime
  if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
    console.error('This key is required for server-side database operations.')
    console.error('Please add it to your Vercel environment variables.')
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  // Create server-side Supabase client with service role key
  // This client bypasses RLS, so application-level security is critical
  _supabaseServer = createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return _supabaseServer
}

// For backward compatibility, export a getter
export const supabaseServer = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return getSupabaseServer()[prop as keyof SupabaseClient<Database>]
  }
})

// Type export for convenience
export type { Database }
