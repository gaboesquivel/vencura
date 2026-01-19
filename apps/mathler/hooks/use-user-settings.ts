'use client'

import {
  useDynamicContext,
  useRefreshUser,
  useUserUpdateRequest,
} from '@dynamic-labs/sdk-react-core'
import { getErrorMessage } from '@repo/error/nextjs'
import isPlainObject from 'lodash-es/isPlainObject'
import { useAsyncFn } from 'react-use'
import type { MathlerSettings, UserMetadata } from '../types/user-metadata'

export function useUserSettings() {
  const { user } = useDynamicContext()
  const { updateUser } = useUserUpdateRequest()
  const refreshUser = useRefreshUser()

  const metadata = (user?.metadata as UserMetadata) || {}
  const settings: MathlerSettings = metadata.mathlerSettings || {}

  const difficulty: 'easy' | 'medium' | 'hard' = settings.difficulty ?? 'medium'
  const theme: 'light' | 'dark' | 'system' = settings.theme ?? 'system'

  const [saveSettingsState, saveSettings] = useAsyncFn(
    async (updates: Partial<MathlerSettings>): Promise<boolean> => {
      if (!user) throw new Error('Cannot save settings: user not authenticated')

      const currentMetadata = (user.metadata as UserMetadata) || {}
      const currentSettings: MathlerSettings = currentMetadata.mathlerSettings || {}

      const updatedSettings: MathlerSettings = {
        ...currentSettings,
        ...updates,
      }

      const updatedMetadata: UserMetadata = {
        ...currentMetadata,
        mathlerSettings: updatedSettings,
      }

      const result = await updateUser({
        metadata: updatedMetadata,
      })

      // Check for updateUser errors or unsuccessful responses
      if (!result) throw new Error('Failed to save settings: updateUser returned no result')

      // Type-safe error checking
      const hasError =
        isPlainObject(result) &&
        ('error' in result || ('success' in result && result.success === false))

      if (hasError) {
        const errorMessage =
          (isPlainObject(result) && 'error' in result && getErrorMessage(result.error)) ||
          'Failed to update user settings. Please try again.'
        throw new Error(errorMessage)
      }

      // Refresh user to get updated metadata only if update was successful
      const requiresVerification =
        result.isEmailVerificationRequired || result.isSmsVerificationRequired
      if (!requiresVerification) await refreshUser()

      return !requiresVerification
    },
    [user, updateUser, refreshUser],
  )

  const setDifficulty = async (newDifficulty: 'easy' | 'medium' | 'hard') => {
    await saveSettings({ difficulty: newDifficulty })
  }

  const setTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    await saveSettings({ theme: newTheme })
  }

  return {
    difficulty,
    theme,
    setDifficulty,
    setTheme,
    isLoading: saveSettingsState.loading,
    saveSettingsError: saveSettingsState.error,
  }
}
