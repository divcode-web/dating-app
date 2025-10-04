'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { LandingPage } from '@/components/landing-page'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkUserProfile = async () => {
      if (user && !loading) {
        // Check if user has completed their profile
        const { data } = await supabase
          .from('user_profiles')
          .select('full_name, photos')
          .eq('id', user.id)
          .single();

        if (!data || !data.full_name || !data.photos?.length) {
          // New user - redirect to onboarding
          router.push('/onboarding');
        } else {
          // Existing user - redirect to home
          router.push('/home');
        }
      }
    };

    checkUserProfile();
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {!user && <LandingPage />}
    </div>
  )
}