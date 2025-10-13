import type { Metadata } from 'next'
import { HelpCircle, MessageCircle, Shield, CreditCard, Heart, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Help Center - Lovento Support & FAQ',
  description: 'Get help with your Lovento account. Find answers to common questions about profiles, matching, premium features, safety, and billing.',
  keywords: ['help center', 'support', 'FAQ', 'lovento help', 'dating app support', 'customer service'],
  openGraph: {
    title: 'Lovento Help Center - Get Support',
    description: 'Find answers to your questions and get help with your Lovento dating experience.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Lovento Help Center',
    description: 'Get help and support for your Lovento account.',
  },
  alternates: {
    canonical: '/help',
  },
}

export default function HelpPage() {
  const categories = [
    {
      icon: Settings,
      title: 'Account & Profile',
      description: 'Manage your profile, settings, and account preferences',
      topics: [
        'How to create and edit your profile',
        'Profile verification process',
        'Changing account settings',
        'Privacy and visibility options'
      ]
    },
    {
      icon: Heart,
      title: 'Matching & Dating',
      description: 'Learn how matching works and how to connect with others',
      topics: [
        'Understanding AI matching',
        'How to swipe and like profiles',
        'Super likes and boosts',
        'Managing matches and conversations'
      ]
    },
    {
      icon: CreditCard,
      title: 'Premium & Billing',
      description: 'Information about subscriptions and payments',
      topics: [
        'Premium features and benefits',
        'Subscription plans and pricing',
        'Payment methods and billing',
        'Cancelling or changing plans'
      ]
    },
    {
      icon: Shield,
      title: 'Safety & Privacy',
      description: 'Stay safe while using Lovento',
      topics: [
        'Safety tips for online dating',
        'Reporting inappropriate behavior',
        'Privacy settings and data protection',
        'Blocking and unmatching users'
      ]
    }
  ]

  const faqs = [
    {
      question: 'How does Lovento\'s AI matching work?',
      answer: 'Our AI analyzes your profile, preferences, and behavior to find highly compatible matches. It considers shared interests, values, relationship goals, and communication patterns to suggest the best potential partners.'
    },
    {
      question: 'Are profiles verified?',
      answer: 'Yes, all profiles undergo verification to ensure authenticity and safety. Verified users have a blue checkmark badge on their profile.'
    },
    {
      question: 'What are Super Likes?',
      answer: 'Super Likes are premium features that show extra interest in a profile. Recipients get notified immediately and see that you\'ve Super Liked them, increasing your chances of a match.'
    },
    {
      question: 'How do I report inappropriate behavior?',
      answer: 'You can report users directly from their profile or conversation. Go to the user\'s profile, tap the menu icon, and select "Report." Our moderation team reviews all reports within 24 hours.'
    },
    {
      question: 'Can I change my subscription plan?',
      answer: 'Yes, you can upgrade, downgrade, or cancel your subscription anytime from your account settings. Changes take effect at the next billing cycle.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <HelpCircle className="w-16 h-16" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Find answers to your questions and get the support you need to make the most of your Lovento experience.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Help Categories */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Browse by Category</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {category.topics.map((topic, i) => (
                    <li key={i} className="text-gray-700 flex items-start">
                      <span className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-xl opacity-90 mb-8">
              Our support team is here to help you with any questions or issues you might have.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Contact Support
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Live Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Quick Links</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/community-guidelines" className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <Shield className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Community Guidelines</h3>
              <p className="text-gray-600 text-sm">Learn about our community standards</p>
            </Link>

            <Link href="/safety-tips" className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <Heart className="w-8 h-8 text-pink-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Safety Tips</h3>
              <p className="text-gray-600 text-sm">Stay safe while dating online</p>
            </Link>

            <Link href="/premium" className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Premium Features</h3>
              <p className="text-gray-600 text-sm">Learn about premium benefits</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}