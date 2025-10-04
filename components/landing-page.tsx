'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from './footer'
import {
  Heart,
  Star,
  Shield,
  Users,
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle,
  MessageCircle,
  Camera,
  MapPin
} from 'lucide-react'

export function LandingPage() {
  const router = useRouter()
  const [showVideo, setShowVideo] = useState(false)

  const features = [
    {
      icon: Heart,
      title: 'Smart Matching',
      description: 'Our AI-powered algorithm finds your perfect match based on compatibility and preferences.'
    },
    {
      icon: MessageCircle,
      title: 'Real-time Chat',
      description: 'Connect instantly with matches through our secure messaging system.'
    },
    {
      icon: Camera,
      title: 'Photo Verification',
      description: 'Verified profiles ensure you\'re connecting with real people.'
    },
    {
      icon: MapPin,
      title: 'Location Based',
      description: 'Find matches in your area or expand your search globally.'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data is protected with enterprise-grade security.'
    },
    {
      icon: Sparkles,
      title: 'Premium Features',
      description: 'Unlock unlimited likes, see who liked you, and more.'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah M.',
      text: 'Found my soulmate here! The matching algorithm is incredible.',
      rating: 5
    },
    {
      name: 'Mike R.',
      text: 'Great app with amazing features. Highly recommend!',
      rating: 5
    },
    {
      name: 'Emma L.',
      text: 'Easy to use and the community is so welcoming.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DatingApp</h1>
                <p className="text-sm text-gray-500">Find your perfect match</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => router.push('/auth')} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Find Your
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"> Perfect Match</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Join millions of singles who have found love through our intelligent dating platform.
                Smart matching, real connections, lasting relationships.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => router.push('/auth')}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 text-lg"
                >
                  Start Dating Now
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowVideo(true)}
                  className="px-8 py-4 text-lg border-2"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>2M+ Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>500K+ Matches</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>4.8★ Rating</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-gradient-to-br from-pink-200 to-purple-200 rounded-3xl p-8 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=500"
                  alt="Happy couple"
                  className="w-full h-96 object-cover rounded-2xl"
                />
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-gray-800">Perfect Match!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose DatingApp?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We combine cutting-edge technology with human connection to create meaningful relationships.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Real stories from real people who found love</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <p className="font-semibold text-gray-900">- {testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Find Love?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join our community today and start your journey to finding the perfect match.
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/auth')}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
          >
            Create Your Profile
            <Heart className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              ✕ Close
            </button>
            <div className="bg-black rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-800 flex items-center justify-center">
                <div className="text-white text-center">
                  <Play className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl">Demo Video Coming Soon</p>
                  <p className="text-gray-400">Watch how easy it is to find love on DatingApp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}