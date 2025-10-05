'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { LocationPermission } from './location-permission'
import { useAuth } from './auth-provider'

interface Location {
  lat: number
  lng: number
}

interface GeolocationContextType {
  location: Location | null
  locationPermission: 'idle' | 'requesting' | 'granted' | 'denied'
  requestLocation: () => Promise<void>
  updateLocation: (location: Location) => void
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined)

export function useGeolocation() {
  const context = useContext(GeolocationContext)
  if (context === undefined) {
    throw new Error('useGeolocation must be used within a GeolocationProvider')
  }
  return context
}

interface GeolocationProviderProps {
  children: ReactNode
}

export function GeolocationProvider({ children }: GeolocationProviderProps) {
  const { user, loading } = useAuth() // Get user from auth context
  const [location, setLocation] = useState<Location | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('location-permission') as any) || 'idle'
    }
    return 'idle'
  })
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false)

  // Check if we already have location permission on mount
  // ONLY if user is logged in AND not on admin portal
  useEffect(() => {
    // Don't request location if user is not logged in or still loading
    if (!user || loading || hasCheckedPermission) {
      return
    }

    // Don't request location for admin portal
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return
    }

    // If user already denied or granted, don't show dialog again
    const savedPermission = localStorage.getItem('location-permission')
    if (savedPermission === 'denied') {
      setPermissionStatus('denied')
      setHasCheckedPermission(true)
      return
    }

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          // Try to get current position
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              })
              setPermissionStatus('granted')
              localStorage.setItem('location-permission', 'granted')
            },
            () => {
              setPermissionStatus('denied')
              localStorage.setItem('location-permission', 'denied')
            },
            { timeout: 10000 }
          )
        } else if (result.state === 'denied') {
          setPermissionStatus('denied')
          localStorage.setItem('location-permission', 'denied')
        } else if (!savedPermission) {
          // Only show dialog if we haven't asked before
          setShowPermissionDialog(true)
        }
        setHasCheckedPermission(true)
      }).catch(() => {
        // Fallback for browsers that don't support permissions API
        if (!savedPermission) {
          setShowPermissionDialog(true)
        }
        setHasCheckedPermission(true)
      })
    } else {
      if (!savedPermission) {
        setShowPermissionDialog(true)
      }
      setHasCheckedPermission(true)
    }
  }, [user, loading, hasCheckedPermission])

  const requestLocation = async (): Promise<void> => {
    return new Promise((resolve) => {
      setShowPermissionDialog(true)
      // The promise will resolve when the user interacts with the permission dialog
      resolve()
    })
  }

  const handleLocationGranted = (newLocation: Location) => {
    setLocation(newLocation)
    setPermissionStatus('granted')
    localStorage.setItem('location-permission', 'granted')
    setShowPermissionDialog(false)
  }

  const handleLocationDenied = () => {
    setPermissionStatus('denied')
    localStorage.setItem('location-permission', 'denied')
    setShowPermissionDialog(false)
  }

  const updateLocation = (newLocation: Location) => {
    setLocation(newLocation)
  }

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 10) / 10 // Round to 1 decimal place
  }

  const value: GeolocationContextType = {
    location,
    locationPermission: permissionStatus,
    requestLocation,
    updateLocation,
    calculateDistance
  }

  return (
    <GeolocationContext.Provider value={value}>
      {showPermissionDialog ? (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <LocationPermission
            onLocationGranted={handleLocationGranted}
            onLocationDenied={handleLocationDenied}
          />
        </div>
      ) : (
        children
      )}
    </GeolocationContext.Provider>
  )
}