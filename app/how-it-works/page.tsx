import type { Metadata } from 'next'
import { Heart, Search, MessageCircle, Calendar, Sparkles, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How Lovento Works - Find Your Perfect Match in 4 Simple Steps',
  description: 'Discover how Lovento\'s AI-powered dating platform works. Create your profile, get smart matches, connect with compatible singles, and find meaningful relationships.',
  keywords: ['how lovento works', 'dating app guide', 'AI matching', 'find matches', 'online dating process'],
  openGraph: {
    title: 'How Lovento Works - Your Guide to Finding Love',
    description: 'Learn how our AI-powered platform helps you find compatible matches in just 4 simple steps.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'How Lovento Works',
    description: 'Find your perfect match with our simple 4-step process.',
  },
  alternates: {
    canonical: '/how-it-works',
  },
}

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: 'Create Your Profile',
      description: 'Tell us about yourself, your interests, and what you\'re looking for in a partner. Our detailed questionnaire helps us understand your preferences.',
      details: [
        'Upload photos and write a compelling bio',
        'Answer personality and preference questions',
        'Set your dating goals and deal-breakers',
        'Complete profile verification for safety'
      ]
    },
    {
      icon: Sparkles,
      title: 'AI Smart Matching',
      description: 'Our advanced AI analyzes your profile and behavior to find highly compatible matches based on shared values, interests, and relationship goals.',
      details: [
        'Compatibility scoring algorithm',
        'Behavioral analysis for better matches',
        'Continuous learning from your preferences',
        'Verified profiles for quality assurance'
      ]
    },
    {
      icon: Heart,
      title: 'Swipe & Connect',
      description: 'Browse through curated matches and connect with people who share your interests. Use super likes to show extra interest.',
      details: [
        'Daily curated match suggestions',
        'Super likes for special connections',
        'Advanced filters for precise matching',
        'See who liked you (Premium feature)'
      ]
    },
    {
      icon: MessageCircle,
      title: 'Build Meaningful Relationships',
      description: 'Start conversations with your matches and build genuine connections. Our platform provides tools to help relationships flourish.',
      details: [
        'Icebreaker conversation starters',
        'Video calling and voice messages',
        'Date planning suggestions',
        'Relationship guidance and tips'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Calendar className="w-16 h-16" />
          </div>
          <h1 className="text-5xl font-bold mb-4">How Lovento Works</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Finding love has never been easier. Our AI-powered platform guides you through
            a simple 4-step process to connect with compatible singles.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="mb-16">
              <div className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="lg:w-1/2">
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-purple-600 mb-1">Step {index + 1}</div>
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-8 text-center">
                    <div className="text-6xl mb-4">📱</div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Mobile-First Experience</h4>
                    <p className="text-gray-600">
                      Our app is designed for seamless dating on the go, with intuitive navigation and powerful features at your fingertips.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why Choose Lovento?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">AI-Powered Matching</h3>
              <p className="text-gray-600 text-sm">
                Advanced algorithms analyze compatibility for better matches than traditional dating apps.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Verified Profiles</h3>
              <p className="text-gray-600 text-sm">
                All profiles are verified to ensure safety and authenticity for genuine connections.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Smart Conversations</h3>
              <p className="text-gray-600 text-sm">
                AI-powered icebreakers and conversation starters help you connect meaningfully.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Match?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join millions of singles who have found love through our proven process.
            Your perfect match is just a few steps away.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100">
                Start Your Journey
              </Button>
            </Link>
            <Link href="/premium">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View Premium Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}