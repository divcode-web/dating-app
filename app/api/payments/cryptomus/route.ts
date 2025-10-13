import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: 'User ID and amount are required' }, { status: 400 })
    }

    // Create order ID with user ID embedded
    const orderId = `premium-${userId}-${Date.now()}`

    const paymentData = {
      amount: amount.toString(),
      currency: 'USD',
      order_id: orderId,
      url_callback: process.env.CRYPTOMUS_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cryptomus`,
      url_success: `${process.env.NEXT_PUBLIC_APP_URL}/premium/success`,
      url_return: `${process.env.NEXT_PUBLIC_APP_URL}/premium/cancel`,
      additional_data: JSON.stringify({
        user_id: userId,
        tier_id: 'premium'
      })
    }

    // Generate signature for Cryptomus
    const jsonString = JSON.stringify(paymentData)
    const base64 = Buffer.from(jsonString).toString('base64')
    const signature = require('crypto')
      .createHash('md5')
      .update(base64 + (process.env.CRYPTOMUS_PAYMENT_KEY || ''))
      .digest('hex')

    const response = await fetch('https://api.cryptomus.com/v1/payment', {
      method: 'POST',
      headers: {
        'merchant': process.env.CRYPTOMUS_MERCHANT_ID!,
        'sign': signature,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Cryptomus API error:', error)
      return NextResponse.json(
        { error: 'Failed to create Cryptomus payment' },
        { status: 500 }
      )
    }

    const result = await response.json()

    if (result.state !== 0) {
      console.error('Cryptomus error:', result)
      return NextResponse.json(
        { error: 'Failed to create Cryptomus payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      checkoutUrl: result.result.url,
      paymentId: result.result.uuid,
      orderId: orderId,
    })

  } catch (error) {
    console.error('Error creating Cryptomus checkout:', error)
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
    const response = await fetch(`https://api.cryptomus.com/v1/payment/${paymentId}`, {
      headers: {
        'merchant': process.env.CRYPTOMUS_MERCHANT_ID!,
        'sign': require('crypto')
          .createHash('md5')
          .update(paymentId + (process.env.CRYPTOMUS_PAYMENT_KEY || ''))
          .digest('hex'),
      },
    })

    const payment = await response.json()
    return NextResponse.json(payment)

  } catch (error) {
    console.error('Error checking Cryptomus payment status:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}