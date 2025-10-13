import { supabase } from './supabase';
import { getUserLimits } from './subscription-limits';

const RESET_HOURS = 24;

export interface SwipeLimitInfo {
   remainingSwipes: number;
   resetAt: Date | null;
   canSwipe: boolean;
   isPremium: boolean;
   isBasic: boolean;
   isStandard: boolean;
   tierName: string;
   dailyLimit: number;
 }

export async function getSwipeLimitInfo(userId: string): Promise<SwipeLimitInfo> {
  try {
    // Get user's subscription limits from the subscription system
    const limits = await getUserLimits(userId);
    const dailyLimit = limits.swipes.limit ?? 10; // Default to 10 if null
    const isUnlimited = dailyLimit === -1;

    // If unlimited swipes
    if (isUnlimited) {
       return {
         remainingSwipes: -1, // -1 means unlimited
         resetAt: null,
         canSwipe: true,
         isPremium: limits.tier.id === 'premium_yearly',
         isBasic: limits.tier.id === 'basic_monthly',
         isStandard: limits.tier.id === 'standard_3month',
         tierName: limits.tier.name,
         dailyLimit: -1,
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
        remainingSwipes: dailyLimit,
        resetAt,
        canSwipe: true,
        isPremium: limits.tier.id === 'premium_yearly',
        isBasic: limits.tier.id === 'basic_monthly',
        isStandard: limits.tier.id === 'standard_3month',
        tierName: limits.tier.name,
        dailyLimit,
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
        remainingSwipes: dailyLimit,
        resetAt: newResetAt,
        canSwipe: true,
        isPremium: limits.tier.id === 'premium_yearly',
        isBasic: limits.tier.id === 'basic_monthly',
        isStandard: limits.tier.id === 'standard_3month',
        tierName: limits.tier.name,
        dailyLimit,
      };
    }

    // Calculate remaining swipes based on user's tier limit
    const remainingSwipes = Math.max(0, dailyLimit - swipeLimit.swipes_used);

    return {
      remainingSwipes,
      resetAt,
      canSwipe: remainingSwipes > 0,
      isPremium: limits.tier.id === 'premium_yearly',
      isBasic: limits.tier.id === 'basic_monthly',
      isStandard: limits.tier.id === 'standard_3month',
      tierName: limits.tier.name,
      dailyLimit,
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
