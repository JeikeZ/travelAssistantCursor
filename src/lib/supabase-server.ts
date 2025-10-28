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

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
}

if (!supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
  console.error('This key is required for server-side database operations.')
  console.error('Please add it to your Vercel environment variables.')
}

// Create server-side Supabase client with service role key
// This client bypasses RLS, so application-level security is critical
export const supabaseServer: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Type export for convenience
export type { Database }
