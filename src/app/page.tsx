'use client'

import { useState, useCallback, memo, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { FeatureSection } from '@/components/layout/FeatureSection'
import { TripForm } from '@/components/forms/TripForm'
import { AuthModal } from '@/components/auth/AuthModal'
import { TripData, User } from '@/types'
import { STORAGE_KEYS } from '@/lib/constants'

// Memoized home page component for better performance
const HomePage = memo(function HomePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Check for existing user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('user')
      }
    } else {
      // Show auth modal if no user is logged in
      setIsAuthModalOpen(true)
    }
  }, [])

  const handleAuthSuccess = useCallback((user: User) => {
    setCurrentUser(user)
    setIsAuthModalOpen(false)
    
    // Force refresh to clear any cached data
    router.refresh()
  }, [router])

  const handleLogout = useCallback(async () => {
    try {
      // Call logout API to clear session cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error during logout:', error)
      // Continue with client-side logout even if API call fails
    }
    
    // Clear ALL localStorage (not just user)
    localStorage.clear()
    
    // Clear client-side state
    setCurrentUser(null)
    
    // Force refresh to clear cached data
    router.refresh()
    
    // Show auth modal
    setIsAuthModalOpen(true)
  }, [router])

  const handleTripSubmit = useCallback(async (tripData: TripData) => {
    if (!currentUser) {
      setIsAuthModalOpen(true)
      return
    }

    setIsLoading(true)
    
    try {
      // For non-guest users, save to database
      if (!currentUser.is_guest) {
        const response = await fetch('/api/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destinationCountry: tripData.destinationCountry,
            destinationCity: tripData.destinationCity,
            destinationState: tripData.destinationState,
            destinationDisplayName: tripData.destinationDisplayName,
            duration: tripData.duration,
            tripType: tripData.tripType,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.trip) {
            // Store trip ID in localStorage for the packing list page
            localStorage.setItem('currentTripId', data.trip.id)
            localStorage.setItem(STORAGE_KEYS.currentTrip, JSON.stringify(tripData))
            startTransition(() => {
              router.push('/packing-list')
            })
            return
          }
        }
      }
      
      // For guest users or if save fails, store in localStorage
      localStorage.setItem(STORAGE_KEYS.currentTrip, JSON.stringify(tripData))
      localStorage.removeItem('currentTripId')
      
      startTransition(() => {
        router.push('/packing-list')
      })
    } catch (error) {
      console.error('Error creating trip:', error)
      // Fallback to localStorage
      localStorage.setItem(STORAGE_KEYS.currentTrip, JSON.stringify(tripData))
      localStorage.removeItem('currentTripId')
      startTransition(() => {
        router.push('/packing-list')
      })
    } finally {
      setIsLoading(false)
    }
  }, [router, currentUser, startTransition])

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
      <Header 
        title="Travel Assistant"
        subtitle="Generate personalized packing lists for your perfect trip"
      />

      {/* User Info Bar */}
      {currentUser && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              Welcome{currentUser.is_guest ? '' : ' back'}, <span className="font-semibold">{currentUser.username}</span>
              {currentUser.is_guest && <span className="text-gray-600 dark:text-gray-400 ml-1">(Guest)</span>}!
            </p>
            <div className="flex items-center gap-4">
              {!currentUser.is_guest && (
                <button
                  onClick={() => router.push('/trips')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  My Trips
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest User Banner */}
      {currentUser && currentUser.is_guest && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 py-3">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-blue-900 dark:text-blue-200 text-center">
              💡 <span className="font-medium">Create an account</span> to save your trips permanently and access them from any device!
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gray-300 dark:bg-gray-800 border-0 rounded-2xl shadow-lg">
          <CardHeader className="pb-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Where are you headed?
              </h2>
              <p className="text-gray-800 dark:text-gray-200 text-sm">
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          if (currentUser) {
            setIsAuthModalOpen(false)
          }
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
})

export default function Home() {
  return <HomePage />
}