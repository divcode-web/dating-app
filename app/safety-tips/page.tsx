import type { Metadata } from 'next'
import { Shield, AlertTriangle, Eye, MessageSquare, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Safety Tips - Stay Safe While Dating Online',
  description: 'Learn essential safety tips for online dating on Lovento. Protect your privacy, recognize red flags, and enjoy safe, meaningful connections.',
  keywords: ['safety tips', 'online dating safety', 'dating red flags', 'privacy protection', 'safe dating'],
  openGraph: {
    title: 'Online Dating Safety Tips - Lovento',
    description: 'Essential safety guidelines for safe and enjoyable online dating experiences.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Dating Safety Tips',
    description: 'Stay safe while finding love online.',
  },
  alternates: {
    canonical: '/safety-tips',
  },
}

export default function SafetyTipsPage() {
  const safetyTips = [
    {
      icon: Eye,
      title: 'Trust Your Instincts',
      tips: [
        'If something feels off, it probably is',
        'Don\'t ignore red flags or gut feelings',
        'Take your time getting to know someone',
        'Never feel pressured to meet before you\'re ready'
      ]
    },
    {
      icon: Shield,
      title: 'Protect Your Privacy',
      tips: [
        'Never share personal information too soon',
        'Use a separate email for dating accounts',
        'Be cautious with sharing your location',
        'Keep social media profiles private during initial dating'
      ]
    },
    {
      icon: MessageSquare,
      title: 'Communication Safety',
      tips: [
        'Move conversations to Lovento before sharing contact info',
        'Be wary of users who avoid video calls',
        'Don\'t send money to anyone you haven\'t met in person',
        'Report suspicious behavior immediately'
      ]
    },
    {
      icon: MapPin,
      title: 'Meeting Safely',
      tips: [
        'Always meet in public places for first dates',
        'Tell a friend or family member your plans',
        'Drive yourself or use trusted transportation',
        'Consider bringing a friend on early dates'
      ]
    }
  ]

  const redFlags = [
    'Asks for money or financial help',
    'Avoids showing their face in photos',
    'Pushes for immediate commitment',
    'Makes inconsistent statements',
    'Pressures you to meet quickly',
    'Doesn\'t want to video call',
    'Claims to be in another country but nearby',
    'Has no social media presence'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Shield className="w-16 h-16" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Your Safety Matters</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            At Lovento, your safety is our top priority. Learn how to stay safe while finding meaningful connections online.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Safety Tips Grid */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Essential Safety Tips</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {safetyTips.map((category, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                </div>
                <ul className="space-y-3">
                  {category.tips.map((tip, i) => (
                    <li key={i} className="flex items-start text-gray-700">
                      <span className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Red Flags */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-red-900">Red Flags to Watch For</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {redFlags.map((flag, index) => (
                <div key={index} className="flex items-start text-red-800">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  {flag}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Info */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Lovento Verification</h2>
              <p className="text-lg text-gray-700">
                We take safety seriously with our comprehensive verification process
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phone Verification</h3>
                <p className="text-gray-600 text-sm">All users verify their phone number</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📸</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Photo Verification</h3>
                <p className="text-gray-600 text-sm">Real photos confirmed by our team</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Safety Monitoring</h3>
                <p className="text-gray-600 text-sm">24/7 moderation and reporting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Phone className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Emergency Resources</h2>
              <p className="text-lg text-gray-700">
                If you ever feel unsafe or need immediate help
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 mb-2">United States</h3>
                <p className="text-blue-800 mb-3">National Domestic Violence Hotline</p>
                <p className="text-2xl font-bold text-blue-600">1-800-799-7233</p>
                <p className="text-sm text-blue-700 mt-2">Available 24/7</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="font-bold text-purple-900 mb-2">International</h3>
                <p className="text-purple-800 mb-3">Local emergency services</p>
                <p className="text-2xl font-bold text-purple-600">Emergency (911)</p>
                <p className="text-sm text-purple-700 mt-2">Call your local emergency number</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Report Safety Concerns</h2>
          <p className="text-xl text-gray-600 mb-8">
            If you encounter suspicious behavior or feel unsafe, please report it immediately.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
              Report an Issue
            </Button>
            <Link href="/help">
              <Button size="lg" variant="outline">
                Get More Help
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}