import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login to Lovento - Find Your Perfect Match',
  description: 'Sign in to Lovento and start your journey to meaningful relationships. Join our AI-powered dating platform with verified profiles and smart matching.',
  keywords: ['login', 'signin', 'dating app', 'lovento', 'authentication', 'online dating'],
  openGraph: {
    title: 'Login to Lovento',
    description: 'Access your Lovento account and discover meaningful connections.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Login to Lovento',
    description: 'Sign in and find your perfect match on Lovento.',
  },
  alternates: {
    canonical: '/auth',
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}