'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SwipeCard } from './swipe-card'
import { MatchNotification } from './match-notification'
import { Button } from '@/components/ui/button'
import { RotateCcw, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  name: string
  age: number
  bio: string
  photos: string[]
  interests: string[]
  distance: number
  isOnline: boolean
}

interface SwipeDeckProps {
  profiles: Profile[]
  onSwipe: (profileId: string, direction: 'left' | 'right' | 'up') => void
  onRefresh: () => void
  isLoading?: boolean
}

export function SwipeDeck({ profiles, onSwipe, onRefresh, isLoading }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null)
  const [showMatchNotification, setShowMatchNotification] = useState(false)
  const [matchedUser, setMatchedUser] = useState<any>(null)

  // Mock match detection - in real app, this would come from backend
  const checkForMatch = (profileId: string, direction: 'left' | 'right' | 'up') => {
    if (direction === 'right') {
      // Simulate 30% chance of match when liking
      if (Math.random() < 0.3) {
        const profile = profiles.find(p => p.id === profileId)
        if (profile) {
          setMatchedUser(profile)
          setShowMatchNotification(true)
          return true
        }
      }
    }
    return false
  }

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= profiles.length) return

    const currentProfile = profiles[currentIndex]
    setSwipeDirection(direction)

    // Check for match before calling parent callback
    const isMatch = checkForMatch(currentProfile.id, direction)

    // Call the parent onSwipe callback
    onSwipe(currentProfile.id, direction)

    // Show appropriate toast message (only if not a match)
    if (!isMatch) {
      switch (direction) {
        case 'right':
          toast.success(`You liked ${currentProfile.name}!`)
          break
        case 'left':
          toast('You passed on ' + currentProfile.name)
          break
        case 'up':
          toast.success(`Super liked ${currentProfile.name}! ✨`)
          break
      }
    }

    // Move to next card after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 300)
  }

  const handleMatchClose = () => {
    setShowMatchNotification(false)
    setMatchedUser(null)
  }

  const handleSendMessage = () => {
    setShowMatchNotification(false)
    setMatchedUser(null)
    toast.success('Opening chat with ' + matchedUser.name)
    // Here you would navigate to chat or open chat modal
  }

  const handleKeepSwiping = () => {
    setShowMatchNotification(false)
    setMatchedUser(null)
  }

  const handleCardLeave = () => {
    // This is called when a card is swiped away
  }

  const handleRefresh = () => {
    setCurrentIndex(0)
    onRefresh()
    toast.success('Refreshing profiles...')
  }

  // Reset when profiles change
  useEffect(() => {
    setCurrentIndex(0)
  }, [profiles])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Finding matches...</p>
        </div>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">😔</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No more profiles</h3>
        <p className="text-gray-600 mb-6">Check back later for new matches!</p>
        <Button onClick={handleRefresh} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  const remainingCards = profiles.slice(currentIndex, currentIndex + 3)

  return (
    <>
      <div className="relative w-full max-w-sm mx-auto h-[600px]">
        {/* Card Stack */}
        <div className="relative w-full h-full">
          <AnimatePresence>
            {remainingCards.map((profile, index) => (
              <SwipeCard
                key={`${profile.id}-${currentIndex + index}`}
                profile={profile}
                onSwipe={handleSwipe}
                onCardLeave={handleCardLeave}
                isTop={index === 0}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0 border-gray-300"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <div className="text-sm text-gray-500">
            {Math.max(0, profiles.length - currentIndex)} left
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0 border-gray-300"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {Array.from({ length: Math.min(5, profiles.length) }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i < Math.min(5, profiles.length - currentIndex)
                  ? 'w-6 bg-gradient-to-r from-pink-500 to-purple-600'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Match Notification */}
      <MatchNotification
        isVisible={showMatchNotification}
        matchedUser={matchedUser}
        onClose={handleMatchClose}
        onSendMessage={handleSendMessage}
        onKeepSwiping={handleKeepSwiping}
      />
    </>
  )
}