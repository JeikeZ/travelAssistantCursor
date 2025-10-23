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
  }, [])

  const handleLogout = useCallback(() => {
    setCurrentUser(null)
    localStorage.removeItem('user')
    setIsAuthModalOpen(true)
  }, [])

  const handleTripSubmit = useCallback((tripData: TripData) => {
    if (!currentUser) {
      setIsAuthModalOpen(true)
      return
    }

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
  }, [router, currentUser, startTransition])

  return (
    <div className="min-h-screen bg-gray-200">
      <Header 
        title="Travel Assistant"
        subtitle="Generate personalized packing lists for your perfect trip"
      />

      {/* User Info Bar */}
      {currentUser && (
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Welcome{currentUser.is_guest ? '' : ' back'}, <span className="font-semibold">{currentUser.username}</span>
              {currentUser.is_guest && <span className="text-gray-500 ml-1">(Guest)</span>}!
            </p>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

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