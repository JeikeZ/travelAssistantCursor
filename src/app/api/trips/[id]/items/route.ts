import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, verifyTripOwnership, errorResponse, successResponse } from '@/lib/api-auth'
import { PackingItemDB } from '@/types'

/**
 * POST /api/trips/[id]/items
 * Add a packing item to a trip
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const tripId = params.id

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return errorResponse('Trip not found or access denied', 404)
    }

    // Parse request body
    const body = await request.json()
    const { name, category, essential, quantity, notes } = body

    // Validate required fields
    if (!name || !category) {
      return errorResponse('Missing required fields: name, category', 400)
    }

    // Create packing item
    const { data: item, error } = await supabase
      .from('packing_items')
      .insert([
        {
          trip_id: tripId,
          name,
          category,
          essential: essential || false,
          packed: false,
          custom: true,
          quantity: quantity || 1,
          notes: notes || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating packing item:', error)
      return errorResponse('Failed to add item', 500)
    }

    return successResponse({ item }, 201)
  } catch (error) {
    console.error('Error adding packing item:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}

/**
 * GET /api/trips/[id]/items
 * Get all packing items for a trip
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const tripId = params.id

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return errorResponse('Trip not found or access denied', 404)
    }

    // Fetch packing items
    const { data: items, error } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('category', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching packing items:', error)
      return errorResponse('Failed to fetch items', 500)
    }

    return successResponse({ items: items || [] })
  } catch (error) {
    console.error('Error fetching packing items:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}
