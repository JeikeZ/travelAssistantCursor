'use client'

import { useState, useCallback, memo } from 'react'
import { MapPin, Calendar, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { CitySearchInput } from '@/components/ui/CitySearchInput'
import { CityOption, TripData } from '@/types'
import { TRIP_TYPES, DURATION_OPTIONS } from '@/lib/constants'

interface TripFormProps {
  onSubmit: (tripData: TripData) => void
  isLoading?: boolean
}

interface FormData {
  destination: CityOption | null
  duration: string
  tripType: string
}

interface FormErrors {
  destination?: string
  duration?: string
  tripType?: string
}

export const TripForm = memo(function TripForm({ onSubmit, isLoading = false }: TripFormProps) {
  const [formData, setFormData] = useState<FormData>({
    destination: null,
    duration: '',
    tripType: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.destination) {
      newErrors.destination = 'Destination city is required'
    }
    if (!formData.duration || parseInt(formData.duration) < 1) {
      newErrors.duration = 'Duration must be at least 1 day'
    }
    if (!formData.tripType) {
      newErrors.tripType = 'Trip type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const tripData: TripData = {
      destinationCountry: formData.destination!.country,
      destinationCity: formData.destination!.name,
      destinationState: formData.destination!.admin1,
      destinationDisplayName: formData.destination!.displayName,
      duration: parseInt(formData.duration),
      tripType: formData.tripType as TripData['tripType'],
    }
    
    onSubmit(tripData)
  }, [formData, validateForm, onSubmit])

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const handleDestinationChange = useCallback((destination: CityOption | null) => {
    setFormData(prev => ({ ...prev, destination }))
    // Clear error when user selects a destination
    if (errors.destination) {
      setErrors(prev => ({ ...prev, destination: undefined }))
    }
  }, [errors.destination])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Destination */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Destination</span>
        </div>
        <CitySearchInput
          value={formData.destination}
          onChange={handleDestinationChange}
          placeholder="Search for your destination city or country..."
          error={errors.destination}
          className="bg-white border-gray-300 rounded-md"
        />
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Trip Duration</span>
        </div>
        <Select
          options={DURATION_OPTIONS}
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
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Trip Type</span>
        </div>
        <Select
          options={TRIP_TYPES}
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
        className="w-full bg-[#1E8FEB] hover:bg-[#1A7DD4] text-white font-semibold py-3 rounded-lg mt-6"
        disabled={isLoading}
      >
        {isLoading ? 'Generating Your Packing List...' : 'Create My Packing List!'}
      </Button>
    </form>
  )
})