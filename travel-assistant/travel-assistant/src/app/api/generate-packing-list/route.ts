import { NextRequest, NextResponse } from 'next/server'
import { generatePackingList, TripData } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const tripData: TripData = await request.json()

    // Validate required fields
    if (!tripData.destinationCountry || !tripData.destinationCity || !tripData.duration || !tripData.tripType) {
      return NextResponse.json(
        { error: 'Missing required trip data' },
        { status: 400 }
      )
    }

    const packingList = await generatePackingList(tripData)

    return NextResponse.json({ packingList })
  } catch (error) {
    console.error('Error in generate-packing-list API:', error)
    return NextResponse.json(
      { error: 'Failed to generate packing list' },
      { status: 500 }
    )
  }
}