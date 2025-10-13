import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, planId = 'premium', amount = 9.99 } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
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

    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('NOWPayments API error:', error)
      return NextResponse.json(
        { error: 'Payment creation failed' },
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