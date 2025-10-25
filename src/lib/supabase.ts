import { createClient } from '@supabase/supabase-js'

// Supabase client configuration
// Get environment variables from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create a supabase client for use in client-side code (uses anon key)
// This client respects RLS policies
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Create a supabase admin client for use in server-side API routes (uses service role key)
// This client bypasses RLS policies - use ONLY in API routes after verifying authentication
// NEVER expose this client to the frontend
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : supabase // Fallback to regular client if service role key not provided

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
