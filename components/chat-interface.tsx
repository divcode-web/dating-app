'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, MoreVertical, Phone, Video, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  isRead: boolean
}

interface ChatInterfaceProps {
  matchId: string
  matchName: string
  matchAvatar?: string
  isOnline?: boolean
  onBack: () => void
  isVisible: boolean
}

export function ChatInterface({
  matchId,
  matchName,
  matchAvatar,
  isOnline = false,
  onBack,
  isVisible
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'them',
      content: 'Hey! I saw we matched 😊',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      isRead: true
    },
    {
      id: '2',
      senderId: 'me',
      content: 'Hi! Yeah, I thought your profile looked really interesting!',
      timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
      isRead: true
    },
    {
      id: '3',
      senderId: 'them',
      content: 'Thanks! I love hiking and photography. What about you?',
      timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
      isRead: true
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Simulate typing indicator
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          // Add a new message from the other person
          const responses = [
            "That sounds amazing! Tell me more about your hobbies.",
            "I love that too! Have you been to any cool places recently?",
            "Sounds fun! What do you do for work?",
            "That's interesting! I'm also passionate about similar things."
          ]
          const randomResponse = responses[Math.floor(Math.random() * responses.length)]

          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            senderId: 'them',
            content: randomResponse,
            timestamp: new Date(),
            isRead: false
          }])
        }, 2000)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [messages.length, isVisible])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      content: newMessage,
      timestamp: new Date(),
      isRead: false
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Mark messages as read after sending
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.senderId === 'them' ? { ...msg, isRead: true } : msg
        )
      )
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 bg-white z-50 flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 flex items-center space-x-4 shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center space-x-3 flex-1">
            <div className="relative">
              {matchAvatar ? (
                <img
                  src={matchAvatar}
                  alt={matchName}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white font-bold">{matchName.charAt(0)}</span>
                </div>
              )}
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-lg">{matchName}</h3>
              <p className="text-sm text-pink-100">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.senderId === 'me'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
              }`}>
                <p className="text-sm">{message.content}</p>
                <div className={`text-xs mt-1 ${
                  message.senderId === 'me' ? 'text-pink-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                  {message.senderId === 'me' && (
                    <span className="ml-1">
                      {message.isRead ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-12 py-3 rounded-full border-gray-300 focus:border-pink-300 focus:ring-pink-200"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="absolute right-1 top-1 w-8 h-8 rounded-full p-0 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-gray-300 hover:bg-gray-50"
            >
              <Heart className="w-5 h-5 text-pink-500" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}