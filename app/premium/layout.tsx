import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Premium Dating Plans - Lovento | Upgrade Your Love Life',
  description: 'Unlock premium features on Lovento: unlimited swipes, AI matching, priority support, and more. Choose from Basic, Standard, or VIP plans to find your perfect match faster.',
  keywords: ['premium dating', 'dating subscription', 'lovento premium', 'unlimited swipes', 'AI matching', 'dating upgrade', 'paid dating'],
  openGraph: {
    title: 'Upgrade to Premium - Lovento Dating',
    description: 'Get unlimited swipes, AI-powered matching, and premium features to find your perfect match.',
    type: 'website',
    images: [
      {
        url: '/lovento-logo.png',
        width: 1200,
        height: 630,
        alt: 'Lovento Premium Dating',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lovento Premium Plans',
    description: 'Upgrade your dating experience with premium features.',
    images: ['/lovento-logo.png'],
  },
  alternates: {
    canonical: '/premium',
  },
}

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}