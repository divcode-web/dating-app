import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('x-nowpayments-sig')

    // Verify webhook signature
    const isValidSignature = verifyNOWPaymentsSignature(body, signature)
    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('NOWPayments webhook event:', event.type)

    switch (event.type) {
      case 'payment':
        await handlePayment(event.data)
        break
      case 'subscription':
        await handleSubscription(event.data)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing NOWPayments webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

function verifyNOWPaymentsSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false

  const expectedSignature = crypto
    .createHmac('sha256', process.env.NOWPAYMENTS_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')

  return signature === expectedSignature
}

async function handlePayment(paymentData: any) {
  const { user_id, tier_id, subscription_id } = paymentData.metadata || {}

  if (!user_id) {
    console.error('No user_id in payment metadata')
    return
  }

  // Record the payment transaction
  await supabase
    .from('payment_transactions')
    .insert({
      user_id,
      subscription_id,
      payment_provider: 'nowpayments',
      provider_transaction_id: paymentData.id,
      amount: paymentData.price_amount,
      currency: paymentData.price_currency,
      crypto_currency: paymentData.pay_currency,
      crypto_amount: paymentData.pay_amount,
      status: paymentData.status === 'finished' ? 'completed' : 'failed',
      transaction_type: 'subscription',
      metadata: {
        nowpayments_payment: paymentData
      }
    })

  // If payment successful, update subscription
  if (paymentData.status === 'finished') {
    await supabase
      .from('subscriptions')
      .upsert({
        user_id,
        tier_id,
        payment_provider: 'nowpayments',
        provider_subscription_id: paymentData.id,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        last_payment_at: new Date().toISOString(),
        next_payment_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          last_nowpayments_payment: paymentData
        }
      })

    // Update user profile
    await supabase
      .from('user_profiles')
      .update({
        subscription_tier_id: tier_id,
        is_premium: true,
        premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', user_id)
  }
}

async function handleSubscription(subscriptionData: any) {
  // Handle subscription status updates
  if (subscriptionData.status === 'active') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        next_payment_at: subscriptionData.next_payment_date,
        metadata: {
          nowpayments_subscription: subscriptionData
        }
      })
      .eq('provider_subscription_id', subscriptionData.id)
  } else if (subscriptionData.status === 'cancelled') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        metadata: {
          nowpayments_subscription_cancelled: subscriptionData
        }
      })
      .eq('provider_subscription_id', subscriptionData.id)
  }
}