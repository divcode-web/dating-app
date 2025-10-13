import type { Metadata } from 'next'
import { Heart, Users, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Lovento - Our Mission to Connect Hearts',
  description: 'Learn about Lovento\'s mission to revolutionize dating with AI-powered matching, verified profiles, and meaningful connections. Join millions finding love worldwide.',
  keywords: ['about lovento', 'dating app mission', 'AI dating', 'verified profiles', 'online dating platform'],
  openGraph: {
    title: 'About Lovento - Connecting Hearts Worldwide',
    description: 'Discover our story and mission to create meaningful relationships through innovative dating technology.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'About Lovento',
    description: 'Our mission to connect hearts through AI-powered dating.',
  },
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="w-16 h-16" />
          </div>
          <h1 className="text-5xl font-bold mb-4">About Lovento</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            We're on a mission to revolutionize modern dating by combining cutting-edge AI technology
            with genuine human connection, helping millions find their perfect match.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Our Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Our Story</h2>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Founded in 2024, Lovento was born from the belief that finding love shouldn't be complicated.
              In a world of endless swiping and superficial connections, we saw an opportunity to create
              something different – a dating platform that truly understands what makes relationships work.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Our team of relationship experts, data scientists, and technology innovators came together
              to build an app that doesn't just match people randomly, but intelligently connects individuals
              based on compatibility, shared values, and genuine chemistry.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Today, Lovento serves millions of users worldwide, helping them discover meaningful relationships
              that last. We're not just another dating app – we're your partner in finding true love.
            </p>
          </div>
        </div>

        {/* Our Values */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Authenticity</h3>
              <p className="text-gray-600">
                We believe in real connections built on genuine compatibility and shared values.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Safety First</h3>
              <p className="text-gray-600">
                Your safety and privacy are our top priorities, with advanced verification and security measures.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Innovation</h3>
              <p className="text-gray-600">
                We leverage cutting-edge AI and technology to create better matching experiences.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Community</h3>
              <p className="text-gray-600">
                We're building a supportive community where everyone can find their perfect match.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-8">Lovento by the Numbers</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold mb-2">10M+</div>
                <div className="text-pink-100">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500K+</div>
                <div className="text-pink-100">Successful Matches</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">150+</div>
                <div className="text-pink-100">Countries Served</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Ready to Find Your Match?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join millions of singles who have found love on Lovento.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                Get Started
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="lg" variant="outline">
                Read Success Stories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}