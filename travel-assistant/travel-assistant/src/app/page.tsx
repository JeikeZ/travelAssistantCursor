'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

const tripTypes = [
  { value: '', label: 'Select trip type' },
  { value: 'business', label: 'Business' },
  { value: 'leisure', label: 'Leisure' },
  { value: 'beach', label: 'Beach Vacation' },
  { value: 'hiking', label: 'Hiking/Adventure' },
  { value: 'city', label: 'City Break' },
  { value: 'winter', label: 'Winter Sports' },
  { value: 'backpacking', label: 'Backpacking' },
]

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    destinationCountry: '',
    destinationCity: '',
    duration: '',
    tripType: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.destinationCountry.trim()) {
      newErrors.destinationCountry = 'Country is required'
    }
    if (!formData.destinationCity.trim()) {
      newErrors.destinationCity = 'City is required'
    }
    if (!formData.duration || parseInt(formData.duration) < 1) {
      newErrors.duration = 'Duration must be at least 1 day'
    }
    if (!formData.tripType) {
      newErrors.tripType = 'Trip type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      // Store trip data and navigate to packing list
      const tripData = {
        ...formData,
        duration: parseInt(formData.duration),
      }
      
      // Store in localStorage for now (in production, save to Supabase)
      localStorage.setItem('currentTrip', JSON.stringify(tripData))
      
      router.push('/packing-list')
    } catch (error) {
      console.error('Error creating trip:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Travel Assistant
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Generate personalized packing lists for your perfect trip
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Where are you headed?
              </h2>
              <p className="text-gray-600">
                Tell us about your trip and we&apos;ll create a personalized packing list for you
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Destination</span>
                  </div>
                  <Input
                    placeholder="Country"
                    value={formData.destinationCountry}
                    onChange={(e) => handleInputChange('destinationCountry', e.target.value)}
                    error={errors.destinationCountry}
                  />
                </div>
                <div className="space-y-2">
                  <div className="h-6"></div> {/* Spacer for alignment */}
                  <Input
                    placeholder="City"
                    value={formData.destinationCity}
                    onChange={(e) => handleInputChange('destinationCity', e.target.value)}
                    error={errors.destinationCity}
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Trip Duration</span>
                </div>
                <Input
                  type="number"
                  placeholder="Number of days"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  error={errors.duration}
                />
              </div>

              {/* Trip Type */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Trip Type</span>
                </div>
                <Select
                  options={tripTypes}
                  value={formData.tripType}
                  onChange={(e) => handleInputChange('tripType', e.target.value)}
                  error={errors.tripType}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Generating Your Packing List...' : 'Create My Packing List'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Location-Specific</h3>
            <p className="text-sm text-gray-600">
              Get recommendations based on your destination&apos;s climate and customs
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Duration-Aware</h3>
            <p className="text-sm text-gray-600">
              Tailored lists that account for your trip length and activities
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Never Forget</h3>
            <p className="text-sm text-gray-600">
              Essential items are highlighted so you never forget the important stuff
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}