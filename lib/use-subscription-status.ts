"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from './supabase';

export interface SubscriptionStatus {
  isActive: boolean;
  tier: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  status: string;
  provider?: string;
  tierDetails?: any;
  refreshedAt?: string;
}

export interface UseSubscriptionStatusReturn {
  subscription: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isSubscriptionActive: boolean;
  hasFeature: (feature: string) => boolean;
}

export function useSubscriptionStatus(): UseSubscriptionStatusReturn {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !session?.access_token) {
      setSubscription(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/refresh', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error('Error refreshing subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh subscription status');
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  const hasFeature = useCallback((feature: string): boolean => {
    if (!subscription?.tierDetails) return false;

    switch (feature) {
      case 'see_who_likes':
        return subscription.tierDetails.can_see_who_likes || false;
      case 'ai_matching':
        return subscription.tierDetails.can_use_ai_matching || false;
      case 'rewind':
        return subscription.tierDetails.can_rewind_swipes || false;
      case 'global_dating':
        return subscription.tierDetails.has_global_dating || false;
      case 'no_ads':
        return subscription.tierDetails.no_ads || false;
      case 'priority_support':
        return subscription.tierDetails.has_priority_support || false;
      case 'can_see_online_status':
        return subscription.tierDetails.can_see_online_status || false;
      case 'priority_matches':
        return subscription.tierDetails.has_priority_matches || false;
      case 'read_receipts':
        return subscription.tierDetails.has_read_receipts || false;
      case 'advanced_filters':
        return subscription.tierDetails.has_advanced_filters || false;
      case 'profile_boost':
        return subscription.tierDetails.has_profile_boost || false;
      case 'unlimited_rewinds':
        return subscription.tierDetails.has_unlimited_rewinds || false;
      default:
        return false;
    }
  }, [subscription]);

  useEffect(() => {
    if (user && session) {
      refresh();
    } else {
      setSubscription(null);
    }
  }, [user, session, refresh]);

  // Set up periodic refresh every 5 minutes for active subscriptions
  useEffect(() => {
    if (!subscription?.isActive) return;

    const interval = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [subscription?.isActive, refresh]);

  return {
    subscription,
    loading,
    error,
    refresh,
    isSubscriptionActive: subscription?.isActive || false,
    hasFeature,
  };
}