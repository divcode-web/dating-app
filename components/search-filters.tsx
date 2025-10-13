'use client'

import { useState, useEffect } from 'react'
import { Filter, X, SlidersHorizontal, MapPin, Calendar, Users, Heart, Crown, Star, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'

interface SearchFiltersProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: SearchFilters) => void
  currentFilters: SearchFilters
}

export interface SearchFilters {
  ageRange: [number, number]
  distance: number
  interests: string[]
  gender: string
  hasPhoto: boolean
  isOnline: boolean
  // Advanced filters (Premium only)
  heightRange?: [number, number]
  education?: string[]
  occupation?: string[]
  smoking?: string[]
  drinking?: string[]
  religion?: string[]
  children?: string[]
  languages?: string[]
  relationshipType?: string[]
  verifiedOnly?: boolean
  premiumOnly?: boolean
}

const INTEREST_OPTIONS = [
  'Coffee', 'Hiking', 'Photography', 'Travel', 'Cooking', 'Music',
  'Reading', 'Fitness', 'Art', 'Movies', 'Gaming', 'Sports',
  'Dancing', 'Yoga', 'Pets', 'Food', 'Wine', 'Beach', 'Mountains'
]

const GENDER_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'non-binary', label: 'Non-binary' }
]

export function SearchFilters({ isOpen, onClose, onApplyFilters, currentFilters }: SearchFiltersProps) {
  const { user } = useAuth()
  const [filters, setFilters] = useState<SearchFilters>(currentFilters)
  const [hasAdvancedFilters, setHasAdvancedFilters] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleApplyFilters = () => {
    onApplyFilters(filters)
    onClose()
  }

  // Check if user has advanced filters access
  useEffect(() => {
    const checkAdvancedFiltersAccess = async () => {
      if (!user?.id) return

      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('subscription_tier_id, subscription_tiers(has_advanced_filters)')
          .eq('id', user.id)
          .single()

        const tierData = Array.isArray(data?.subscription_tiers)
          ? data.subscription_tiers[0]
          : data?.subscription_tiers

        setHasAdvancedFilters(tierData?.has_advanced_filters || false)
      } catch (error) {
        console.error('Error checking advanced filters access:', error)
      }
    }

    checkAdvancedFiltersAccess()
  }, [user?.id])

  const handleResetFilters = () => {
    const defaultFilters: SearchFilters = {
      ageRange: [18, 50],
      distance: 50,
      interests: [],
      gender: 'all',
      hasPhoto: false,
      isOnline: false,
      // Advanced filters
      heightRange: [140, 220],
      education: [],
      occupation: [],
      smoking: [],
      drinking: [],
      religion: [],
      children: [],
      languages: [],
      relationshipType: [],
      verifiedOnly: false,
      premiumOnly: false
    }
    setFilters(defaultFilters)
  }

  const toggleInterest = (interest: string) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              Search Filters
            </CardTitle>
            {hasAdvancedFilters && (
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
           {/* Age Range */}
           <div className="space-y-3">
             <Label className="flex items-center gap-2 text-gray-800 font-medium">
               <Calendar className="w-4 h-4" />
               Age Range: {filters.ageRange[0]} - {filters.ageRange[1]} years
             </Label>
            <Slider
              value={filters.ageRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value as [number, number] }))}
              max={80}
              min={18}
              step={1}
              className="w-full"
            />
          </div>

          {/* Distance */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-800 font-medium">
              <MapPin className="w-4 h-4" />
              Maximum Distance: {filters.distance} km
            </Label>
            <Slider
              value={[filters.distance]}
              onValueChange={(value) => setFilters(prev => ({ ...prev, distance: value[0] }))}
              max={500}
              min={1}
              step={5}
              className="w-full"
            />
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-800 font-medium">
              <Users className="w-4 h-4" />
              I'm interested in
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, gender: option.value }))}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    filters.gender === option.value
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-800 font-medium">
              <Heart className="w-4 h-4" />
              Shared Interests ({filters.interests.length} selected)
            </Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    filters.interests.includes(interest)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div className="space-y-3">
            <Label className="text-gray-800 font-medium">Additional Filters</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasPhoto}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasPhoto: e.target.checked }))}
                  className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Only show profiles with photos</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isOnline}
                  onChange={(e) => setFilters(prev => ({ ...prev, isOnline: e.target.checked }))}
                  className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Only show online users</span>
              </label>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          {hasAdvancedFilters && (
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
                <Crown className="w-3 h-3 text-yellow-500" />
              </Button>
            </div>
          )}

          {/* Advanced Filters Section */}
          {showAdvanced && hasAdvancedFilters && (
            <div className="space-y-6 pt-4 border-t border-gray-200">
              {/* Height Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-gray-800 font-medium">
                  📏 Height Range: {filters.heightRange?.[0] || 140} - {filters.heightRange?.[1] || 220} cm
                </Label>
                <Slider
                  value={filters.heightRange || [140, 220]}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, heightRange: value as [number, number] }))}
                  max={220}
                  min={140}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Education */}
              <div className="space-y-3">
                <Label className="text-gray-800 font-medium">🎓 Education Level</Label>
                <div className="flex flex-wrap gap-2">
                  {['High School', 'Some College', 'Bachelor\'s', 'Master\'s', 'PhD', 'Other'].map((edu) => (
                    <button
                      key={edu}
                      onClick={() => {
                        const current = filters.education || [];
                        setFilters(prev => ({
                          ...prev,
                          education: current.includes(edu)
                            ? current.filter(e => e !== edu)
                            : [...current, edu]
                        }));
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        (filters.education || []).includes(edu)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {edu}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occupation */}
              <div className="space-y-3">
                <Label className="text-gray-800 font-medium">💼 Occupation</Label>
                <div className="flex flex-wrap gap-2">
                  {['Student', 'Professional', 'Entrepreneur', 'Creative', 'Healthcare', 'Education', 'Tech', 'Other'].map((occ) => (
                    <button
                      key={occ}
                      onClick={() => {
                        const current = filters.occupation || [];
                        setFilters(prev => ({
                          ...prev,
                          occupation: current.includes(occ)
                            ? current.filter(o => o !== occ)
                            : [...current, occ]
                        }));
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        (filters.occupation || []).includes(occ)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lifestyle Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Smoking */}
                <div className="space-y-3">
                  <Label className="text-gray-800 font-medium">🚬 Smoking</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Never', 'Occasionally', 'Regularly'].map((smoke) => (
                      <button
                        key={smoke}
                        onClick={() => {
                          const current = filters.smoking || [];
                          setFilters(prev => ({
                            ...prev,
                            smoking: current.includes(smoke)
                              ? current.filter(s => s !== smoke)
                              : [...current, smoke]
                          }));
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          (filters.smoking || []).includes(smoke)
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {smoke}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drinking */}
                <div className="space-y-3">
                  <Label className="text-gray-800 font-medium">🍷 Drinking</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Never', 'Socially', 'Regularly'].map((drink) => (
                      <button
                        key={drink}
                        onClick={() => {
                          const current = filters.drinking || [];
                          setFilters(prev => ({
                            ...prev,
                            drinking: current.includes(drink)
                              ? current.filter(d => d !== drink)
                              : [...current, drink]
                          }));
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          (filters.drinking || []).includes(drink)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {drink}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Premium Filters */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <Label className="text-gray-800 font-medium flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Premium Filters
                </Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.verifiedOnly || false}
                      onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Verified profiles only
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.premiumOnly || false}
                      onChange={(e) => setFilters(prev => ({ ...prev, premiumOnly: e.target.checked }))}
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Premium members only
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}