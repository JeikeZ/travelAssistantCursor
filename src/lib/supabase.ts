import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialized Supabase client to avoid build-time failures
let _supabase: SupabaseClient | null = null

/**
 * Get the client-side Supabase client (lazy initialization)
 * This prevents build-time failures when environment variables are not set
 */
export function getSupabase(): SupabaseClient {
  if (_supabase) {
    return _supabase
  }

  // Get environment variables from .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // Validate environment variables at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env.local file.')
    throw new Error('Missing Supabase environment variables')
  }

  // Create a single supabase client for interacting with your database
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return _supabase
}

// For backward compatibility, export a Proxy that calls getSupabase()
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabase()[prop as keyof SupabaseClient]
  }
})

// Database types for type safety
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password: string | null
          password_hash_type: 'base64' | 'bcrypt' | null
          is_guest: boolean
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string | null
          password_hash_type?: 'base64' | 'bcrypt' | null
          is_guest?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string | null
          password_hash_type?: 'base64' | 'bcrypt' | null
          is_guest?: boolean
          created_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          destination_country: string
          destination_city: string
          destination_state: string | null
          destination_display_name: string | null
          duration: number
          trip_type: 'business' | 'leisure' | 'beach' | 'hiking' | 'city' | 'winter' | 'backpacking'
          status: 'active' | 'completed' | 'archived'
          completion_percentage: number
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
          notes: string | null
          is_favorite: boolean
        }
        Insert: {
          id?: string
          user_id: string
          destination_country: string
          destination_city: string
          destination_state?: string | null
          destination_display_name?: string | null
          duration: number
          trip_type: 'business' | 'leisure' | 'beach' | 'hiking' | 'city' | 'winter' | 'backpacking'
          status?: 'active' | 'completed' | 'archived'
          completion_percentage?: number
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          notes?: string | null
          is_favorite?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          destination_country?: string
          destination_city?: string
          destination_state?: string | null
          destination_display_name?: string | null
          duration?: number
          trip_type?: 'business' | 'leisure' | 'beach' | 'hiking' | 'city' | 'winter' | 'backpacking'
          status?: 'active' | 'completed' | 'archived'
          completion_percentage?: number
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          notes?: string | null
          is_favorite?: boolean
        }
      }
      packing_items: {
        Row: {
          id: string
          trip_id: string
          name: string
          category: 'clothing' | 'toiletries' | 'electronics' | 'travel_documents' | 'medication' | 'miscellaneous'
          essential: boolean
          packed: boolean
          custom: boolean
          quantity: number
          created_at: string
          updated_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          category: 'clothing' | 'toiletries' | 'electronics' | 'travel_documents' | 'medication' | 'miscellaneous'
          essential?: boolean
          packed?: boolean
          custom?: boolean
          quantity?: number
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          category?: 'clothing' | 'toiletries' | 'electronics' | 'travel_documents' | 'medication' | 'miscellaneous'
          essential?: boolean
          packed?: boolean
          custom?: boolean
          quantity?: number
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
      }
    }
  }
}
