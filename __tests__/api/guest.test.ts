/**
 * Guest Authentication API Tests
 * 
 * Tests for the guest user creation endpoint
 */

import { POST } from '@/app/api/auth/guest/route'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

describe('Guest Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/guest', () => {
    it('should create a guest user with incremented username', async () => {
      // Mock the RPC call to get next guest number
      const mockRpc = supabase.rpc as jest.Mock
      mockRpc.mockResolvedValue({
        data: 1,
        error: null,
      })

      // Mock the insert operation
      const mockInsert = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-uuid-123',
              username: 'guest_user1',
              created_at: '2025-10-23T12:00:00Z',
              is_guest: true,
            },
            error: null,
          }),
        }),
      }

      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue(mockInsert),
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.user.username).toBe('guest_user1')
      expect(data.user.is_guest).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('get_next_guest_number')
    })

    it('should create guest_user2 for the second guest', async () => {
      const mockRpc = supabase.rpc as jest.Mock
      mockRpc.mockResolvedValue({
        data: 2,
        error: null,
      })

      const mockInsert = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-uuid-456',
              username: 'guest_user2',
              created_at: '2025-10-23T12:01:00Z',
              is_guest: true,
            },
            error: null,
          }),
        }),
      }

      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue(mockInsert),
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.user.username).toBe('guest_user2')
    })

    it('should return error if counter RPC fails', async () => {
      const mockRpc = supabase.rpc as jest.Mock
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'ERROR' },
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create guest account. Please try again.')
    })

    it('should return error if user insert fails', async () => {
      const mockRpc = supabase.rpc as jest.Mock
      mockRpc.mockResolvedValue({
        data: 1,
        error: null,
      })

      const mockInsert = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed', code: 'ERROR' },
          }),
        }),
      }

      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue(mockInsert),
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create guest account. Please try again.')
    })

    it('should have null password and password_hash_type', async () => {
      const mockRpc = supabase.rpc as jest.Mock
      mockRpc.mockResolvedValue({
        data: 1,
        error: null,
      })

      const mockInsert = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-uuid-123',
              username: 'guest_user1',
              created_at: '2025-10-23T12:00:00Z',
              is_guest: true,
            },
            error: null,
          }),
        }),
      }

      const mockFrom = supabase.from as jest.Mock
      const insertMock = jest.fn().mockReturnValue(mockInsert)
      mockFrom.mockReturnValue({
        insert: insertMock,
      })

      await POST()

      // Verify the insert was called with null password
      expect(insertMock).toHaveBeenCalledWith([
        {
          username: 'guest_user1',
          password: null,
          password_hash_type: null,
          is_guest: true,
        },
      ])
    })

    it('should include created_at timestamp in response', async () => {
      const mockRpc = supabase.rpc as jest.Mock
      mockRpc.mockResolvedValue({
        data: 1,
        error: null,
      })

      const mockTimestamp = '2025-10-23T12:00:00Z'
      const mockInsert = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-uuid-123',
              username: 'guest_user1',
              created_at: mockTimestamp,
              is_guest: true,
            },
            error: null,
          }),
        }),
      }

      const mockFrom = supabase.from as jest.Mock
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue(mockInsert),
      })

      const response = await POST()
      const data = await response.json()

      expect(data.user.created_at).toBe(mockTimestamp)
    })
  })
})
