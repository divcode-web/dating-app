import { supabase } from './supabase';
import { UserProfile, UserSettings, Like, Match, Message } from './types';

// Profile Management
export async function updateUserProfile(userId: string, profile: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(profile)
    .eq('id', userId);

  if (error) throw error;
  return data;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // If no profile exists, return null instead of throwing
  if (error && error.code === 'PGRST116') {
    return null;
  }

  if (error) throw error;
  return data;
}

// Match System
export async function createLike(fromUserId: string, toUserId: string, isSuperLike: boolean = false) {
  const { data, error } = await supabase
    .from('likes')
    .insert([{
      from_user_id: fromUserId,
      to_user_id: toUserId,
      is_super_like: isSuperLike
    }]);

  if (error) throw error;

  // Check if this creates a match
  const { data: matchData } = await supabase
    .from('likes')
    .select('*')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', fromUserId)
    .single();

  if (matchData) {
    // Create a match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert([{
        user_id_1: fromUserId,
        user_id_2: toUserId
      }]);

    if (matchError) throw matchError;
    return { match: true, matchData: match };
  }

  return { match: false };
}

// Messaging System
export async function sendMessage(matchId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      match_id: matchId,
      sender_id: senderId,
      content
    }]);

  if (error) throw error;
  return data;
}

export async function getMessages(matchId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('sent_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Settings Management
export async function updateUserSettings(userId: string, settings: Partial<UserSettings>) {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert([{ user_id: userId, ...settings }]);

  if (error) throw error;
  return data;
}

export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data;
}

// Premium Features
export async function updatePremiumStatus(userId: string, isPremium: boolean, premiumUntil: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      is_premium: isPremium,
      premium_until: premiumUntil
    })
    .eq('id', userId);

  if (error) throw error;
  return data;
}

// Discovery
export async function getDiscoveryProfiles(userId: string, settings: UserSettings) {
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('location')
    .eq('id', userId)
    .single();

  if (!userProfile?.location) return [];

  // Complex query to get profiles based on user preferences
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .not('id', 'eq', userId)
    .containedBy('gender', settings.show_me_gender)
    .filter('date_of_birth', 'gte', new Date(Date.now() - settings.age_max * 365 * 24 * 60 * 60 * 1000).toISOString())
    .filter('date_of_birth', 'lte', new Date(Date.now() - settings.age_min * 365 * 24 * 60 * 60 * 1000).toISOString())
    .limit(50);

  if (error) throw error;
  return data;
}

// Photo Upload
export async function uploadPhoto(file: File) {
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be JPEG, PNG, or WebP format');
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName; // Just the filename, bucket is already specified in .from()

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);

      // If bucket doesn't exist, provide helpful error message
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('Storage bucket "profile-photos" not found. Please create it in your Supabase dashboard.');
      }

      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Failed to generate public URL for uploaded photo');
    }

    return publicUrl;
  } catch (error) {
    console.error('Photo upload error:', error);
    throw error;
  }
}

// Location
export async function updateLocation(userId: string, latitude: number, longitude: number) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      location: `POINT(${longitude} ${latitude})`
    })
    .eq('id', userId);

  if (error) throw error;
  return data;
}