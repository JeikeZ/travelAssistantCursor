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
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Travel Assistant
            </h1>
            <p className="text-lg text-gray-600">
              Generate personalized packing lists for your perfect trip
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gray-300 border-0 rounded-2xl shadow-lg">
          <CardHeader className="pb-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Where are you headed?
              </h2>
              <p className="text-gray-700 text-sm">
                Tell us about your trip and we&apos;ll create a personalized packing list for you.
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-800">Destination</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Country"
                    value={formData.destinationCountry}
                    onChange={(e) => handleInputChange('destinationCountry', e.target.value)}
                    error={errors.destinationCountry}
                    className="bg-white border-gray-300 rounded-md"
                  />
                  <Input
                    placeholder="City"
                    value={formData.destinationCity}
                    onChange={(e) => handleInputChange('destinationCity', e.target.value)}
                    error={errors.destinationCity}
                    className="bg-white border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-800">Trip Duration</span>
                </div>
                <Select
                  options={[
                    { value: '', label: 'Select duration' },
                    { value: '1', label: '1 day' },
                    { value: '2', label: '2 days' },
                    { value: '3', label: '3 days' },
                    { value: '4', label: '4 days' },
                    { value: '5', label: '5 days' },
                    { value: '6', label: '6 days' },
                    { value: '7', label: '1 week' },
                    { value: '14', label: '2 weeks' },
                    { value: '21', label: '3 weeks' },
                    { value: '30', label: '1 month' },
                  ]}
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  error={errors.duration}
                  className="bg-white border-gray-300 rounded-md"
                />
              </div>

              {/* Trip Type */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-800">Trip Type</span>
                </div>
                <Select
                  options={[
                    { value: '', label: 'Select trip type' },
                    ...tripTypes.slice(1)
                  ]}
                  value={formData.tripType}
                  onChange={(e) => handleInputChange('tripType', e.target.value)}
                  error={errors.tripType}
                  className="bg-white border-gray-300 rounded-md"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg mt-6"
                disabled={isLoading}
              >
                {isLoading ? 'Generating Your Packing List...' : 'Create My Packing List!'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Location Specific</h3>
            <p className="text-sm text-gray-600">
              Get recommendations based on your destination&apos;s climate and customs
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Time Specific</h3>
            <p className="text-sm text-gray-600">
              We take into account for your trip length and activities
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Type Specific</h3>
            <p className="text-sm text-gray-600">
              Get tailored recommendations for your trip based on your trip type
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}