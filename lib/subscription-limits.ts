import { supabase } from './supabase';

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  interval_count: number;
  daily_swipe_limit: number | null;
  daily_message_limit: number | null;
  daily_super_likes: number;
  monthly_boosts: number;
  can_see_who_likes: boolean;
  can_use_ai_matching: boolean;
  can_rewind_swipes: boolean;
  has_global_dating: boolean;
  has_priority_matches: boolean;
  has_read_receipts: boolean;
  has_advanced_filters: boolean;
  has_profile_boost: boolean;
  no_ads: boolean;
  has_priority_support: boolean;
  can_see_online_status: boolean;
  has_unlimited_rewinds: boolean;
  is_popular: boolean;
}

export interface UserLimits {
  swipes: {
    limit: number | null; // null = unlimited
    used: number;
    remaining: number;
    resetAt: Date;
    canSwipe: boolean;
  };
  messages: {
    limit: number | null; // null = unlimited
    sent: number;
    remaining: number;
    resetAt: Date;
    canMessage: boolean;
  };
  superLikes: {
    daily: number;
    used: number;
    remaining: number;
  };
  boosts: {
    monthly: number;
    used: number;
    remaining: number;
  };
  tier: SubscriptionTier;
}

/**
 * Get user's subscription tier and all limits
 */
export async function getUserLimits(userId: string): Promise<UserLimits> {
  try {
    // Get user's tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier_id, subscription_tiers(*)')
      .eq('id', userId)
      .single();

    const tier = profile?.subscription_tiers || await getFreeTier();

    // Get swipe limits
    const swipeLimits = await getSwipeLimits(userId, tier);

    // Get message limits
    const messageLimits = await getMessageLimits(userId, tier);

    // Get super likes and boosts usage (you can track this in separate tables)
    const superLikes = {
      daily: tier.daily_super_likes,
      used: 0, // TODO: Track in super_likes_usage table
      remaining: tier.daily_super_likes,
    };

    const boosts = {
      monthly: tier.monthly_boosts,
      used: 0, // TODO: Track in boosts_usage table
      remaining: tier.monthly_boosts,
    };

    return {
      swipes: swipeLimits,
      messages: messageLimits,
      superLikes,
      boosts,
      tier,
    };
  } catch (error) {
    console.error('Error getting user limits:', error);
    throw error;
  }
}

/**
 * Get swipe limits for user
 */
async function getSwipeLimits(userId: string, tier: SubscriptionTier) {
  const { data: swipeData } = await supabase
    .from('swipe_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  const now = new Date();

  // If no record or reset time passed, create/reset
  if (!swipeData || new Date(swipeData.reset_at) <= now) {
    const resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (!swipeData) {
      await supabase.from('swipe_limits').insert({
        user_id: userId,
        swipes_used: 0,
        reset_at: resetAt.toISOString(),
      });
    } else {
      await supabase
        .from('swipe_limits')
        .update({ swipes_used: 0, reset_at: resetAt.toISOString() })
        .eq('user_id', userId);
    }

    return {
      limit: tier.daily_swipe_limit,
      used: 0,
      remaining: tier.daily_swipe_limit || 999999,
      resetAt,
      canSwipe: true,
    };
  }

  const used = swipeData.swipes_used || 0;
  const limit = tier.daily_swipe_limit;
  const remaining = limit ? Math.max(0, limit - used) : 999999;

  return {
    limit,
    used,
    remaining,
    resetAt: new Date(swipeData.reset_at),
    canSwipe: limit === null || remaining > 0,
  };
}

/**
 * Get message limits for user
 */
async function getMessageLimits(userId: string, tier: SubscriptionTier) {
  const { data: messageData } = await supabase
    .from('message_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  const now = new Date();

  // If no record or reset time passed, create/reset
  if (!messageData || new Date(messageData.reset_at) <= now) {
    const resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (!messageData) {
      await supabase.from('message_limits').insert({
        user_id: userId,
        messages_sent: 0,
        reset_at: resetAt.toISOString(),
      });
    } else {
      await supabase
        .from('message_limits')
        .update({ messages_sent: 0, reset_at: resetAt.toISOString() })
        .eq('user_id', userId);
    }

    return {
      limit: tier.daily_message_limit,
      sent: 0,
      remaining: tier.daily_message_limit || 999999,
      resetAt,
      canMessage: true,
    };
  }

  const sent = messageData.messages_sent || 0;
  const limit = tier.daily_message_limit;
  const remaining = limit ? Math.max(0, limit - sent) : 999999;

  return {
    limit,
    sent,
    remaining,
    resetAt: new Date(messageData.reset_at),
    canMessage: limit === null || remaining > 0,
  };
}

/**
 * Increment swipe count
 */
export async function incrementSwipeCount(userId: string): Promise<void> {
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

/**
 * Increment message count
 */
export async function incrementMessageCount(userId: string): Promise<void> {
  const { data: current } = await supabase
    .from('message_limits')
    .select('messages_sent')
    .eq('user_id', userId)
    .single();

  if (current) {
    await supabase
      .from('message_limits')
      .update({ messages_sent: current.messages_sent + 1 })
      .eq('user_id', userId);
  } else {
    // Create if doesn't exist
    await supabase.from('message_limits').insert({
      user_id: userId,
      messages_sent: 1,
    });
  }
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: string
): Promise<boolean> {
  try {
    const { data } = await supabase.rpc('has_feature_access', {
      p_user_id: userId,
      p_feature: feature,
    });
    return data || false;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Get all subscription tiers
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching tiers:', error);
    return [];
  }

  return data || [];
}

/**
 * Get free tier
 */
async function getFreeTier(): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('id', 'free')
    .single();

  return data!;
}

/**
 * Format time remaining
 */
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

/**
 * Update user's subscription tier
 */
export async function updateUserTier(
  userId: string,
  tierId: string
): Promise<void> {
  await supabase
    .from('user_profiles')
    .update({ subscription_tier_id: tierId })
    .eq('id', userId);
}
