import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('x-cryptomus-signature')

    // Verify webhook signature
    const isValidSignature = verifyCryptomusSignature(body, signature)
    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('Cryptomus webhook event:', event.type)

    switch (event.type) {
      case 'payment':
        await handlePayment(event.data)
        break
      case 'recurrence':
        await handleRecurrence(event.data)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Cryptomus webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

function verifyCryptomusSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false

  const expectedSignature = crypto
    .createHmac('sha256', process.env.CRYPTOMUS_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')

  return signature === expectedSignature
}

async function handlePayment(paymentData: any) {
  const { user_id, tier_id, subscription_id } = paymentData.additional_data || {}

  if (!user_id) {
    console.error('No user_id in payment data')
    return
  }

  // Record the payment transaction
  await supabase
    .from('payment_transactions')
    .insert({
      user_id,
      subscription_id,
      payment_provider: 'cryptomus',
      provider_transaction_id: paymentData.uuid,
      amount: paymentData.amount,
      currency: paymentData.currency,
      crypto_currency: paymentData.currency,
      crypto_amount: paymentData.amount,
      status: paymentData.status === 'paid' ? 'completed' : 'failed',
      transaction_type: 'subscription',
      metadata: {
        cryptomus_payment: paymentData
      }
    })

  // If payment successful, update subscription
  if (paymentData.status === 'paid') {
    await supabase
      .from('subscriptions')
      .upsert({
        user_id,
        tier_id,
        payment_provider: 'cryptomus',
        provider_subscription_id: paymentData.uuid,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        last_payment_at: new Date().toISOString(),
        next_payment_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          last_cryptomus_payment: paymentData
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

async function handleRecurrence(recurrenceData: any) {
  // Handle recurring payment updates
  if (recurrenceData.status === 'active') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        next_payment_at: recurrenceData.next_payment_date,
        metadata: {
          cryptomus_recurrence: recurrenceData
        }
      })
      .eq('provider_subscription_id', recurrenceData.uuid)
  } else if (recurrenceData.status === 'cancelled') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        metadata: {
          cryptomus_recurrence_cancelled: recurrenceData
        }
      })
      .eq('provider_subscription_id', recurrenceData.uuid)
  }
}