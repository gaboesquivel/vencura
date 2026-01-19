import {
  useDynamicContext,
  useRefreshUser,
  useUserUpdateRequest,
} from '@dynamic-labs/sdk-react-core'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useUserSettings } from './use-user-settings'

// Mock Dynamic SDK
vi.mock('@dynamic-labs/sdk-react-core', () => ({
  useDynamicContext: vi.fn(),
  useUserUpdateRequest: vi.fn(),
  useRefreshUser: vi.fn(),
}))

describe('useUserSettings', () => {
  it('should load settings from metadata', async () => {
    const mockUser = {
      userId: 'test-user',
      metadata: {
        mathlerSettings: {
          difficulty: 'hard',
          theme: 'dark',
        },
      },
    }
    const mockUpdateUser = vi.fn().mockResolvedValue({ success: true })
    const mockRefreshUser = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useDynamicContext).mockReturnValue({
      user: mockUser,
    } as never)
    vi.mocked(useUserUpdateRequest).mockReturnValue({
      updateUser: mockUpdateUser,
    } as never)
    vi.mocked(useRefreshUser).mockReturnValue({
      refreshUser: mockRefreshUser,
    } as never)

    const { result } = renderHook(() => useUserSettings())

    await waitFor(() => {
      expect(result.current.difficulty).toBe('hard')
      expect(result.current.theme).toBe('dark')
    })
  })

  it('should return default values when no settings exist', async () => {
    const mockUser = {
      userId: 'test-user',
      metadata: {},
    }
    const mockUpdateUser = vi.fn().mockResolvedValue({ success: true })
    const mockRefreshUser = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useDynamicContext).mockReturnValue({
      user: mockUser,
    } as never)
    vi.mocked(useUserUpdateRequest).mockReturnValue({
      updateUser: mockUpdateUser,
    } as never)
    vi.mocked(useRefreshUser).mockReturnValue({
      refreshUser: mockRefreshUser,
    } as never)

    const { result } = renderHook(() => useUserSettings())

    await waitFor(() => {
      expect(result.current.difficulty).toBe('medium')
      expect(result.current.theme).toBe('system')
    })
  })

  it('should save difficulty preference', async () => {
    const mockUser = {
      userId: 'test-user',
      metadata: {},
    }
    const mockUpdateUser = vi.fn().mockResolvedValue({ success: true })
    const mockRefreshUser = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useDynamicContext).mockReturnValue({
      user: mockUser,
    } as never)
    vi.mocked(useUserUpdateRequest).mockReturnValue({
      updateUser: mockUpdateUser,
    } as never)
    vi.mocked(useRefreshUser).mockReturnValue({
      refreshUser: mockRefreshUser,
    } as never)

    const { result } = renderHook(() => useUserSettings())

    await waitFor(() => {
      expect(result.current.difficulty).toBe('medium')
    })

    await result.current.setDifficulty('hard')

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        metadata: {
          mathlerSettings: {
            difficulty: 'hard',
          },
        },
      })
    })
  })

  it('should save theme preference', async () => {
    const mockUser = {
      userId: 'test-user',
      metadata: {},
    }
    const mockUpdateUser = vi.fn().mockResolvedValue({ success: true })
    const mockRefreshUser = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useDynamicContext).mockReturnValue({
      user: mockUser,
    } as never)
    vi.mocked(useUserUpdateRequest).mockReturnValue({
      updateUser: mockUpdateUser,
    } as never)
    vi.mocked(useRefreshUser).mockReturnValue({
      refreshUser: mockRefreshUser,
    } as never)

    const { result } = renderHook(() => useUserSettings())

    await waitFor(() => {
      expect(result.current.theme).toBe('system')
    })

    await result.current.setTheme('dark')

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        metadata: {
          mathlerSettings: {
            theme: 'dark',
          },
        },
      })
    })
  })

  it('should handle error when saving settings', async () => {
    const mockUser = {
      userId: 'test-user',
      metadata: {},
    }
    const mockUpdateUser = vi.fn().mockRejectedValue(new Error('Update failed'))
    const mockRefreshUser = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useDynamicContext).mockReturnValue({
      user: mockUser,
    } as never)
    vi.mocked(useUserUpdateRequest).mockReturnValue({
      updateUser: mockUpdateUser,
    } as never)
    vi.mocked(useRefreshUser).mockReturnValue({
      refreshUser: mockRefreshUser,
    } as never)

    const { result } = renderHook(() => useUserSettings())

    await waitFor(() => {
      expect(result.current.difficulty).toBe('medium')
    })

    await result.current.setDifficulty('easy')

    await waitFor(() => {
      expect(result.current.saveSettingsError).toBeTruthy()
    })
  })
})
