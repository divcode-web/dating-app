'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { Heart, X, Star, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGeolocation } from '@/components/geolocation-provider'

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

interface SwipeCardProps {
  profile: Profile
  onSwipe: (direction: 'left' | 'right' | 'up') => void
  onCardLeave: () => void
  isTop: boolean
}

export function SwipeCard({ profile, onSwipe, onCardLeave, isTop }: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { location, calculateDistance } = useGeolocation()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-30, 30])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5])

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false)
    const { offset, velocity } = info

    const swipeThreshold = 100
    const velocityThreshold = 500

    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
      if (offset.x > 0) {
        // Swipe right - Like
        onSwipe('right')
      } else if (offset.x < 0) {
        // Swipe left - Pass
        onSwipe('left')
      }
    } else if (Math.abs(offset.y) > swipeThreshold || Math.abs(velocity.y) > velocityThreshold) {
      if (offset.y < 0) {
        // Swipe up - Super like
        onSwipe('up')
      }
    }

    // Reset position
    x.set(0)
    y.set(0)
  }

  const handleLike = () => {
    onSwipe('right')
  }

  const handlePass = () => {
    onSwipe('left')
  }

  const handleSuperLike = () => {
    onSwipe('up')
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length)
  }

  return (
    <motion.div
      ref={cardRef}
      className="absolute w-full h-full"
      style={{ x, y, rotate, opacity }}
      drag={isTop}
      dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileHover={{ scale: isTop ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Photo */}
        <div className="relative h-3/4 bg-gray-200">
          {profile.photos.length > 0 ? (
            <img
              src={profile.photos[currentPhotoIndex]}
              alt={`${profile.name}'s photo`}
              className="w-full h-full object-cover"
              onClick={nextPhoto}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
              <div className="text-6xl text-gray-500">👤</div>
            </div>
          )}

          {/* Photo indicators */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {profile.photos.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentPhotoIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Online indicator */}
          {profile.isOnline && (
            <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          )}

          {/* Photo navigation */}
          {profile.photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevPhoto()
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextPhoto()
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-6 h-1/4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-800">{profile.name}</h3>
              <span className="text-xl text-gray-600">{profile.age}</span>
              {profile.isOnline && (
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              )}
            </div>

            <p className="text-gray-600 mb-3 line-clamp-2">{profile.bio}</p>

            {/* Distance */}
            <div className="flex items-center text-gray-500 text-sm mb-3">
              📍 {location ? calculateDistance(location.lat, location.lng, 40.7128, -74.0060).toFixed(1) : profile.distance} km away
            </div>

            {/* Interests */}
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 4).map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium"
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 4 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  +{profile.interests.length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isTop && (
            <div className="flex justify-center space-x-4 mt-4">
              <Button
                onClick={handlePass}
                className="w-14 h-14 rounded-full bg-red-100 hover:bg-red-200 border-2 border-red-300"
                size="icon"
              >
                <X className="w-6 h-6 text-red-600" />
              </Button>

              <Button
                onClick={handleSuperLike}
                className="w-14 h-14 rounded-full bg-blue-100 hover:bg-blue-200 border-2 border-blue-300"
                size="icon"
              >
                <Star className="w-6 h-6 text-blue-600" />
              </Button>

              <Button
                onClick={handleLike}
                className="w-14 h-14 rounded-full bg-green-100 hover:bg-green-200 border-2 border-green-300"
                size="icon"
              >
                <Heart className="w-6 h-6 text-green-600" />
              </Button>
            </div>
          )}
        </div>

        {/* Swipe indicators */}
        {isDragging && (
          <>
            {x.get() > 50 && (
              <div className="absolute top-8 left-8 transform -rotate-12">
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                  LIKE
                </div>
              </div>
            )}
            {x.get() < -50 && (
              <div className="absolute top-8 right-8 transform rotate-12">
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                  NOPE
                </div>
              </div>
            )}
            {y.get() < -50 && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                  SUPER LIKE
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}