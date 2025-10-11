'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Heart, Mail, Lock, User, UserPlus, Calendar, MapPin, Camera, ExternalLink, Gift } from 'lucide-react'
import toast from 'react-hot-toast'

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('signin')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [signUpStep, setSignUpStep] = useState(1) // Multi-step form

  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth()

  const handleNextStep = () => {
    // Step 1: Email & Password validation
    if (signUpStep === 1) {
      if (!email || !password || !confirmPassword) {
        toast.error('Please fill in all fields')
        return
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      setSignUpStep(2)
    }
    // Step 2: Profile info validation
    else if (signUpStep === 2) {
      if (!fullName || !age || !gender || !bio.trim()) {
        toast.error('Please fill in all required fields')
        return
      }
      const ageNum = parseInt(age)
      if (ageNum < 18 || ageNum > 100) {
        toast.error('Please enter a valid age (18-100)')
        return
      }
      setSignUpStep(3)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Only proceed if on step 3
    if (signUpStep !== 3) {
      return
    }

    if (!email || !password || !fullName || !age || !gender || !bio.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    const ageNum = parseInt(age)
    if (ageNum < 18 || ageNum > 100) {
      toast.error('Please enter a valid age (18-100)')
      return
    }

    if (!acceptedTerms) {
      toast.error('Please accept the Terms & Conditions to continue')
      return
    }

    setIsLoading(true)
    try {
      // Check if email is permanently banned (only if table exists)
      const { data: bannedEmail, error: banCheckError } = await supabase
        .from('banned_emails')
        .select('ban_reason')
        .eq('email', email.toLowerCase())
        .single()

      // If table doesn't exist, ignore error and continue
      if (bannedEmail && !banCheckError) {
        toast.error('This email has been permanently banned from the platform.')
        setIsLoading(false)
        return
      }

      const profileData = {
        full_name: fullName,
        age: ageNum,
        gender,
        bio: bio.trim(),
        location: location.trim() || null,
        interests: interests.length > 0 ? interests : null,
      }

      const { error, data } = await signUp(email, password, profileData)
      if (error) {
        toast.error(error.message)
      } else {
        // If promo code provided, redeem it
        if (promoCode.trim() && data?.user?.id) {
          try {
            const promoResponse = await fetch('/api/promo/redeem', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.user.id,
                promoCode: promoCode.trim(),
              }),
            })

            const promoResult = await promoResponse.json()
            if (promoResult.success) {
              toast.success(`🎉 ${promoResult.message}`)
            } else {
              toast.error(`Promo code error: ${promoResult.error}`)
            }
          } catch (promoError) {
            console.error('Promo redemption error:', promoError)
          }
        }

        toast.success('Account created! Please check your email to verify your account.')
        // Reset form
        setFullName('')
        setAge('')
        setGender('')
        setBio('')
        setLocation('')
        setInterests([])
        setAcceptedTerms(false)
        setPromoCode('')
        setSignUpStep(1)
        setActiveTab('signin')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    try {
      const { error } = await resetPassword(email)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password reset email sent!')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      const { error } = await signInWithGoogle()
      if (error) {
        toast.error(error.message)
        setIsLoading(false)
      }
      // Don't set loading to false here - user will be redirected
    } catch (error) {
      toast.error('Failed to sign in with Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="text-center lg:text-left">
            <div className="mb-6">
              <div className="flex items-center gap-1 mx-auto lg:mx-0 mb-6">
                <img
                  src="/lovento-icon.png"
                  alt="Lovento Logo"
                  className="h-16 w-auto object-contain"
                />
                <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  Lovento
                </h1>
              </div>
              <p className="text-xl text-gray-600 mb-6">
                Find your perfect match with our intelligent dating platform
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-pink-600 text-sm font-bold">1</span>
                </div>
                <span className="text-gray-700">Create your profile with photos and interests</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-bold">2</span>
                </div>
                <span className="text-gray-700">Swipe through compatible matches</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-sm font-bold">3</span>
                </div>
                <span className="text-gray-700">Chat and connect with your matches</span>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Why choose Lovento?</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Smart matching algorithm</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Real-time messaging</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span>Location-based discovery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Premium features</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="lg:hidden flex justify-center mb-4">
                <img
                  src="/lovento-icon.png"
                  alt="Lovento Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                {activeTab === 'signin' ? 'Welcome Back' : 'Join Lovento'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {activeTab === 'signin'
                  ? 'Sign in to continue your journey'
                  : 'Create your account and find love'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value)
                  // Reset sign-up step when switching tabs
                  if (value === 'signup') {
                    setSignUpStep(1)
                  }
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-gray-700">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Signing in...
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  {/* Step Indicator */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${signUpStep >= 1 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                      <div className={`w-12 h-1 transition-colors ${signUpStep >= 2 ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${signUpStep >= 2 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                      <div className={`w-12 h-1 transition-colors ${signUpStep >= 3 ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${signUpStep >= 3 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
                    </div>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    {/* Step 1: Email & Password */}
                    {signUpStep === 1 && (
                      <>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signup-email" className="text-gray-700">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-password" className="text-gray-700">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="signup-password"
                                type="password"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-gray-700">Confirm Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                        >
                          Next
                        </Button>

                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                          className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Sign up with Google
                        </Button>
                      </>
                    )}

                    {/* Step 2: Profile Information */}
                    {signUpStep === 2 && (
                      <>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="full-name" className="text-gray-700">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="full-name"
                                type="text"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="pl-10 h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="age" className="text-gray-700">Age</Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="age"
                                  type="number"
                                  placeholder="25"
                                  value={age}
                                  onChange={(e) => setAge(e.target.value)}
                                  className="pl-10 h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                                  min="18"
                                  max="100"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="gender" className="text-gray-700">Gender</Label>
                              <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger className="h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200">
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="non-binary">Non-binary</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location" className="text-gray-700">Location (Optional)</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="location"
                                type="text"
                                placeholder="City, Country"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="pl-10 h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bio" className="text-gray-700">Bio</Label>
                            <Textarea
                              id="bio"
                              placeholder="Tell us about yourself..."
                              value={bio}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                              className="min-h-[100px] border-gray-200 focus:border-pink-300 focus:ring-pink-200 resize-none"
                              maxLength={500}
                            />
                            <div className="text-xs text-gray-500 text-right">
                              {bio.length}/500 characters
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSignUpStep(1)}
                            className="w-full h-12 border-2 border-gray-200 hover:border-gray-300"
                          >
                            Back
                          </Button>
                          <Button
                            type="button"
                            onClick={handleNextStep}
                            className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                          >
                            Next
                          </Button>
                        </div>
                      </>
                    )}

                    {/* Step 3: Promo Code & Terms */}
                    {signUpStep === 3 && (
                      <>
                        <div className="space-y-4">
                          {/* Promo Code Field */}
                          <div className="space-y-2">
                            <Label htmlFor="promo-code" className="text-gray-700 flex items-center gap-2">
                              <Gift className="w-4 h-4 text-pink-500" />
                              Promo Code (Optional)
                            </Label>
                            <Input
                              id="promo-code"
                              type="text"
                              placeholder="Enter promo code if you have one"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              className="h-12 border-gray-200 focus:border-pink-300 focus:ring-pink-200 uppercase"
                            />
                          </div>

                          {/* Terms & Conditions Checkbox */}
                          <div className="flex items-start space-x-3 p-4 bg-pink-50 rounded-lg border border-pink-100">
                            <input
                              type="checkbox"
                              id="accept-terms"
                              checked={acceptedTerms}
                              onChange={(e) => setAcceptedTerms(e.target.checked)}
                              className="mt-1 w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                            />
                            <label htmlFor="accept-terms" className="text-sm text-gray-700 cursor-pointer">
                              I agree to the{' '}
                              <a
                                href="/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-600 hover:text-pink-700 font-medium underline inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Terms & Conditions
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              {' '}and{' '}
                              <a
                                href="/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-600 hover:text-pink-700 font-medium underline inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Privacy Policy
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSignUpStep(2)}
                            className="w-full h-12 border-2 border-gray-200 hover:border-gray-300"
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Creating account...
                              </div>
                            ) : (
                              'Create Account'
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}