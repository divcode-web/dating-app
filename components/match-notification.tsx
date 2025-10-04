'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface MatchNotificationProps {
  isVisible: boolean
  matchedUser: {
    name: string
    age: number
    photos: string[]
  } | null
  onClose: () => void
  onSendMessage: () => void
  onKeepSwiping: () => void
}

export function MatchNotification({
  isVisible,
  matchedUser,
  onClose,
  onSendMessage,
  onKeepSwiping
}: MatchNotificationProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true)
      // Hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!matchedUser) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Match Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.6
              }}
              className="relative max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 text-white border-0 shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="text-center py-8 px-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="mb-4"
                    >
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-10 h-10 text-yellow-300" />
                      </div>
                      <h2 className="text-3xl font-bold mb-2">It's a Match! 💕</h2>
                      <p className="text-pink-100 text-lg">You and {matchedUser.name} liked each other</p>
                    </motion.div>
                  </div>

                  {/* Profile Preview */}
                  <div className="px-6 pb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white rounded-full overflow-hidden">
                          {matchedUser.photos.length > 0 ? (
                            <img
                              src={matchedUser.photos[0]}
                              alt={matchedUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 text-lg font-bold">
                                {matchedUser.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-white">{matchedUser.name}</h3>
                          <p className="text-pink-100">{matchedUser.age} years old</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={onSendMessage}
                        className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        Send a Message
                      </Button>

                      <Button
                        onClick={onKeepSwiping}
                        variant="outline"
                        className="w-full border-white/30 text-white hover:bg-white/10 font-semibold py-3 rounded-xl"
                      >
                        Keep Swiping
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>

          {/* Confetti Animation */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-40">
              {Array.from({ length: 50 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    rotate: 0,
                    scale: 0
                  }}
                  animate={{
                    y: window.innerHeight + 20,
                    rotate: 360,
                    scale: [0, 1, 0.8, 1]
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                  className="absolute w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}