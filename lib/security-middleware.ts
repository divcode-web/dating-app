import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'

/**
 * Security middleware for authentication endpoints
 * Handles account lockout, enhanced rate limiting, and security logging
 */

export interface SecurityCheckResult {
  allowed: boolean
  blocked: boolean
  locked: boolean
  rateLimited: boolean
  reason?: string
  retryAfter?: number
}

/**
 * Check if account is locked due to failed login attempts
 */
export async function checkAccountLockout(userId: string): Promise<{
  locked: boolean
  lockedUntil?: Date
  reason?: string
}> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('locked_until, failed_login_attempts')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { locked: false }
    }

    const isLocked = profile.locked_until && new Date(profile.locked_until) > new Date()

    return {
      locked: isLocked,
      lockedUntil: profile.locked_until ? new Date(profile.locked_until) : undefined,
      reason: isLocked ? `Account locked due to ${profile.failed_login_attempts} failed login attempts` : undefined,
    }
  } catch (error) {
    console.error('Error checking account lockout:', error)
    return { locked: false }
  }
}

/**
 * Record failed login attempt and check if account should be locked
 */
export async function recordFailedLogin(
  userId: string,
  ipAddress: string,
  userAgent?: string
): Promise<{
  locked: boolean
  attempts: number
  lockoutDuration?: number
}> {
  try {
    // Call the database function to handle failed login
    const { data, error } = await supabase.rpc('handle_failed_login', {
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent || '',
    })

    if (error) {
      console.error('Error recording failed login:', error)
      return { locked: false, attempts: 0 }
    }

    return {
      locked: data.locked || false,
      attempts: data.attempts || 0,
      lockoutDuration: data.lockout_duration_minutes || 15,
    }
  } catch (error) {
    console.error('Error in recordFailedLogin:', error)
    return { locked: false, attempts: 0 }
  }
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedLogins(userId: string): Promise<void> {
  try {
    await supabase.rpc('reset_failed_logins', {
      p_user_id: userId,
    })
  } catch (error) {
    console.error('Error resetting failed logins:', error)
  }
}

/**
 * Enhanced security check for authentication endpoints
 */
export async function performSecurityCheck(
  request: NextRequest,
  endpoint: 'signin' | 'signup' | 'reset-password'
): Promise<SecurityCheckResult> {
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const userAgent = request.headers.get('user-agent') || ''
  const identifier = getRateLimitIdentifier(request.ip || null, request.headers.get('x-forwarded-for'))

  // Enhanced rate limiting for auth endpoints (stricter than general API)
  const authRateLimit = {
    signup: { window: '1 m', limit: 3 },      // 3 signups per minute
    signin: { window: '1 m', limit: 5 },      // 5 signin attempts per minute
    'reset-password': { window: '5 m', limit: 3 }, // 3 password resets per 5 minutes
  }

  const rateLimitConfig = authRateLimit[endpoint]

  // Check rate limit
  try {
    const rateLimitResult = await checkRateLimit(`${endpoint}:${identifier}`)

    if (!rateLimitResult.success) {
      return {
        allowed: false,
        blocked: false,
        locked: false,
        rateLimited: true,
        reason: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      }
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Continue with security check even if rate limiting fails
  }

  // For signin attempts, check if we have a user identifier
  if (endpoint === 'signin') {
    try {
      const body = await request.json()
      const { email } = body

      if (email) {
        // Get user ID from email for lockout checking
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', email.toLowerCase())
          .single()

        if (profile) {
          const lockoutCheck = await checkAccountLockout(profile.id)

          if (lockoutCheck.locked) {
            return {
              allowed: false,
              blocked: false,
              locked: true,
              rateLimited: false,
              reason: lockoutCheck.reason || 'Account is temporarily locked',
              retryAfter: lockoutCheck.lockedUntil
                ? Math.ceil((lockoutCheck.lockedUntil.getTime() - Date.now()) / 1000)
                : 900, // 15 minutes default
            }
          }
        }
      }
    } catch (error) {
      // If we can't parse the body or check lockout, continue
      console.error('Error checking account lockout:', error)
    }
  }

  // Additional security checks for suspicious activity
  const suspiciousPatterns = [
    /bot/i.test(userAgent),
    /crawler/i.test(userAgent),
    /spider/i.test(userAgent),
    ip === 'unknown' && !userAgent,
  ]

  if (suspiciousPatterns.some(pattern => pattern)) {
    // Log suspicious activity but don't block (might be legitimate)
    try {
      await supabase.rpc('log_security_event', {
        p_user_id: null,
        p_event_type: 'suspicious_activity',
        p_ip_address: ip,
        p_user_agent: userAgent,
        p_details: { endpoint, reason: 'Suspicious user agent or missing IP' },
      })
    } catch (error) {
      console.error('Error logging suspicious activity:', error)
    }
  }

  return {
    allowed: true,
    blocked: false,
    locked: false,
    rateLimited: false,
  }
}

/**
 * Log security events for monitoring
 */
export async function logSecurityEvent(
  userId: string | null,
  eventType: 'failed_login' | 'successful_login' | 'account_locked' | 'password_reset' | 'suspicious_activity',
  ipAddress: string,
  userAgent: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_event_type: eventType,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_details: details,
    })
  } catch (error) {
    console.error('Error logging security event:', error)
  }
}

/**
 * Check if email is banned from signup
 */
export async function checkEmailBan(email: string): Promise<{
  banned: boolean
  reason?: string
}> {
  try {
    const { data: banRecord, error } = await supabase
      .from('banned_emails')
      .select('ban_reason')
      .eq('email', email.toLowerCase())
      .is('expires_at', null) // Permanent ban
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking email ban:', error)
      return { banned: false }
    }

    if (banRecord) {
      return {
        banned: true,
        reason: banRecord.ban_reason || 'Email has been banned from the platform',
      }
    }

    // Check temporary bans
    const { data: tempBanRecord } = await supabase
      .from('banned_emails')
      .select('ban_reason, expires_at')
      .eq('email', email.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tempBanRecord) {
      return {
        banned: true,
        reason: tempBanRecord.ban_reason || 'Email is temporarily banned',
      }
    }

    return { banned: false }
  } catch (error) {
    console.error('Error in checkEmailBan:', error)
    return { banned: false }
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Try different headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (clientIP) {
    return clientIP
  }

  return request.ip || 'unknown'
}