import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import {
  withAuth,
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse,
  validateRequiredFields,
  createPaginatedResponse
} from '@/lib/api-middleware'
import type { CreateTripRequest, Trip } from '@/types'

// Force dynamic rendering - no caching for user-specific data
export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/trips - Create new trip
export async function POST(request: NextRequest) {
  return withErrorHandling(async () =>
    withAuth(async (user) => {
      const body: CreateTripRequest = await request.json()

      // Validate required fields
      const validation = validateRequiredFields(body, [
        'destinationCountry',
        'destinationCity',
        'duration',
        'tripType'
      ])

      if (!validation.valid) {
        logger.warn('Missing required fields', { missing: validation.missing, userId: user.id })
        return createErrorResponse(
          `Missing required fields: ${validation.missing?.join(', ')}`,
          400,
          'VALIDATION_ERROR'
        )
      }

      // Validate duration
      if (body.duration < 1 || body.duration > 365) {
        return createErrorResponse(
          'Duration must be between 1 and 365 days',
          400,
          'VALIDATION_ERROR'
        )
      }

      // Insert trip into database
      const insertData = {
        user_id: user.id,
        destination_country: body.destinationCountry,
        destination_city: body.destinationCity,
        destination_state: body.destinationState || null,
        destination_display_name: body.destinationDisplayName || null,
        duration: body.duration,
        trip_type: body.tripType,
        start_date: body.startDate || null,
        end_date: body.endDate || null,
        notes: body.notes || null,
        status: 'active' as const,
        completion_percentage: 0,
        is_favorite: false,
      }
      
      const { data: trip, error } = await supabaseServer
        .from('trips')
        .insert(insertData as never)
        .select()
        .single()

      if (error || !trip) {
        logger.error('Error creating trip', error as Error, { userId: user.id })
        return createErrorResponse('Failed to create trip', 500, 'DATABASE_ERROR')
      }

      logger.info('Trip created successfully', { tripId: (trip as Trip).id, userId: user.id })
      return createSuccessResponse(trip as Trip, { message: 'Trip created successfully' })
    })
  )
}

// GET /api/trips - Get user's trips
export async function GET(request: NextRequest) {
  return withErrorHandling(async () =>
    withAuth(async (user) => {
      // Parse query parameters
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') || 'all'
      const limit = parseInt(searchParams.get('limit') || '50', 10)
      const offset = parseInt(searchParams.get('offset') || '0', 10)
      const sortBy = searchParams.get('sortBy') || 'created_at'
      const sortOrder = searchParams.get('sortOrder') || 'desc'

      // Build query
      let query = supabaseServer
        .from('trips')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Apply status filter
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      // Apply sorting
      const ascending = sortOrder === 'asc'
      query = query.order(sortBy, { ascending })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data: trips, error, count } = await query

      if (error) {
        logger.error('Error fetching trips', error as Error, { userId: user.id })
        return createErrorResponse('Failed to fetch trips', 500, 'DATABASE_ERROR')
      }

      logger.debug('Trips fetched successfully', { 
        userId: user.id, 
        count: trips?.length || 0,
        total: count || 0 
      })

      return createPaginatedResponse(trips as Trip[], {
        total: count || 0,
        limit,
        offset
      })
    })
  )
}
