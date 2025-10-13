import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// LemonSqueezy configuration
const LEMONSQUEEZY_VARIANTS: Record<string, string> = {
  basic_monthly: process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID || '',
  standard_3month: process.env.LEMONSQUEEZY_3MONTH_VARIANT_ID || '',
  premium_yearly: process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID || '',
};

// Cryptomus configuration
function generateCryptomusSignature(data: any): string {
  const jsonString = JSON.stringify(data);
  const base64 = Buffer.from(jsonString).toString('base64');
  return crypto
    .createHash('md5')
    .update(base64 + process.env.CRYPTOMUS_PAYMENT_KEY)
    .digest('hex');
}

export const dynamic = 'force-dynamic';export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    const { provider, tierId, userId } = await req.json();

    if (!provider || !tierId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get tier details
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 404 }
      );
    }

    // Get user details
    const { data: user } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/premium?success=true&tier=${tierId}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/premium?canceled=true`;

    // Route to appropriate provider
    switch (provider) {
      case 'lemonsqueezy':
        return await createLemonSqueezyCheckout(tier, user, userId, successUrl, cancelUrl);

      case 'cryptomus':
        return await createCryptomusCheckout(tier, user, userId, successUrl, cancelUrl);

      case 'nowpayments':
        return await createNOWPaymentsCheckout(tier, user, userId, successUrl, cancelUrl);

      default:
        return NextResponse.json(
          { error: 'Invalid payment provider' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * Create LemonSqueezy checkout
 */
async function createLemonSqueezyCheckout(
  tier: any,
  user: any,
  userId: string,
  successUrl: string,
  cancelUrl: string
) {
  const variantId = LEMONSQUEEZY_VARIANTS[tier.id];

  if (!variantId) {
    return NextResponse.json(
      { error: 'Tier not configured for LemonSqueezy' },
      { status: 400 }
    );
  }

  // Call LemonSqueezy API
  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: user.email,
            name: user.full_name,
            custom: {
              user_id: userId,
              tier_id: tier.id,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID!,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId,
            },
          },
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('LemonSqueezy error:', data);
    return NextResponse.json(
      { error: 'Failed to create LemonSqueezy checkout' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    checkoutUrl: data.data.attributes.url,
    provider: 'lemonsqueezy',
  });
}

/**
 * Create Cryptomus recurring payment
 */
async function createCryptomusCheckout(
  tier: any,
  user: any,
  userId: string,
  successUrl: string,
  cancelUrl: string
) {
  const data = {
    amount: tier.price.toString(),
    currency: 'USD',
    name: `${tier.name} Subscription`,
    period: tier.interval === 'month' ? 'monthly' : 'three_month', // Cryptomus doesn't have yearly recurring
    order_id: `user_${userId}_${Date.now()}`,
    url_callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cryptomus`,
    url_return: successUrl,
    url_cancel: cancelUrl,
    additional_data: JSON.stringify({
      user_id: userId,
      tier_id: tier.id,
    }),
  };

  const signature = generateCryptomusSignature(data);

  const response = await fetch('https://api.cryptomus.com/v1/recurrence/create', {
    method: 'POST',
    headers: {
      'merchant': process.env.NEXT_PUBLIC_CRYPTOMUS_MERCHANT_ID!,
      'sign': signature,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || result.state !== 0) {
    console.error('Cryptomus error:', result);
    return NextResponse.json(
      { error: 'Failed to create Cryptomus payment' },
      { status: 500 }
    );
  }

  // Store the recurring payment ID
  await supabase.from('subscriptions').insert({
    user_id: userId,
    tier_id: tier.id,
    payment_provider: 'cryptomus',
    provider_subscription_id: result.result.uuid,
    status: 'pending',
    metadata: { recurring_payment_id: result.result.uuid },
  });

  return NextResponse.json({
    checkoutUrl: result.result.url,
    provider: 'cryptomus',
  });
}

/**
 * Create NOWPayments subscription
 */
async function createNOWPaymentsCheckout(
  tier: any,
  user: any,
  userId: string,
  successUrl: string,
  cancelUrl: string
) {
  // First, create or get subscription plan
  let planId = process.env[`NOWPAYMENTS_${tier.id.toUpperCase()}_PLAN_ID`];

  if (!planId) {
    // Create plan if doesn't exist
    const planResponse = await fetch('https://api.nowpayments.io/v1/subscriptions/plans', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: tier.name,
        interval_day: tier.interval === 'month' ? 30 : tier.interval === '3month' ? 90 : 365,
        amount: tier.price,
        currency: 'usd',
        ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    const planData = await planResponse.json();
    planId = planData.id;
  }

  // Create subscription
  const response = await fetch('https://api.nowpayments.io/v1/subscriptions', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NEXT_PUBLIC_NOWPAYMENTS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription_plan_id: planId,
      customer: {
        email: user.email,
      },
      metadata: {
        user_id: userId,
        tier_id: tier.id,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('NOWPayments error:', result);
    return NextResponse.json(
      { error: 'Failed to create NOWPayments subscription' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    checkoutUrl: result.invoice_url,
    provider: 'nowpayments',
  });
}
