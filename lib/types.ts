export type UserProfile = {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  bio: string | null;
  location: any; // Geography point
  location_city: string | null;
  interests: string[];
  photos: string[];

  // Optional profile fields
  ethnicity?: string | null;
  height?: number | null; // in cm
  education?: string | null;
  occupation?: string | null;
  smoking?: string | null;
  drinking?: string | null;
  religion?: string | null;
  relationship_type?: string | null;
  looking_for?: string[] | null;
  languages?: string[] | null;
  children?: string | null;

  // Enhanced profile fields (Phase 1)
  has_pets?: boolean | null;
  pet_preference?: string | null;
  favorite_books?: Array<{ title: string; author: string; cover_url: string | null }> | null;
  spotify_id?: string | null;
  spotify_top_artists?: string[] | null;
  spotify_anthem?: { track_id: string; track_name: string; artist_name: string; album_image?: string; preview_url?: string } | null;
  spotify_access_token?: string | null;
  spotify_refresh_token?: string | null;
  spotify_token_expires_at?: string | null;

  // Status fields
  last_active: string;
  is_premium: boolean;
  premium_until: string | null;
  is_verified?: boolean;
  verification_status?: string;
  verification_video_url?: string | null;
  verification_submitted_at?: string | null;
  verified_at?: string | null;

  created_at: string;
  updated_at: string;

  // Computed fields for SwipeDeck compatibility
  name?: string;
  age?: number;
  distance?: number;
  isOnline?: boolean;
};

export type Match = {
  id: string;
  user_id_1: string;
  user_id_2: string;
  matched_at: string;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  read_at: string | null;
  created_at: string;
};

export type Like = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  is_super_like: boolean;
};

export type UserSettings = {
  user_id: string;
  max_distance: number;
  age_min: number;
  age_max: number;
  show_me_gender: string[];
  push_notifications: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
};

export type Story = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string | null;
  caption?: string | null;
  duration: number; // seconds
  is_active: boolean;
  created_at: string;
  expires_at: string;
  updated_at: string;

  // Populated from joins/queries
  user?: UserProfile;
  is_viewed?: boolean;
  view_count?: number;
  viewers?: StoryView[];
};

export type StoryView = {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: UserProfile;
};

export type StoryWithUser = Story & {
  full_name: string;
  profile_photo: string | null;
};