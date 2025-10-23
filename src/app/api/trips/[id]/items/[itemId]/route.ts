import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, verifyTripOwnership, errorResponse, successResponse } from '@/lib/api-auth'

/**
 * PUT /api/trips/[id]/items/[itemId]
 * Update a packing item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const { id: tripId, itemId } = params

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return errorResponse('Trip not found or access denied', 404)
    }

    // Verify item belongs to trip
    const { data: existingItem } = await supabase
      .from('packing_items')
      .select('trip_id')
      .eq('id', itemId)
      .single()

    if (!existingItem || existingItem.trip_id !== tripId) {
      return errorResponse('Item not found or does not belong to this trip', 404)
    }

    // Parse request body
    const body = await request.json()
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Add allowed fields to updates
    if (body.name !== undefined) updates.name = body.name
    if (body.packed !== undefined) updates.packed = body.packed
    if (body.essential !== undefined) updates.essential = body.essential
    if (body.quantity !== undefined) updates.quantity = body.quantity
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.category !== undefined) updates.category = body.category

    // Update item
    const { data: item, error } = await supabase
      .from('packing_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      console.error('Error updating packing item:', error)
      return errorResponse('Failed to update item', 500)
    }

    return successResponse({ item })
  } catch (error) {
    console.error('Error updating packing item:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}

/**
 * DELETE /api/trips/[id]/items/[itemId]
 * Delete a packing item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const { id: tripId, itemId } = params

    // Verify ownership
    const ownsTrip = await verifyTripOwnership(tripId, user.id)
    if (!ownsTrip) {
      return errorResponse('Trip not found or access denied', 404)
    }

    // Verify item belongs to trip
    const { data: existingItem } = await supabase
      .from('packing_items')
      .select('trip_id')
      .eq('id', itemId)
      .single()

    if (!existingItem || existingItem.trip_id !== tripId) {
      return errorResponse('Item not found or does not belong to this trip', 404)
    }

    // Delete item
    const { error } = await supabase
      .from('packing_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Error deleting packing item:', error)
      return errorResponse('Failed to delete item', 500)
    }

    return successResponse({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting packing item:', error)
    return errorResponse('An unexpected error occurred', 500)
  }
}
