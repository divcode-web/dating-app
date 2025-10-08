import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Create Redis client
// Upstash is a serverless Redis provider that works perfectly with Vercel/Next.js
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Create rate limiter
// This will work across ALL servers because it uses Redis (shared storage)
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per 1 minute
      analytics: true, // Optional: track rate limit analytics
      prefix: 'ratelimit', // Redis key prefix
    })
  : null

// Fallback in-memory rate limiter for local development (when Redis is not configured)
const localRateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute

function localCheckRateLimit(key: string): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = localRateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    localRateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { success: true, remaining: MAX_REQUESTS - 1 }
  }

  if (record.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: MAX_REQUESTS - record.count }
}

// Cleanup old entries for local rate limiter
if (!redis) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of localRateLimitMap.entries()) {
      if (now > record.resetTime) {
        localRateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000) // Every 5 minutes
}

/**
 * Check rate limit for a given identifier (usually IP address)
 *
 * Production: Uses Redis (works across multiple servers)
 * Development: Uses in-memory storage (single server only)
 */
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  // Use Redis rate limiting if available (PRODUCTION)
  if (ratelimit) {
    const result = await ratelimit.limit(identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  }

  // Fallback to in-memory rate limiting (DEVELOPMENT)
  const result = localCheckRateLimit(identifier)
  const now = Date.now()

  return {
    success: result.success,
    limit: MAX_REQUESTS,
    remaining: result.remaining,
    reset: now + RATE_LIMIT_WINDOW,
  }
}

/**
 * Get rate limit identifier from request
 * Uses IP address as the unique identifier
 */
export function getRateLimitIdentifier(
  ip: string | null,
  forwardedFor: string | null
): string {
  // Get real IP from forwarded header (when behind proxy/load balancer)
  const forwarded = forwardedFor ? forwardedFor.split(',')[0] : null
  const identifier = forwarded || ip || 'anonymous'

  return identifier.trim()
}
