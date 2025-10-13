import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get user from session instead of request body
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const userId = user.id
    console.log('Authenticated user:', userId)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Profile lookup failed:', { userId, profileError })
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get amount from request body
    const body = await request.json()
    const { amount } = body

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    // Create order ID with user ID embedded
    const orderId = `premium-${userId}-${Date.now()}`

    // Ensure minimum amount to avoid NOWPayments minimum error
    const minAmount = Math.max(amount, 1.0); // Minimum $1.00 to avoid crypto minimum issues

    const paymentPayload = {
      price_amount: minAmount,
      price_currency: 'usd',
      pay_currency: 'btc', // Default to BTC, user can change
      ipn_callback_url: process.env.NOWPAYMENTS_IPN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      order_id: orderId,
      order_description: `Premium Dating Subscription - ${orderId}`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium/cancel`,
    }

    // Check if NOWPayments API key is configured
    if (!process.env.NOWPAYMENTS_API_KEY) {
      console.error('NOWPAYMENTS_API_KEY not configured')
      return NextResponse.json(
        { error: 'Payment service not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('NOWPayments API error:', response.status, error)
      return NextResponse.json(
        { error: `Payment creation failed: ${error}` },
        { status: response.status }
      )
    }

    const payment = await response.json()

    return NextResponse.json({
      checkoutUrl: payment.invoice_url,
      paymentId: payment.payment_id,
      orderId: orderId,
    })

  } catch (error) {
    console.error('Error creating NOWPayments checkout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check payment status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paymentId = searchParams.get('payment_id')

  if (!paymentId) {
    return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
      },
    })

    const payment = await response.json()
    return NextResponse.json(payment)

  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}