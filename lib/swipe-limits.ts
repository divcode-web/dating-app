import { supabase } from './supabase';

const FREE_USER_SWIPE_LIMIT = 10;
const RESET_HOURS = 24;

export interface SwipeLimitInfo {
  remainingSwipes: number;
  resetAt: Date | null;
  canSwipe: boolean;
  isPremium: boolean;
}

export async function getSwipeLimitInfo(userId: string): Promise<SwipeLimitInfo> {
  try {
    // Check if user is premium
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_premium, premium_until')
      .eq('id', userId)
      .single();

    const isPremium = profile?.is_premium &&
      (!profile.premium_until || new Date(profile.premium_until) > new Date());

    // Premium users have unlimited swipes
    if (isPremium) {
      return {
        remainingSwipes: -1, // -1 means unlimited
        resetAt: null,
        canSwipe: true,
        isPremium: true,
      };
    }

    // Get or create swipe limit record
    const { data: swipeLimit } = await supabase
      .from('swipe_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    const now = new Date();

    // If no record exists, create one
    if (!swipeLimit) {
      const resetAt = new Date(now.getTime() + RESET_HOURS * 60 * 60 * 1000);

      await supabase.from('swipe_limits').insert({
        user_id: userId,
        swipes_used: 0,
        reset_at: resetAt.toISOString(),
      });

      return {
        remainingSwipes: FREE_USER_SWIPE_LIMIT,
        resetAt,
        canSwipe: true,
        isPremium: false,
      };
    }

    const resetAt = new Date(swipeLimit.reset_at);

    // Check if timer has expired - reset if so
    if (now >= resetAt) {
      const newResetAt = new Date(now.getTime() + RESET_HOURS * 60 * 60 * 1000);

      await supabase
        .from('swipe_limits')
        .update({
          swipes_used: 0,
          reset_at: newResetAt.toISOString(),
        })
        .eq('user_id', userId);

      return {
        remainingSwipes: FREE_USER_SWIPE_LIMIT,
        resetAt: newResetAt,
        canSwipe: true,
        isPremium: false,
      };
    }

    // Calculate remaining swipes
    const remainingSwipes = Math.max(0, FREE_USER_SWIPE_LIMIT - swipeLimit.swipes_used);

    return {
      remainingSwipes,
      resetAt,
      canSwipe: remainingSwipes > 0,
      isPremium: false,
    };
  } catch (error) {
    console.error('Error getting swipe limit info:', error);
    throw error;
  }
}

export async function incrementSwipeCount(userId: string): Promise<SwipeLimitInfo> {
  try {
    // Increment swipes_used
    const { error } = await supabase.rpc('increment_swipe_count', {
      user_id_param: userId,
    });

    if (error) {
      // Fallback if function doesn't exist - manual increment
      const { data: current } = await supabase
        .from('swipe_limits')
        .select('swipes_used')
        .eq('user_id', userId)
        .single();

      if (current) {
        await supabase
          .from('swipe_limits')
          .update({ swipes_used: current.swipes_used + 1 })
          .eq('user_id', userId);
      }
    }

    return await getSwipeLimitInfo(userId);
  } catch (error) {
    console.error('Error incrementing swipe count:', error);
    throw error;
  }
}

export function formatTimeRemaining(resetAt: Date): string {
  const now = new Date();
  const diff = resetAt.getTime() - now.getTime();

  if (diff <= 0) return 'Now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
