'use client'

import { useState, useCallback, memo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { FeatureSection } from '@/components/layout/FeatureSection'
import { TripForm } from '@/components/forms/TripForm'
import { TripData } from '@/types'
import { STORAGE_KEYS } from '@/lib/constants'

// Memoized home page component for better performance
const HomePage = memo(function HomePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  const handleTripSubmit = useCallback((tripData: TripData) => {
    setIsLoading(true)
    
    startTransition(() => {
      try {
        // Store in localStorage for now (in production, save to Supabase)
        localStorage.setItem(STORAGE_KEYS.currentTrip, JSON.stringify(tripData))
        
        router.push('/packing-list')
      } catch (error) {
        console.error('Error creating trip:', error)
      } finally {
        setIsLoading(false)
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-200">
      <Header 
        title="Travel Assistant"
        subtitle="Generate personalized packing lists for your perfect trip"
      />

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
            <TripForm 
              onSubmit={handleTripSubmit}
              isLoading={isLoading || isPending}
            />
          </CardContent>
        </Card>

        <FeatureSection />
      </main>
    </div>
  )
})

export default function Home() {
  return <HomePage />
}