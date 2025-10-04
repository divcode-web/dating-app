'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LocationPermissionProps {
  onLocationGranted: (location: { lat: number; lng: number }) => void
  onLocationDenied: () => void
}

export function LocationPermission({ onLocationGranted, onLocationDenied }: LocationPermissionProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle')
  const [error, setError] = useState<string>('')

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setError('Geolocation is not supported by this browser')
      return
    }

    setStatus('requesting')

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      setStatus('granted')
      onLocationGranted(location)
    } catch (err: any) {
      setStatus('denied')
      setError(err.message || 'Unable to get your location')
      onLocationDenied()
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <MapPin className="w-8 h-8 text-blue-500" />
      case 'requesting':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      case 'granted':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'denied':
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      default:
        return <MapPin className="w-8 h-8 text-blue-500" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'idle':
        return {
          title: 'Enable Location Services',
          description: 'Allow us to find people near you for better matches'
        }
      case 'requesting':
        return {
          title: 'Getting Your Location...',
          description: 'Please wait while we find your location'
        }
      case 'granted':
        return {
          title: 'Location Enabled!',
          description: 'Great! Now you can discover people nearby'
        }
      case 'denied':
        return {
          title: 'Location Access Denied',
          description: 'You can still use the app, but location-based features will be limited'
        }
      case 'error':
        return {
          title: 'Location Error',
          description: error || 'Unable to get your location'
        }
      default:
        return {
          title: 'Enable Location Services',
          description: 'Allow us to find people near you for better matches'
        }
    }
  }

  const { title, description } = getStatusMessage()

  return (
    <Card className="max-w-md mx-auto border-0 shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {status === 'idle' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              We use your location to show you people nearby and improve your matching experience.
            </p>
            <div className="flex space-x-3">
              <Button onClick={requestLocation} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                Allow Location Access
              </Button>
              <Button variant="outline" onClick={onLocationDenied} className="flex-1">
                Skip for Now
              </Button>
            </div>
          </div>
        )}

        {status === 'requesting' && (
          <div className="py-4">
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Detecting your location...</span>
            </div>
          </div>
        )}

        {status === 'granted' && (
          <div className="space-y-3">
            <div className="text-green-600 font-medium">
              ✓ Location access granted
            </div>
            <Button onClick={onLocationDenied} className="w-full">
              Continue to App
            </Button>
          </div>
        )}

        {(status === 'denied' || status === 'error') && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Don't worry! You can still use the app and enable location later in settings.
            </div>
            <Button onClick={onLocationDenied} className="w-full">
              Continue Without Location
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          Your location data is used only to find nearby matches and is never shared with other users.
        </div>
      </CardContent>
    </Card>
  )
}