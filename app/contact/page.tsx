import type { Metadata } from 'next'
import { Mail, Phone, MapPin, MessageCircle, Clock, Send, Shield, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch with Lovento Support',
  description: 'Need help? Contact Lovento support team. We\'re here to help with account issues, dating advice, and any questions about our platform.',
  keywords: ['contact lovento', 'support', 'customer service', 'help', 'dating app support'],
  openGraph: {
    title: 'Contact Lovento Support',
    description: 'Get help from our friendly support team. We\'re here to make your dating experience amazing.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Lovento',
    description: 'Reach out to our support team for help.',
  },
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactPage() {
  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      availability: '24/7 Available',
      action: 'Start Chat',
      primary: true
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message about your issue',
      availability: 'Response within 24 hours',
      action: 'Send Email',
      primary: false
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our support specialists',
      availability: 'Mon-Fri 9AM-6PM PST',
      action: 'Call Now',
      primary: false
    }
  ]

  const offices = [
    {
      city: 'San Francisco',
      address: '123 Tech Street, San Francisco, CA 94105',
      phone: '+1 (555) 123-LOVE',
      email: 'sf@loventodate.com'
    },
    {
      city: 'New York',
      address: '456 Love Avenue, New York, NY 10001',
      phone: '+1 (555) 456-LOVE',
      email: 'ny@loventodate.com'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <MessageCircle className="w-16 h-16" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            We're here to help make your Lovento experience amazing. Get in touch with our friendly support team.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Contact Methods */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How Can We Help?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <div key={index} className={`bg-white rounded-2xl shadow-xl p-8 text-center ${method.primary ? 'ring-2 ring-pink-500' : ''}`}>
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <method.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{method.title}</h3>
                <p className="text-gray-600 mb-4">{method.description}</p>
                <div className="flex items-center justify-center mb-6">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">{method.availability}</span>
                </div>
                <Button
                  className={method.primary ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700' : ''}
                  variant={method.primary ? 'default' : 'outline'}
                  size="lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {method.action}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Send Us a Message</h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Your last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                  <option>General Inquiry</option>
                  <option>Account Support</option>
                  <option>Technical Issue</option>
                  <option>Billing Question</option>
                  <option>Safety Concern</option>
                  <option>Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Tell us how we can help you..."
                />
              </div>
              <div className="text-center">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Office Locations */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Our Offices</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {offices.map((office, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-start mb-6">
                  <MapPin className="w-6 h-6 text-pink-600 mr-3 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{office.city} Office</h3>
                    <p className="text-gray-600 mb-3">{office.address}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-700">
                        <Phone className="w-4 h-4 mr-2" />
                        {office.phone}
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Mail className="w-4 h-4 mr-2" />
                        {office.email}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Quick Links */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Quick Help</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/help" className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Help Center</h3>
              <p className="text-gray-600 text-sm">Browse FAQs</p>
            </Link>

            <Link href="/safety-tips" className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Safety Tips</h3>
              <p className="text-gray-600 text-sm">Stay safe online</p>
            </Link>

            <Link href="/community-guidelines" className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <Heart className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Guidelines</h3>
              <p className="text-gray-600 text-sm">Community rules</p>
            </Link>

            <Link href="/blog" className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <Send className="w-8 h-8 text-pink-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Blog</h3>
              <p className="text-gray-600 text-sm">Latest articles</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}