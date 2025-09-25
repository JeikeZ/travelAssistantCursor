'use client'

import { memo } from 'react'
import { MapPin, Calendar, Briefcase, LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: MapPin,
    title: 'Location Specific',
    description: "Get recommendations based on your destination's climate and customs"
  },
  {
    icon: Calendar,
    title: 'Time Specific',
    description: 'We take into account for your trip length and activities'
  },
  {
    icon: Briefcase,
    title: 'Type Specific',
    description: 'Get tailored recommendations for your trip based on your trip type'
  }
]

export const FeatureSection = memo(function FeatureSection() {
  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      {FEATURES.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))}
    </div>
  )
})

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

const FeatureCard = memo(function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">
        {description}
      </p>
    </div>
  )
})