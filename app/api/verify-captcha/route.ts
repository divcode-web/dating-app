import { NextRequest, NextResponse } from 'next/server'

interface CloudflareVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
  action?: string
  cdata?: string
}

/**
 * Verify Cloudflare Turnstile CAPTCHA token
 */
async function verifyTurnstileToken(token: string, secretKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    if (!response.ok) {
      console.error('CAPTCHA verification request failed:', response.status, response.statusText)
      return false
    }

    const result: CloudflareVerifyResponse = await response.json()

    if (!result.success) {
      console.error('CAPTCHA verification failed:', result['error-codes'])
      return false
    }

    return true
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error)
    return false
  }
}

/**
 * API route to verify CAPTCHA tokens
 * POST /api/verify-captcha
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, action } = body

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'CAPTCHA token is required' },
        { status: 400 }
      )
    }

    if (!process.env.TURNSTILE_SECRET_KEY) {
      console.error('TURNSTILE_SECRET_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'CAPTCHA configuration error' },
        { status: 500 }
      )
    }

    // Verify token with Cloudflare
    const isValid = await verifyTurnstileToken(token, process.env.TURNSTILE_SECRET_KEY)

    if (!isValid) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed' },
        { status: 400 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'CAPTCHA verified successfully',
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('CAPTCHA verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint for CAPTCHA service
 * GET /api/verify-captcha
 */
export async function GET() {
  return NextResponse.json({
    status: 'CAPTCHA service operational',
    timestamp: new Date().toISOString(),
    configured: !!process.env.TURNSTILE_SECRET_KEY,
  })
}