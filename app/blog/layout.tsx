import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dating Blog - Lovento | Tips, Stories & Relationship Advice',
  description: 'Read expert dating advice, success stories, and relationship tips on Lovento\'s blog. Get insights on modern dating, AI matching, and finding meaningful connections.',
  keywords: ['dating blog', 'relationship advice', 'dating tips', 'love stories', 'online dating', 'lovento blog', 'dating success stories'],
  openGraph: {
    title: 'Lovento Dating Blog - Expert Relationship Advice',
    description: 'Discover dating tips, success stories, and relationship guidance from Lovento\'s comprehensive blog.',
    type: 'website',
    images: [
      {
        url: '/lovento-logo.png',
        width: 1200,
        height: 630,
        alt: 'Lovento Dating Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lovento Dating Blog',
    description: 'Expert dating advice and relationship tips from Lovento.',
    images: ['/lovento-logo.png'],
  },
  alternates: {
    canonical: '/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}