import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import type { PackingItemDb, AddPackingItemRequest } from '@/types'

// Force dynamic rendering - no caching for user-specific data
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper function to get user from session
async function getUserFromSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    return session.user
  } catch {
    return null
  }
}

// Helper function to verify user owns the trip
async function verifyTripOwnership(tripId: string, userId: string): Promise<boolean> {
  const { data: trip } = await supabaseServer
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single()

  return (trip as { user_id: string } | null)?.user_id === userId
}

// POST /api/trips/[id]/items - Add packing item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found or access denied' },
        { status: 404 }
      )
    }

    const body: AddPackingItemRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Name and category are required' },
        { status: 400 }
      )
    }

    // Insert item into database
    const { data: item, error } = await supabaseServer
      .from('packing_items')
      .insert({
        trip_id: tripId,
        name: body.name,
        category: body.category,
        essential: body.essential || false,
        packed: false,
        custom: true, // User-added items are marked as custom
        quantity: body.quantity || 1,
        notes: body.notes || null,
      } as never)
      .select()
      .single()

    if (error) {
      console.error('Error adding packing item:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to add packing item' },
        { status: 500 }
      )
    }

    // Update trip's updated_at timestamp
    await supabaseServer
      .from('trips')
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', tripId)

    const response = NextResponse.json({
      success: true,
      item: item as PackingItemDb,
    })

    // Ensure no public caching of user-specific data
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Vary', 'Cookie')

    return response
  } catch (error) {
    console.error('Error in POST /api/trips/[id]/items:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/trips/[id]/items - Get all packing items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch packing items
    const { data: items, error } = await supabaseServer
      .from('packing_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching packing items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch packing items' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      items: items as PackingItemDb[],
    })

    // Ensure no public caching of user-specific data
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Vary', 'Cookie')

    return response
  } catch (error) {
    console.error('Error in GET /api/trips/[id]/items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
