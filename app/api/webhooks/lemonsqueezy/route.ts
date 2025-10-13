import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('x-signature')

    // Verify webhook signature (you may want to implement proper signature verification)
    // const isValidSignature = verifyLemonSqueezySignature(body, signature)
    // if (!isValidSignature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const event = JSON.parse(body)
    console.log('LemonSqueezy webhook event:', event.meta.event_name)

    switch (event.meta.event_name) {
      case 'subscription_created':
      case 'subscription_updated':
        await handleSubscriptionUpdate(event.data)
        break
      case 'subscription_cancelled':
        await handleSubscriptionCancellation(event.data)
        break
      case 'payment_success':
        await handlePaymentSuccess(event.data)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing LemonSqueezy webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(eventData: any) {
  const subscription = eventData.attributes
  const customData = subscription.custom_data || {}

  if (!customData.user_id) {
    console.error('No user_id in subscription data')
    return
  }

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: customData.user_id,
      tier_id: customData.tier_id,
      payment_provider: 'lemonsqueezy',
      provider_customer_id: subscription.customer_id.toString(),
      provider_subscription_id: subscription.id.toString(),
      status: subscription.status,
      current_period_start: subscription.created_at,
      current_period_end: subscription.ends_at,
      cancel_at_period_end: subscription.cancelled,
      metadata: {
        lemonsqueezy_subscription: subscription
      }
    })

  // Update user profile
  const isActive = subscription.status === 'active'
  await supabase
    .from('user_profiles')
    .update({
      subscription_tier_id: customData.tier_id,
      is_premium: isActive,
      premium_until: isActive ? subscription.ends_at : null,
    })
    .eq('id', customData.user_id)
}

async function handleSubscriptionCancellation(eventData: any) {
  const subscription = eventData.attributes
  const customData = subscription.custom_data || {}

  if (!customData.user_id) return

  // Mark subscription as cancelled
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: true,
      metadata: {
        cancelled_at: new Date().toISOString(),
        lemonsqueezy_cancellation: subscription
      }
    })
    .eq('user_id', customData.user_id)
}

async function handlePaymentSuccess(eventData: any) {
  const payment = eventData.attributes

  // Log successful payment
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: payment.custom_data?.user_id,
      subscription_id: payment.custom_data?.subscription_id,
      payment_provider: 'lemonsqueezy',
      provider_transaction_id: payment.id.toString(),
      amount: payment.total,
      currency: payment.currency,
      status: 'completed',
      transaction_type: 'subscription',
      metadata: {
        lemonsqueezy_payment: payment
      }
    })
}