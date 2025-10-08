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
  const [showMore, setShowMore] = useState(false)
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
        {/* Photo - Full card */}
        <div className="relative w-full h-full bg-gray-200">
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

          {/* User Info Overlay - Bottom of Photo */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white transition-all duration-300 ${
              showMore ? 'p-6 max-h-[70%] overflow-y-auto' : 'p-6'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-2xl md:text-3xl font-bold">{profile.name}</h3>
                <span className="text-xl md:text-2xl">{profile.age}</span>
                {profile.isOnline && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </div>
              <button
                onClick={() => setShowMore(!showMore)}
                className="text-xs px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
              >
                {showMore ? 'Show Less' : 'Show More'}
              </button>
            </div>

            {/* Distance */}
            <div className="flex items-center text-white/90 text-sm mb-2">
              📍 {location ? calculateDistance(location.lat, location.lng, 40.7128, -74.0060).toFixed(1) : profile.distance} km away
            </div>

            <p className={`text-white/90 mb-3 text-sm ${showMore ? '' : 'line-clamp-2'}`}>{profile.bio}</p>

            {/* Interests */}
            <div className="flex flex-wrap gap-2 mb-3">
              {(showMore ? profile.interests : profile.interests.slice(0, 3)).map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium"
                >
                  {interest}
                </span>
              ))}
              {!showMore && profile.interests.length > 3 && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                  +{profile.interests.length - 3}
                </span>
              )}
            </div>

            {/* Extended Info - Show when expanded */}
            {showMore && (
              <div className="space-y-3 text-sm border-t border-white/20 pt-3">
                {(profile as any).height && (
                  <div className="flex items-center">
                    <span className="text-white/70 w-24">Height:</span>
                    <span>{(profile as any).height} cm</span>
                  </div>
                )}
                {(profile as any).education && (
                  <div className="flex items-center">
                    <span className="text-white/70 w-24">Education:</span>
                    <span>{(profile as any).education}</span>
                  </div>
                )}
                {(profile as any).occupation && (
                  <div className="flex items-center">
                    <span className="text-white/70 w-24">Work:</span>
                    <span>{(profile as any).occupation}</span>
                  </div>
                )}
                {(profile as any).religion && (
                  <div className="flex items-center">
                    <span className="text-white/70 w-24">Religion:</span>
                    <span>{(profile as any).religion}</span>
                  </div>
                )}
                {(profile as any).smoking && (
                  <div className="flex items-center">
                    <span className="text-white/70 w-24">Smoking:</span>
                    <span>{(profile as any).smoking}</span>
                  </div>
                )}
                {(profile as any).drinking && (
                  <div className="flex items-center">
                    <span className="text-white/70 w-24">Drinking:</span>
                    <span>{(profile as any).drinking}</span>
                  </div>
                )}

                {/* Spotify Top Artists */}
                {(profile as any).spotify_top_artists && (profile as any).spotify_top_artists.length > 0 && (
                  <div className="border-t border-white/20 pt-3">
                    <p className="text-white/70 mb-2 text-xs">🎵 TOP ARTISTS</p>
                    <div className="flex flex-wrap gap-1">
                      {(profile as any).spotify_top_artists.map((artist: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-green-500/20 text-green-200 rounded-full text-xs">
                          {artist}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spotify Anthem */}
                {(profile as any).spotify_anthem && (
                  <div className="border-t border-white/20 pt-3">
                    <p className="text-white/70 mb-2 text-xs">🎵 ANTHEM</p>
                    <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                      {(profile as any).spotify_anthem.album_image && (
                        <img
                          src={(profile as any).spotify_anthem.album_image}
                          alt="Album"
                          className="w-10 h-10 rounded"
                        />
                      )}
                      <div>
                        <p className="text-white text-xs font-medium">{(profile as any).spotify_anthem.track_name}</p>
                        <p className="text-white/70 text-xs">{(profile as any).spotify_anthem.artist_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Favorite Books */}
                {(profile as any).favorite_books && (profile as any).favorite_books.length > 0 && (
                  <div className="border-t border-white/20 pt-3">
                    <p className="text-white/70 mb-2 text-xs">📚 FAVORITE BOOKS</p>
                    <div className="space-y-2">
                      {(profile as any).favorite_books.slice(0, 2).map((book: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                          {book.cover && (
                            <img src={book.cover} alt={book.title} className="w-6 h-9 object-cover rounded" />
                          )}
                          <div>
                            <p className="text-white text-xs font-medium">{book.title}</p>
                            <p className="text-white/70 text-xs">{book.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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