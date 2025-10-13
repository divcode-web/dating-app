'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './button'

interface CloudflareCaptchaProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: (error: string) => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  className?: string
  resetKey?: string | number // For forcing reset
}

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, config: any) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      getResponse: (widgetId: string) => string
    }
  }
}

export function CloudflareCaptcha({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
  resetKey,
}: CloudflareCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Load Turnstile script
  useEffect(() => {
    if (typeof window === 'undefined' || !siteKey) return

    // Check if script is already loaded
    if (window.turnstile || document.querySelector('script[src*="turnstile"]')) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true

    script.onload = () => {
      setIsLoaded(true)
    }

    script.onerror = () => {
      onError?.('Failed to load CAPTCHA')
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup script if component unmounts before load
      if (!isLoaded && document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [siteKey, onError])

  // Render widget when script is loaded
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile || widgetIdRef.current) {
      return
    }

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: theme,
        size: size,
        callback: (token: string) => {
          setIsVerifying(false)
          onVerify(token)
        },
        'error-callback': (error: string) => {
          setIsVerifying(false)
          onError?.(error)
        },
        'expired-callback': () => {
          setIsVerifying(false)
          onExpire?.()
        },
      })

      widgetIdRef.current = widgetId
    } catch (error) {
      onError?.('Failed to render CAPTCHA')
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (error) {
          console.warn('Error removing CAPTCHA widget:', error)
        }
        widgetIdRef.current = null
      }
    }
  }, [isLoaded, siteKey, theme, size, onVerify, onError, onExpire])

  // Reset widget when resetKey changes
  useEffect(() => {
    if (widgetIdRef.current && window.turnstile && resetKey !== undefined) {
      try {
        window.turnstile.reset(widgetIdRef.current)
      } catch (error) {
        console.warn('Error resetting CAPTCHA widget:', error)
      }
    }
  }, [resetKey])

  const handleReset = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current)
        setIsVerifying(false)
      } catch (error) {
        console.warn('Error resetting CAPTCHA widget:', error)
      }
    }
  }

  if (!siteKey) {
    return (
      <div className={`flex items-center justify-center p-4 border border-red-200 bg-red-50 rounded-lg ${className}`}>
        <p className="text-red-600 text-sm">CAPTCHA configuration error</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        ref={containerRef}
        className="flex justify-center"
        style={{ minHeight: size === 'compact' ? '65px' : '75px' }}
      />

      {!isLoaded && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-sm text-gray-600">Loading security check...</span>
        </div>
      )}

      {isVerifying && (
        <div className="flex items-center justify-center p-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-blue-600">Verifying...</span>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="text-xs text-gray-500 hover:text-gray-700"
        disabled={!isLoaded || isVerifying}
      >
        Refresh security check
      </Button>
    </div>
  )
}

/**
 * Hook for managing CAPTCHA state
 */
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  const handleVerify = (newToken: string) => {
    setToken(newToken)
    setError(null)
    setIsVerified(true)
  }

  const handleError = (newError: string) => {
    setToken(null)
    setError(newError)
    setIsVerified(false)
  }

  const handleExpire = () => {
    setToken(null)
    setError(null)
    setIsVerified(false)
  }

  const reset = () => {
    setToken(null)
    setError(null)
    setIsVerified(false)
  }

  return {
    token,
    error,
    isVerified,
    handleVerify,
    handleError,
    handleExpire,
    reset,
  }
}