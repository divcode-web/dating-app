import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    let subscriptionStatus: {
      isActive: boolean;
      tier: string;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      status: string;
    } = {
      isActive: false,
      tier: 'free',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      status: 'none'
    }

    if (subscription) {
      try {
        // Refresh subscription status based on payment provider
        const provider = subscription.payment_provider || 'legacy'
        const refreshedData = await refreshProviderSubscription(subscription, provider)

        if (refreshedData) {
          subscriptionStatus = refreshedData.status
        } else {
          // Fallback to database values if provider refresh fails
          subscriptionStatus = {
            isActive: subscription.status === 'active',
            tier: subscription.tier_id || 'free',
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            status: subscription.status || 'none'
          }
        }

        // Update user profile based on subscription status
        await updateUserProfileFromSubscription(user.id, subscription, subscriptionStatus)

      } catch (providerError) {
        console.error('Error refreshing provider subscription:', providerError)

        // Fallback to database values if provider refresh fails
        subscriptionStatus = {
          isActive: subscription.status === 'active',
          tier: subscription.tier_id || 'free',
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          status: subscription.status || 'none'
        }
      }
    } else {
      // No subscription found, ensure user is on free tier
      await supabase
        .from('user_profiles')
        .update({
          subscription_tier_id: 'free',
          is_premium: false,
          premium_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
    }

    // Get user's current tier and limits
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier_id, subscription_tiers(*)')
      .eq('id', user.id)
      .single()

    const tier = profile?.subscription_tiers || await getFreeTier()

    return NextResponse.json({
      subscription: subscriptionStatus,
      tier,
      refreshedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error refreshing subscription status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Refresh subscription status from the appropriate payment provider
 */
async function refreshProviderSubscription(subscription: any, provider: string) {
  try {
    switch (provider) {
      case 'stripe':
        return await refreshStripeSubscription(subscription)
      case 'lemonsqueezy':
        return await refreshLemonSqueezySubscription(subscription)
      case 'cryptomus':
        return await refreshCryptomusSubscription(subscription)
      case 'nowpayments':
        return await refreshNOWPaymentsSubscription(subscription)
      default:
        console.warn(`Unknown payment provider: ${provider}`)
        return null
    }
  } catch (error) {
    console.error(`Error refreshing ${provider} subscription:`, error)
    return null
  }
}

/**
 * Update user profile based on subscription status
 */
async function updateUserProfileFromSubscription(
  userId: string,
  subscription: any,
  subscriptionStatus: any
) {
  const now = new Date()
  const isActive = subscriptionStatus.isActive

  if (isActive) {
    // Update with active subscription
    await supabase
      .from('user_profiles')
      .update({
        subscription_tier_id: subscription.tier_id || 'free',
        is_premium: true,
        premium_until: subscriptionStatus.currentPeriodEnd,
        updated_at: now.toISOString()
      })
      .eq('id', userId)
  } else {
    // Reset to free tier if subscription expired/inactive
    await supabase
      .from('user_profiles')
      .update({
        subscription_tier_id: 'free',
        is_premium: false,
        premium_until: null,
        updated_at: now.toISOString()
      })
      .eq('id', userId)
  }
}

/**
 * Refresh Stripe subscription (legacy support)
 */
async function refreshStripeSubscription(subscription: any) {
  // This would use Stripe API if needed for legacy subscriptions
  // For now, return database values
  return {
    status: {
      isActive: subscription.status === 'active',
      tier: subscription.tier_id || 'free',
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      status: subscription.status || 'none'
    }
  }
}

/**
 * Refresh LemonSqueezy subscription
 */
async function refreshLemonSqueezySubscription(subscription: any) {
  // Check recent payments for LemonSqueezy
  const { data: recentPayments } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('subscription_id', subscription.id)
    .eq('payment_provider', 'lemonsqueezy')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (recentPayments && recentPayments.length > 0) {
    const lastPayment = recentPayments[0]
    const paymentDate = new Date(lastPayment.created_at)

    // Assume monthly subscription for now - you may want to make this configurable
    const nextPaymentDue = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000)

    return {
      status: {
        isActive: nextPaymentDue > new Date(),
        tier: subscription.tier_id || 'free',
        currentPeriodStart: paymentDate.toISOString(),
        currentPeriodEnd: nextPaymentDue.toISOString(),
        cancelAtPeriodEnd: false,
        status: nextPaymentDue > new Date() ? 'active' : 'expired'
      }
    }
  }

  return null
}

/**
 * Refresh Cryptomus subscription
 */
async function refreshCryptomusSubscription(subscription: any) {
  // Check for active recurring payment
  if (subscription.metadata?.recurring_payment_id) {
    // Here you would typically check Cryptomus API for subscription status
    // For now, check recent payments
    const { data: recentPayments } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('subscription_id', subscription.id)
      .eq('payment_provider', 'cryptomus')
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()) // Last 35 days
      .order('created_at', { ascending: false })
      .limit(1)

    if (recentPayments && recentPayments.length > 0) {
      return {
        status: {
          isActive: true,
          tier: subscription.tier_id || 'free',
          currentPeriodStart: recentPayments[0].created_at,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Assume next 30 days
          cancelAtPeriodEnd: false,
          status: 'active'
        }
      }
    }
  }

  return null
}

/**
 * Refresh NOWPayments subscription
 */
async function refreshNOWPaymentsSubscription(subscription: any) {
  // Similar logic to Cryptomus
  const { data: recentPayments } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('subscription_id', subscription.id)
    .eq('payment_provider', 'nowpayments')
    .eq('status', 'completed')
    .gte('created_at', new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)

  if (recentPayments && recentPayments.length > 0) {
    return {
      status: {
        isActive: true,
        tier: subscription.tier_id || 'free',
        currentPeriodStart: recentPayments[0].created_at,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        status: 'active'
      }
    }
  }

  return null
}

// Helper function to get free tier
async function getFreeTier() {
  const { data } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('id', 'free')
    .single()

  return data || {
    id: 'free',
    name: 'Free',
    price: 0,
    daily_swipe_limit: 10,
    daily_message_limit: 11,
    daily_super_likes: 0,
    monthly_boosts: 0,
    can_see_who_likes: false,
    can_use_ai_matching: false,
    can_rewind_swipes: false,
    has_global_dating: false,
    has_priority_matches: false,
    has_read_receipts: false,
    has_advanced_filters: false,
    has_profile_boost: false,
    no_ads: false,
    has_priority_support: false,
    can_see_online_status: false,
    has_unlimited_rewinds: false,
    is_popular: false
  }
}