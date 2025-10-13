import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Verify cron job secret for security
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date().toISOString()

    // Find expired subscriptions
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        status,
        current_period_end,
        cancel_at_period_end,
        user_profiles!inner(subscription_tier_id)
      `)
      .eq('status', 'active')
      .lt('current_period_end', now)

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch expired subscriptions' },
        { status: 500 }
      )
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return NextResponse.json({
        message: 'No expired subscriptions found',
        processed: 0
      })
    }

    // Update expired subscriptions and user profiles
    const updates = []
    for (const subscription of expiredSubscriptions) {
      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: now
        })
        .eq('id', subscription.id)

      // Reset user to free tier
      await supabase
        .from('user_profiles')
        .update({
          subscription_tier_id: 'free',
          is_premium: false,
          premium_until: null,
          updated_at: now
        })
        .eq('id', subscription.user_id)

      updates.push({
        user_id: subscription.user_id,
        subscription_id: subscription.id
      })
    }

    console.log(`Processed ${updates.length} expired subscriptions`)

    return NextResponse.json({
      message: `Successfully processed ${updates.length} expired subscriptions`,
      processed: updates.length,
      details: updates
    })

  } catch (error) {
    console.error('Error in subscription expiry cron job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}