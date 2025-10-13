import type { Metadata } from 'next'
import { Heart, Star, Users, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Success Stories - Real Love Stories from Lovento Users',
  description: 'Read inspiring success stories from couples who found love on Lovento. Real relationships, genuine connections, and happy endings shared by our community.',
  keywords: ['success stories', 'love stories', 'dating success', 'lovento couples', 'relationship stories', 'happy couples'],
  openGraph: {
    title: 'Lovento Success Stories - Real Love Found Here',
    description: 'Discover heartwarming stories of couples who met and fell in love on Lovento.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Lovento Success Stories',
    description: 'Real couples sharing their love stories from Lovento.',
  },
  alternates: {
    canonical: '/success-stories',
  },
}

export default function SuccessStoriesPage() {
  const stories = [
    {
      couple: 'Sarah & Michael',
      location: 'New York, NY',
      duration: 'Together 2 years',
      story: 'We matched on Lovento during a business trip. The AI matching was spot-on - we had so much in common! After our first date, we knew it was special. Now we\'re engaged and planning our wedding.',
      photo: '💑'
    },
    {
      couple: 'Emma & David',
      location: 'Los Angeles, CA',
      duration: 'Together 18 months',
      story: 'I was skeptical about dating apps until Lovento. The verification process made me feel safe, and the compatibility matching was incredible. We share the same values and life goals.',
      photo: '👩‍❤️‍👨'
    },
    {
      couple: 'James & Lisa',
      location: 'Chicago, IL',
      duration: 'Together 3 years',
      story: 'Lovento\'s premium features helped us connect deeply. The conversation starters were perfect for breaking the ice, and now we have two beautiful children together.',
      photo: '👨‍👩‍👧‍👦'
    },
    {
      couple: 'Maria & Carlos',
      location: 'Miami, FL',
      duration: 'Together 1 year',
      story: 'As immigrants, we were looking for someone who understood our culture. Lovento matched us perfectly - we speak the same language and share the same traditions.',
      photo: '💃🕺'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Heart className="w-16 h-16" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Success Stories</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Real love stories from real people who found their perfect match on Lovento.
            These are the happy endings that make all the swiping worthwhile.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Stats */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">500K+</div>
              <div className="text-gray-600">Happy Couples</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">10M+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">150+</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">4.9★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Their Stories</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {stories.map((story, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{story.photo}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{story.couple}</h3>
                  <div className="flex items-center justify-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {story.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {story.duration}
                    </span>
                  </div>
                </div>
                <blockquote className="text-gray-700 italic text-lg leading-relaxed">
                  "{story.story}"
                </blockquote>
                <div className="flex justify-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">What Our Couples Say</h2>
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-8">
              <blockquote className="text-lg text-gray-700 italic mb-4">
                "Lovento didn't just help us find each other – it helped us find ourselves. The platform encouraged us to be authentic and open about what we really wanted in a relationship."
              </blockquote>
              <cite className="text-gray-900 font-semibold">- Rachel & Tom, Boston</cite>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8">
              <blockquote className="text-lg text-gray-700 italic mb-4">
                "After years of unsuccessful dating, Lovento's AI matching finally connected me with someone who truly gets me. We're getting married next month!"
              </blockquote>
              <cite className="text-gray-900 font-semibold">- Jennifer & Mark, Seattle</cite>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8">
              <blockquote className="text-lg text-gray-700 italic mb-4">
                "The safety features and verification process gave us peace of mind. We could focus on building our relationship instead of worrying about red flags."
              </blockquote>
              <cite className="text-gray-900 font-semibold">- Amanda & Chris, Denver</cite>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Your Success Story Starts Here</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of happy couples who found love on Lovento.
            Your perfect match is waiting to be discovered.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100">
                Find Your Match
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Read More Stories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}