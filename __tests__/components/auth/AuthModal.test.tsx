/**
 * AuthModal Component Tests
 * 
 * Tests for the authentication modal including guest login functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthModal } from '@/components/auth/AuthModal'

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('AuthModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Guest Login Functionality', () => {
    it('renders "Continue as Guest" button', () => {
      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const guestButton = screen.getByRole('button', { name: /continue as guest/i })
      expect(guestButton).toBeInTheDocument()
    })

    it('shows helper text for guest login', () => {
      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const helperText = screen.getByText(/no account needed/i)
      expect(helperText).toBeInTheDocument()
      expect(screen.getByText(/your data will be stored locally/i)).toBeInTheDocument()
    })

    it('creates guest user when "Continue as Guest" is clicked', async () => {
      const user = userEvent.setup()
      const mockGuestUser = {
        id: 'test-uuid-123',
        username: 'guest_user1',
        created_at: '2025-10-23T12:00:00Z',
        is_guest: true
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockGuestUser
        })
      })

      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const guestButton = screen.getByRole('button', { name: /continue as guest/i })
      await user.click(guestButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/guest',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
        )
      })

      expect(mockOnSuccess).toHaveBeenCalledWith(mockGuestUser)
      expect(localStorageMock.getItem('user')).toBe(JSON.stringify(mockGuestUser))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('shows loading state during guest login', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              id: 'test-uuid',
              username: 'guest_user1',
              created_at: '2025-10-23T12:00:00Z',
              is_guest: true
            }
          })
        }), 100))
      )

      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const guestButton = screen.getByRole('button', { name: /continue as guest/i })
      await user.click(guestButton)

      // Button should be disabled during loading
      expect(guestButton).toBeDisabled()
    })

    it('shows error message when guest login fails', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Failed to create guest account'
        })
      })

      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const guestButton = screen.getByRole('button', { name: /continue as guest/i })
      await user.click(guestButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create guest account/i)).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('handles network errors during guest login', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const guestButton = screen.getByRole('button', { name: /continue as guest/i })
      await user.click(guestButton)

      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Guest login error:', expect.any(Error))
      expect(mockOnSuccess).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Modal Layout', () => {
    it('guest button appears below toggle link', () => {
      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const toggleLink = screen.getByRole('button', { name: /create an account/i })
      const guestButton = screen.getByRole('button', { name: /continue as guest/i })

      // Get positions to verify order
      const togglePosition = toggleLink.getBoundingClientRect()
      const guestPosition = guestButton.getBoundingClientRect()

      expect(guestPosition.top).toBeGreaterThan(togglePosition.top)
    })

    it('guest button is separated with a border', () => {
      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const guestButton = screen.getByRole('button', { name: /continue as guest/i })
      const parentDiv = guestButton.parentElement

      expect(parentDiv).toHaveClass('border-t')
    })
  })

  describe('Regular Authentication', () => {
    it('can still login with regular credentials', async () => {
      const user = userEvent.setup()
      const mockUser = {
        id: 'user-uuid',
        username: 'testuser',
        created_at: '2025-10-23T12:00:00Z'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser
        })
      })

      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const usernameInput = screen.getByPlaceholderText('Username')
      const passwordInput = screen.getByPlaceholderText('Password')
      const loginButton = screen.getByRole('button', { name: /^login$/i })

      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'TestPass123')
      await user.click(loginButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/login',
          expect.any(Object)
        )
      })

      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
    })

    it('can still register with regular credentials', async () => {
      const user = userEvent.setup()
      const mockUser = {
        id: 'user-uuid',
        username: 'newuser',
        created_at: '2025-10-23T12:00:00Z'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser
        })
      })

      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Switch to register mode
      const toggleLink = screen.getByRole('button', { name: /create an account/i })
      await user.click(toggleLink)

      const usernameInput = screen.getByPlaceholderText('Username')
      const passwordInput = screen.getByPlaceholderText('Password')
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password')
      const registerButton = screen.getByRole('button', { name: /create account/i })

      await user.type(usernameInput, 'newuser')
      await user.type(passwordInput, 'NewPass123')
      await user.type(confirmPasswordInput, 'NewPass123')
      await user.click(registerButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/register',
          expect.any(Object)
        )
      })

      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
    })
  })

  describe('Modal Visibility', () => {
    it('does not render when isOpen is false', () => {
      render(
        <AuthModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByRole('button', { name: /continue as guest/i })).not.toBeInTheDocument()
    })

    it('renders when isOpen is true', () => {
      render(
        <AuthModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument()
    })
  })
})
