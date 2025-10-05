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
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          date_of_birth: string | null
          gender: string | null
          interested_in: string[] | null
          location: {
            lat: number
            lng: number
          } | null
          photos: string[] | null
          interests: string[] | null
          occupation: string | null
          education: string | null
          height: number | null
          is_premium: boolean
          premium_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          date_of_birth?: string | null
          gender?: string | null
          interested_in?: string[] | null
          location?: {
            lat: number
            lng: number
          } | null
          photos?: string[] | null
          interests?: string[] | null
          occupation?: string | null
          education?: string | null
          height?: number | null
          is_premium?: boolean
          premium_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          date_of_birth?: string | null
          gender?: string | null
          interested_in?: string[] | null
          location?: {
            lat: number
            lng: number
          } | null
          photos?: string[] | null
          interests?: string[] | null
          occupation?: string | null
          education?: string | null
          height?: number | null
          is_premium?: boolean
          premium_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          status: 'pending' | 'matched' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          status?: 'pending' | 'matched' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          status?: 'pending' | 'matched' | 'blocked'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'system'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'image' | 'system'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'system'
          is_read?: boolean
          created_at?: string
        }
      }
      swipes: {
        Row: {
          id: string
          swiper_id: string
          swiped_id: string
          direction: 'left' | 'right'
          created_at: string
        }
        Insert: {
          id?: string
          swiper_id: string
          swiped_id: string
          direction: 'left' | 'right'
          created_at?: string
        }
        Update: {
          id?: string
          swiper_id?: string
          swiped_id?: string
          direction?: 'left' | 'right'
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          status: 'active' | 'canceled' | 'past_due' | 'incomplete'
          plan_type: 'monthly' | 'yearly'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete'
          plan_type?: 'monthly' | 'yearly'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete'
          plan_type?: 'monthly' | 'yearly'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          reason: string
          description: string | null
          status: 'pending' | 'investigated' | 'resolved' | 'dismissed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id: string
          reason: string
          description?: string | null
          status?: 'pending' | 'investigated' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_id?: string
          reason?: string
          description?: string | null
          status?: 'pending' | 'investigated' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'match' | 'message' | 'like' | 'super_like' | 'system'
          title: string
          message: string
          data: Record<string, any> | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'match' | 'message' | 'like' | 'super_like' | 'system'
          title: string
          message: string
          data?: Record<string, any> | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'match' | 'message' | 'like' | 'super_like' | 'system'
          title?: string
          message?: string
          data?: Record<string, any> | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}