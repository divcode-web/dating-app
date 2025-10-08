import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/navigation'
import { Toaster } from 'react-hot-toast'
import { PWAUpdatePrompt } from '@/components/pwa-update-prompt'
import { CookieConsent } from '@/components/cookie-consent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DatingApp - Find Your Perfect Match',
  description: 'A modern dating app to help you find meaningful connections',
  keywords: ['dating', 'relationships', 'matchmaking', 'love'],
  authors: [{ name: 'DatingApp Team' }],
  metadataBase: new URL('http://localhost:3004'),
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'DatingApp - Find Your Perfect Match',
    description: 'A modern dating app to help you find meaningful connections',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DatingApp - Find Your Perfect Match',
    description: 'A modern dating app to help you find meaningful connections',
  },
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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