import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/navigation'
import { Toaster } from 'react-hot-toast'
import { PWAUpdatePrompt } from '@/components/pwa-update-prompt'
import { CookieConsent } from '@/components/cookie-consent'
import { getOrganizationSchema, getWebSiteSchema, getWebApplicationSchema } from '@/lib/structured-data'

const inter = Inter({ subsets: ['latin'] })

// Force dynamic rendering to prevent hydration issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Lovento - Where Real Connections Begin | Premium Dating App',
  description: 'Discover meaningful relationships with Lovento. AI-powered matching, verified profiles, and advanced features help you find your perfect match. Join thousands of singles finding love today.',
  keywords: ['dating app', 'online dating', 'find love', 'relationships', 'matchmaking', 'singles', 'romance', 'dating site', 'meet singles', 'lovento', 'premium dating', 'AI matching', 'verified profiles'],
  authors: [{ name: 'Lovento Team' }],
  metadataBase: new URL('http://localhost:3004'),
  manifest: '/manifest.json',
  verification: {
    google: 'P4LuTSwFTmEpUxRp-7qUQV-1hiTIfAVv7NwUQItDefg',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/lovento-icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: '/lovento-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Lovento - Where Real Connections Begin',
    description: 'AI-powered dating platform connecting singles worldwide. Smart matching, verified profiles, and premium features for meaningful relationships.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Lovento',
    images: [
      {
        url: '/lovento-logo.png',
        width: 1200,
        height: 630,
        alt: 'Lovento - Premium Dating App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lovento - Premium Dating App',
    description: 'Find your perfect match with AI-powered smart matching and verified profiles. Join Lovento today!',
    images: ['/lovento-logo.png'],
    creator: '@lovento',
    site: '@lovento',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  category: 'social',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Generate structured data
  const organizationSchema = getOrganizationSchema()
  const websiteSchema = getWebSiteSchema()
  const webAppSchema = getWebApplicationSchema()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Suppress browser extension errors
            window.addEventListener('error', function(e) {
              if (e.message && e.message.includes('message channel closed')) {
                e.stopImmediatePropagation();
                return false;
              }
            });
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason && e.reason.message && e.reason.message.includes('message channel closed')) {
                e.stopImmediatePropagation();
                e.preventDefault();
              }
            });
          `
        }} />
      </head>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900`}>
        <PWAUpdatePrompt />
        <CookieConsent />
        <Providers>
          <div className="relative min-h-screen">
            <Navigation />
            <main className="pb-20">
              {children}
            </main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(139, 92, 246, 0.9)',
                color: '#fff',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              success: {
                style: {
                  background: 'rgba(16, 185, 129, 0.9)',
                },
              },
              error: {
                style: {
                  background: 'rgba(239, 68, 68, 0.9)',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}