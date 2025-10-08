import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { sanitizeUUID, sanitizeString } from '@/lib/sanitize'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const PREMIUM_PRICES = {
  'premium-monthly': process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
  'premium-yearly': process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const priceId = sanitizeString(body.priceId)
    const userId = sanitizeUUID(body.userId)

    if (!priceId || !userId || !PREMIUM_PRICES[priceId as keyof typeof PREMIUM_PRICES]) {
      return NextResponse.json(
        { error: 'Invalid or missing required parameters' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = subscriptionData?.stripe_customer_id

    if (!customerId) {
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (!userData || !userData.email) {
        return NextResponse.json(
          { error: 'User data not found' },
          { status: 404 }
        )
      }

      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.full_name || undefined,
        metadata: {
          userId,
        },
      })

      customerId = customer.id

      // Save Stripe customer ID
      await supabase.from('subscriptions').insert({
        user_id: userId,
        stripe_customer_id: customerId,
      })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: PREMIUM_PRICES[priceId as keyof typeof PREMIUM_PRICES],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium?canceled=true`,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}