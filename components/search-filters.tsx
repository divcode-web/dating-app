'use client'

import { useState } from 'react'
import { Filter, X, SlidersHorizontal, MapPin, Calendar, Users, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

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
  const [filters, setFilters] = useState<SearchFilters>(currentFilters)

  const handleApplyFilters = () => {
    onApplyFilters(filters)
    onClose()
  }

  const handleResetFilters = () => {
    const defaultFilters: SearchFilters = {
      ageRange: [18, 50],
      distance: 50,
      interests: [],
      gender: 'all',
      hasPhoto: false,
      isOnline: false
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
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Search Filters
          </CardTitle>
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