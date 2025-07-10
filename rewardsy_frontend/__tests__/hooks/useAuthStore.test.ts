/**
 * Unit tests for useAuthStore hook
 * Tests state management and authentication logic
 */
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/hooks/useAuthStore'
import { authAPI } from '@/lib/api-auth'

// Mock the auth API
jest.mock('@/lib/api-auth')
const mockAuthAPI = authAPI as jest.Mocked<typeof authAPI>

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks
    localStorage.clear()
    jest.clearAllMocks()
    
    // Reset store state
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.clearError()
      result.current.setUser(null)
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current._hasHydrated).toBe(false)
    })
  })

  describe('register functionality', () => {
    it('should handle successful registration', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      }
      const mockToken = 'mock-jwt-token'

      mockAuthAPI.register.mockResolvedValueOnce({
        user: mockUser,
        token: mockToken
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.register('Test User', 'test@example.com', 'password123')
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockAuthAPI.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle registration error', async () => {
      const errorMessage = 'Email already exists'
      mockAuthAPI.register.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        try {
          await result.current.register('Test User', 'test@example.com', 'password123')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })

    it('should set loading state during registration', async () => {
      let resolveRegister: any
      const registerPromise = new Promise((resolve) => {
        resolveRegister = resolve
      })
      mockAuthAPI.register.mockReturnValueOnce(registerPromise as any)

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.register('Test User', 'test@example.com', 'password123')
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        resolveRegister({ user: { id: '1' }, token: 'token' })
        await registerPromise
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('login functionality', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      }
      const mockToken = 'mock-jwt-token'

      mockAuthAPI.login.mockResolvedValueOnce({
        user: mockUser,
        token: mockToken
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockAuthAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials'
      mockAuthAPI.login.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('logout functionality', () => {
    it('should handle successful logout', async () => {
      mockAuthAPI.logout.mockResolvedValueOnce()

      const { result } = renderHook(() => useAuthStore())

      // Set initial user
      act(() => {
        result.current.setUser({ id: '1', email: 'test@example.com', name: 'Test' })
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(mockAuthAPI.logout).toHaveBeenCalled()
    })

    it('should handle logout error gracefully', async () => {
      mockAuthAPI.logout.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuthStore())

      // Set initial user
      act(() => {
        result.current.setUser({ id: '1', email: 'test@example.com', name: 'Test' })
      })

      await act(async () => {
        await result.current.logout()
      })

      // Should still clear user even if API call fails
      expect(result.current.user).toBeNull()
    })
  })

  describe('error management', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should set error', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setError('New error')
      })

      expect(result.current.error).toBe('New error')
    })
  })

  describe('user management', () => {
    it('should set user', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      }

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.user).toEqual(mockUser)
    })

    it('should clear user', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial user
      act(() => {
        result.current.setUser({ id: '1', email: 'test@example.com', name: 'Test' })
      })

      act(() => {
        result.current.setUser(null)
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('hydration', () => {
    it('should handle hydration state', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current._hasHydrated).toBe(false)

      act(() => {
        // Simulate hydration by setting user from localStorage
        result.current.setUser({ id: '1', email: 'test@example.com', name: 'Test' })
      })

      // In real implementation, _hasHydrated would be set during initialization
      // This would be handled by the store's persistence logic
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent login attempts', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      }

      mockAuthAPI.login
        .mockResolvedValueOnce({ user: mockUser, token: 'token1' })
        .mockResolvedValueOnce({ user: mockUser, token: 'token2' })

      const { result } = renderHook(() => useAuthStore())

      // Start two concurrent login attempts
      const login1 = act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      const login2 = act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      await Promise.all([login1, login2])

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
    })
  })
})