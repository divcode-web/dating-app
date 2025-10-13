import { supabase } from './supabase';

export interface ProfileBoost {
  id: string;
  userId: string;
  boostType: 'standard' | 'premium' | 'super';
  durationHours: number;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
  boostMultiplier: number;
}

export interface BoostStatus {
  isActive: boolean;
  boostType?: 'standard' | 'premium' | 'super';
  expiresAt?: string;
  boostMultiplier?: number;
  timeRemaining?: string;
  remainingBoosts: number;
}

/**
 * Get user's current boost status
 */
export async function getBoostStatus(userId: string): Promise<BoostStatus> {
  try {
    // Get active boost
    const { data: activeBoost, error: boostError } = await supabase
      .rpc('get_active_boost', { p_user_id: userId });

    // Get remaining boosts this month
    const { data: remainingBoosts, error: remainingError } = await supabase
      .rpc('get_remaining_boosts', { p_user_id: userId });

    if (boostError || remainingError) {
      console.error('Error getting boost status:', boostError || remainingError);
      return { isActive: false, remainingBoosts: 0 };
    }

    if (activeBoost && activeBoost.length > 0) {
      const boost = activeBoost[0];
      const timeRemaining = new Date(boost.expires_at).getTime() - Date.now();

      return {
        isActive: true,
        boostType: boost.boost_type,
        expiresAt: boost.expires_at,
        boostMultiplier: parseFloat(boost.boost_multiplier),
        timeRemaining: formatTimeRemaining(timeRemaining),
        remainingBoosts: remainingBoosts || 0,
      };
    }

    return {
      isActive: false,
      remainingBoosts: remainingBoosts || 0,
    };
  } catch (error) {
    console.error('Error getting boost status:', error);
    return { isActive: false, remainingBoosts: 0 };
  }
}

/**
 * Activate a profile boost
 */
export async function activateBoost(
  userId: string,
  boostType: 'standard' | 'premium' | 'super' = 'standard',
  durationHours: number = 24
): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase
      .rpc('activate_profile_boost', {
        p_user_id: userId,
        p_boost_type: boostType,
        p_duration_hours: durationHours,
      });

    if (error) {
      console.error('Error activating boost:', error);
      return {
        success: false,
        message: error.message || 'Failed to activate boost',
      };
    }

    if (data === true) {
      return {
        success: true,
        message: `Profile boost activated! Your profile is now ${getBoostMultiplier(boostType)}x more visible.`,
      };
    } else {
      return {
        success: false,
        message: 'No boosts remaining this month. Upgrade your plan for more boosts!',
      };
    }
  } catch (error: any) {
    console.error('Error activating boost:', error);
    return {
      success: false,
      message: error.message || 'Failed to activate boost',
    };
  }
}

/**
 * Get boost multiplier for display
 */
function getBoostMultiplier(boostType: string): number {
  switch (boostType) {
    case 'standard': return 2;
    case 'premium': return 3;
    case 'super': return 5;
    default: return 2;
  }
}

/**
 * Format time remaining for display
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Check if user has boost feature access
 */
export async function hasBoostAccess(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('subscription_tier_id, subscription_tiers(has_profile_boost)')
      .eq('id', userId)
      .single();

    const tierData = Array.isArray(data?.subscription_tiers)
      ? data.subscription_tiers[0]
      : data?.subscription_tiers;

    return tierData?.has_profile_boost || false;
  } catch (error) {
    console.error('Error checking boost access:', error);
    return false;
  }
}