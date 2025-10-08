import { supabase } from './supabase';
import { UserProfile, UserSettings, Like, Match, Message } from './types';

// Profile update event system for cross-page synchronization
const profileUpdateListeners = new Set<(userId: string) => void>();

export function addProfileUpdateListener(listener: (userId: string) => void) {
  profileUpdateListeners.add(listener);
  return () => profileUpdateListeners.delete(listener);
}

export function notifyProfileUpdate(userId: string) {
  profileUpdateListeners.forEach(listener => listener(userId));

  // Also store in localStorage for cross-tab synchronization
  if (typeof window !== 'undefined') {
    localStorage.setItem(`profile_updated_${userId}`, Date.now().toString());
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { userId } }));
  }
}

// Profile Management
export async function updateUserProfile(userId: string, profile: Partial<UserProfile>) {
   const { data, error } = await supabase
     .from('user_profiles')
     .upsert({ id: userId, ...profile }, { onConflict: 'id' })
     .select()
     .single();

   if (error) {
     throw error;
   }

   // Notify other pages/components about the update
   notifyProfileUpdate(userId);

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

   if (error) {
     throw error;
   }

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
  // Get user's location
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('location_city')
    .eq('id', userId)
    .single();

  const userLocation = userProfile?.location_city;

  // Get already liked/passed users to exclude them
  const { data: alreadyLiked } = await supabase
    .from('likes')
    .select('to_user_id')
    .eq('from_user_id', userId);

  const excludedIds = alreadyLiked?.map(like => like.to_user_id) || [];

  // Build base query
  let baseQuery = supabase
    .from('user_profiles')
    .select('*')
    .neq('id', userId);

  // Exclude already liked profiles
  if (excludedIds.length > 0) {
    baseQuery = baseQuery.not('id', 'in', `(${excludedIds.join(',')})`);
  }

  // Filter by gender if specified
  if (settings.show_me_gender && settings.show_me_gender.length > 0) {
    baseQuery = baseQuery.in('gender', settings.show_me_gender);
  }

  // Filter by age range - use safe date calculations
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  const maxBirthYear = currentYear - (settings.age_max || 100);
  const minBirthYear = currentYear - (settings.age_min || 18);

  const maxDate = new Date(maxBirthYear, currentMonth, currentDay);
  const minDate = new Date(minBirthYear, currentMonth, currentDay);

  baseQuery = baseQuery
    .gte('date_of_birth', maxDate.toISOString())
    .lte('date_of_birth', minDate.toISOString());

  // Get 80% from same location
  let sameLocationProfiles: any[] = [];
  if (userLocation) {
    const sameLocationQuery = baseQuery.eq('location_city', userLocation).limit(40);
    const { data: sameLocData } = await sameLocationQuery;
    sameLocationProfiles = sameLocData || [];
  }

  // Get 20% from other locations
  let otherLocationProfiles: any[] = [];
  const remainingCount = 50 - sameLocationProfiles.length;
  if (remainingCount > 0) {
    let otherQuery = baseQuery;
    if (userLocation) {
      otherQuery = otherQuery.neq('location_city', userLocation);
    }
    // Exclude profiles already in same location list
    const sameLocIds = sameLocationProfiles.map(p => p.id);
    if (sameLocIds.length > 0) {
      otherQuery = otherQuery.not('id', 'in', `(${sameLocIds.join(',')})`);
    }
    otherQuery = otherQuery.limit(remainingCount);
    const { data: otherData } = await otherQuery;
    otherLocationProfiles = otherData || [];
  }

  // Combine profiles (80% same location, 20% others)
  const allProfiles = [...sameLocationProfiles, ...otherLocationProfiles];

  // Add distance info
  const profiles = allProfiles.map(profile => ({
    ...profile,
    distance: profile.location_city === userLocation ? 0 : 10
  }));

  // Phase 3: AI recommendations (PREMIUM FEATURE ONLY)
  // Check if user is premium before applying AI sorting
  const { data: premiumStatus } = await supabase
    .from('user_profiles')
    .select('is_premium')
    .eq('id', userId)
    .single();

  if (premiumStatus?.is_premium) {
    try {
      const recommendationsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/recommendations?userId=${userId}&limit=${profiles.length}`,
        { cache: 'no-store' }
      );

      if (recommendationsResponse.ok) {
        const { recommendations } = await recommendationsResponse.json();

        if (recommendations && recommendations.length > 0) {
          // Create a map of userId to AI score
          const scoreMap = new Map(
            recommendations.map((rec: any) => [rec.userId, rec.matchPercentage])
          );

          // Sort profiles by AI compatibility score (highest first)
          profiles.sort((a, b) => {
            const scoreA = Number(scoreMap.get(a.id) || 0);
            const scoreB = Number(scoreMap.get(b.id) || 0);
            return scoreB - scoreA; // Descending order
          });

        }
      }
    } catch (error) {
      console.error('AI recommendations failed, using random order:', error);
    }
  } else {
    // Free users get randomized profiles
    profiles.sort(() => Math.random() - 0.5);
  }
  return profiles;
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