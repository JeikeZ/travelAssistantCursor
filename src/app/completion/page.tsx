'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  Star, 
  Send, 
  ArrowLeft,
  Plane,
  Heart,
  ThumbsUp
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

export default function CompletionPage() {
  const router = useRouter()
  const [tripData, setTripData] = useState<{
    destinationCountry: string
    destinationCity: string
    duration: number
    tripType: string
  } | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState({
    missingItems: '',
    wouldRecommend: null as boolean | null,
    confidenceScore: 0,
    additionalFeedback: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => {
    // Get trip data from localStorage
    const storedTripData = localStorage.getItem('currentTrip')
    if (storedTripData) {
      setTripData(JSON.parse(storedTripData))
    }
  }, [])

  const handleStartNewTrip = () => {
    // Clear stored data
    localStorage.removeItem('currentTrip')
    localStorage.removeItem('currentPackingList')
    router.push('/')
  }

  const handleShowFeedback = () => {
    setShowFeedback(true)
  }

  const handleConfidenceScore = (score: number) => {
    setFeedback(prev => ({ ...prev, confidenceScore: score }))
  }

  const handleRecommendation = (recommend: boolean) => {
    setFeedback(prev => ({ ...prev, wouldRecommend: recommend }))
  }

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true)
    
    try {
      // In a real app, this would submit to your API/Supabase
      console.log('Feedback submitted:', feedback)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setFeedbackSubmitted(true)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValidFeedback = feedback.confidenceScore > 0 && feedback.wouldRecommend !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/packing-list')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to List</span>
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Ready to Travel!
              </h1>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showFeedback ? (
          <>
            {/* Completion Celebration */}
            <div className="text-center mb-12">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Star className="w-4 h-4 text-yellow-800 fill-current" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                You&apos;re All Set! 🎉
              </h2>
              <p className="text-xl text-slate-700 mb-8">
                Your packing list is complete and you&apos;re ready for your adventure
                {tripData && (
                  <span className="block mt-2 font-medium text-blue-600">
                    to {tripData.destinationCity}, {tripData.destinationCountry}
                  </span>
                )}
              </p>
            </div>

            {/* Trip Summary */}
            {tripData && (
              <Card className="mb-8 shadow-lg">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Plane className="w-5 h-5 mr-2 text-blue-600" />
                    Trip Summary
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-800">Destination:</span>
                      <p className="text-slate-900">{tripData.destinationCity}, {tripData.destinationCountry}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-800">Duration:</span>
                      <p className="text-slate-900">{tripData.duration} days</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-800">Trip Type:</span>
                      <p className="text-slate-900 capitalize">{tripData.tripType}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-800">Status:</span>
                      <p className="text-green-600 font-medium">✅ Ready to go!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleShowFeedback}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Heart className="w-5 h-5 mr-2" />
                Share Your Experience
              </Button>
              
              <Button
                onClick={handleStartNewTrip}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Plan Another Trip
              </Button>
            </div>

            {/* Safe Travels Message */}
            <div className="mt-12 text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Have an Amazing Trip! ✈️
              </h3>
              <p className="text-slate-700">
                Don&apos;t forget to double-check your essential items before leaving, 
                and have a wonderful time exploring {tripData?.destinationCity}!
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Feedback Form */}
            {!feedbackSubmitted ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <h3 className="text-2xl font-semibold text-gray-900 text-center">
                    Help Us Improve
                  </h3>
                  <p className="text-slate-700 text-center">
                    Your feedback helps us create better packing lists for everyone
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Confidence Score */}
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-3">
                      How confident do you feel about your packing? (1-10)
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleConfidenceScore(score)}
                          className={`w-10 h-10 rounded-lg border-2 font-medium transition-all ${
                            feedback.confidenceScore === score
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:border-blue-400'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-3">
                      Would you recommend this service to a friend or family member?
                    </label>
                    <div className="flex space-x-4">
                      <Button
                        variant={feedback.wouldRecommend === true ? 'primary' : 'outline'}
                        onClick={() => handleRecommendation(true)}
                        className="flex-1"
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Yes
                      </Button>
                      <Button
                        variant={feedback.wouldRecommend === false ? 'primary' : 'outline'}
                        onClick={() => handleRecommendation(false)}
                        className="flex-1"
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {/* Missing Items */}
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">
                      Was there anything we forgot that you would have liked to bring?
                    </label>
                    <Input
                      placeholder="e.g., sunglasses, umbrella, specific medications..."
                      value={feedback.missingItems}
                      onChange={(e) => setFeedback(prev => ({ ...prev, missingItems: e.target.value }))}
                    />
                  </div>

                  {/* Additional Feedback */}
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">
                      Any additional feedback? (optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none text-slate-900 placeholder:text-slate-500"
                      rows={3}
                      placeholder="Tell us how we can improve..."
                      value={feedback.additionalFeedback}
                      onChange={(e) => setFeedback(prev => ({ ...prev, additionalFeedback: e.target.value }))}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-4">
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={!isValidFeedback || isSubmitting}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowFeedback(false)}
                    >
                      Skip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Thank You Message */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Thank You!
                  </h3>
                  <p className="text-slate-700 mb-8">
                    Your feedback has been submitted and will help us improve the experience for future travelers.
                  </p>
                  
                  <Button
                    onClick={handleStartNewTrip}
                    size="lg"
                    className="mb-4"
                  >
                    Plan Another Trip
                  </Button>
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Safe Travels! 🌟
                    </h4>
                    <p className="text-slate-700">
                      We hope you have an amazing trip to {tripData?.destinationCity}!
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}