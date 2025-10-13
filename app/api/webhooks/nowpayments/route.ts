import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const event = JSON.parse(body)

    // NOWPayments uses IPN (no signature verification needed)
    // Optional: You can verify the request comes from NOWPayments IPs
    const clientIP = req.headers.get('x-forwarded-for') || req.ip
    console.log('NOWPayments IPN from IP:', clientIP)

    console.log('NOWPayments IPN event:', event)

    // Handle different payment statuses
    if (event.payment_status) {
      switch (event.payment_status) {
        case 'finished':
        case 'confirmed':
          await handlePayment(event)
          break
        case 'failed':
        case 'expired':
          await handleFailedPayment(event)
          break
        case 'pending':
          console.log('Payment pending:', event.payment_id)
          break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing NOWPayments IPN:', error)
    return NextResponse.json(
      { error: 'IPN handler failed' },
      { status: 500 }
    )
  }
}

// Signature verification removed - NOWPayments uses IPN without signatures

async function handlePayment(paymentData: any) {
  // Extract user_id from order_id (format: premium-{userId}-{timestamp})
  const orderId = paymentData.order_id || paymentData.order_description
  const userIdMatch = orderId?.match(/premium-([^-]+)-/)
  const userId = userIdMatch ? userIdMatch[1] : null

  if (!userId) {
    console.error('No user_id found in order_id:', orderId)
    return
  }

  // Record the payment transaction
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: userId,
      payment_provider: 'nowpayments',
      provider_transaction_id: paymentData.payment_id,
      amount: paymentData.price_amount,
      currency: paymentData.price_currency,
      crypto_currency: paymentData.pay_currency,
      crypto_amount: paymentData.pay_amount,
      status: 'completed',
      transaction_type: 'subscription',
      metadata: {
        nowpayments_payment: paymentData
      }
    })

  // Update subscription
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      payment_provider: 'nowpayments',
      provider_subscription_id: paymentData.payment_id,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
      is_premium: true,
      premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', userId)

  console.log('Payment processed successfully for user:', userId)
}

async function handleFailedPayment(paymentData: any) {
  const orderId = paymentData.order_id || paymentData.order_description
  const userIdMatch = orderId?.match(/premium-([^-]+)-/)
  const userId = userIdMatch ? userIdMatch[1] : null

  if (!userId) {
    console.error('No user_id found in failed payment:', orderId)
    return
  }

  // Record failed payment
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: userId,
      payment_provider: 'nowpayments',
      provider_transaction_id: paymentData.payment_id,
      amount: paymentData.price_amount,
      currency: paymentData.price_currency,
      status: 'failed',
      transaction_type: 'subscription',
      metadata: {
        nowpayments_failed_payment: paymentData
      }
    })

  console.log('Failed payment recorded for user:', userId)
}

// NOWPayments handles subscriptions differently - they send individual payment notifications
// This function can be used for future subscription management if needed
async function handleSubscription(subscriptionData: any) {
  console.log('Subscription event received:', subscriptionData)
  // Handle subscription-specific logic here if NOWPayments adds subscription features
}