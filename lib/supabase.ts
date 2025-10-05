import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase credentials are properly configured
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
  console.warn('Supabase credentials not configured. Please set up your .env.local file with proper Supabase credentials.')
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'dating-app-auth',
      flowType: 'pkce'
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string
          date_of_birth: string
          gender: string
          bio: string | null
          photos: string[] | null
          ethnicity: string | null
          height: number | null
          education: string | null
          occupation: string | null
          smoking: string | null
          drinking: string | null
          religion: string | null
          relationship_type: string | null
          looking_for: string[] | null
          languages: string[] | null
          children: string | null
          location: unknown | null
          location_city: string | null
          interests: string[] | null
          last_active: string
          is_premium: boolean
          premium_until: string | null
          is_verified: boolean
          verification_status: string
          verification_video_url: string | null
          verification_submitted_at: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          date_of_birth: string
          gender: string
          bio?: string | null
          photos?: string[] | null
          ethnicity?: string | null
          height?: number | null
          education?: string | null
          occupation?: string | null
          smoking?: string | null
          drinking?: string | null
          religion?: string | null
          relationship_type?: string | null
          looking_for?: string[] | null
          languages?: string[] | null
          children?: string | null
          location?: unknown | null
          location_city?: string | null
          interests?: string[] | null
          last_active?: string
          is_premium?: boolean
          premium_until?: string | null
          is_verified?: boolean
          verification_status?: string
          verification_video_url?: string | null
          verification_submitted_at?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          date_of_birth?: string
          gender?: string
          bio?: string | null
          photos?: string[] | null
          ethnicity?: string | null
          height?: number | null
          education?: string | null
          occupation?: string | null
          smoking?: string | null
          drinking?: string | null
          religion?: string | null
          relationship_type?: string | null
          looking_for?: string[] | null
          languages?: string[] | null
          children?: string | null
          location?: unknown | null
          location_city?: string | null
          interests?: string[] | null
          last_active?: string
          is_premium?: boolean
          premium_until?: string | null
          is_verified?: boolean
          verification_status?: string
          verification_video_url?: string | null
          verification_submitted_at?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          push_notifications: boolean
          profile_visibility: boolean
          distance_range: number
          age_range: number[]
          dark_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          push_notifications?: boolean
          profile_visibility?: boolean
          distance_range?: number
          age_range?: number[]
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          push_notifications?: boolean
          profile_visibility?: boolean
          distance_range?: number
          age_range?: number[]
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          created_at: string
          is_super_like: boolean
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          created_at?: string
          is_super_like?: boolean
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          created_at?: string
          is_super_like?: boolean
        }
      }
      matches: {
        Row: {
          id: string
          user_id_1: string
          user_id_2: string
          created_at: string
          matched_at: string
        }
        Insert: {
          id?: string
          user_id_1: string
          user_id_2: string
          created_at?: string
          matched_at?: string
        }
        Update: {
          id?: string
          user_id_1?: string
          user_id_2?: string
          created_at?: string
          matched_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          content: string
          image_url: string | null
          sent_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          content: string
          image_url?: string | null
          sent_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          content?: string
          image_url?: string | null
          sent_at?: string
          read_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'basic' | 'premium' | 'platinum'
          status: 'active' | 'cancelled' | 'expired'
          started_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: 'free' | 'basic' | 'premium' | 'platinum'
          status?: 'active' | 'cancelled' | 'expired'
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: 'free' | 'basic' | 'premium' | 'platinum'
          status?: 'active' | 'cancelled' | 'expired'
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      message_limits: {
        Row: {
          id: string
          user_id: string
          date: string
          message_count: number
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          message_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          message_count?: number
        }
      }
      admin_users: {
        Row: {
          id: string
          role: string
          permissions: string[] | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id: string
          role?: string
          permissions?: string[] | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          role?: string
          permissions?: string[] | null
          created_at?: string
          created_by?: string | null
        }
      }
      blocked_users: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          blocked_by_admin: boolean
          reason: string | null
          admin_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          blocked_by_admin?: boolean
          reason?: string | null
          admin_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          blocked_by_admin?: boolean
          reason?: string | null
          admin_id?: string | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          reported_message_id: string | null
          report_type: 'user' | 'message' | 'inappropriate_content' | 'harassment' | 'spam' | 'other'
          reason: string
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id: string
          reported_message_id?: string | null
          report_type: 'user' | 'message' | 'inappropriate_content' | 'harassment' | 'spam' | 'other'
          reason: string
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string
          reported_message_id?: string | null
          report_type?: 'user' | 'message' | 'inappropriate_content' | 'harassment' | 'spam' | 'other'
          reason?: string
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}