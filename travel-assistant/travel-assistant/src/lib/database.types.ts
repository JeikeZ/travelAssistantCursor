export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          destination_country: string
          destination_city: string
          duration_days: number
          trip_type: string
          created_at: string
          updated_at: string
          packing_list: Json
          completed: boolean
        }
        Insert: {
          id?: string
          user_id: string
          destination_country: string
          destination_city: string
          duration_days: number
          trip_type: string
          created_at?: string
          updated_at?: string
          packing_list?: Json
          completed?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          destination_country?: string
          destination_city?: string
          duration_days?: number
          trip_type?: string
          created_at?: string
          updated_at?: string
          packing_list?: Json
          completed?: boolean
        }
      }
      feedback: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          missing_items: string | null
          would_recommend: boolean
          confidence_score: number
          additional_feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          missing_items?: string | null
          would_recommend: boolean
          confidence_score: number
          additional_feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          missing_items?: string | null
          would_recommend?: boolean
          confidence_score?: number
          additional_feedback?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type PackingItem = {
  id: string
  name: string
  category: string
  essential: boolean
  packed: boolean
  custom: boolean
}