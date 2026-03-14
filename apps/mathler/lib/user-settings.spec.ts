import { describe, expect, it } from 'vitest'
import { getSettingsFromMetadata } from './user-settings'

describe('getSettingsFromMetadata', () => {
  it('should return settings from metadata', () => {
    const metadata = {
      mathlerSettings: { difficulty: 'hard', theme: 'dark' },
    }
    expect(getSettingsFromMetadata(metadata)).toEqual({
      difficulty: 'hard',
      theme: 'dark',
    })
  })

  it('should return default values when no settings exist', () => {
    expect(getSettingsFromMetadata({})).toEqual({
      difficulty: 'medium',
      theme: 'system',
    })
  })

  it('should return defaults for null or undefined metadata', () => {
    expect(getSettingsFromMetadata(null)).toEqual({
      difficulty: 'medium',
      theme: 'system',
    })
    expect(getSettingsFromMetadata(undefined)).toEqual({
      difficulty: 'medium',
      theme: 'system',
    })
  })

  it('should merge partial settings with defaults', () => {
    expect(getSettingsFromMetadata({ mathlerSettings: { difficulty: 'easy' } })).toEqual({
      difficulty: 'easy',
      theme: 'system',
    })
    expect(getSettingsFromMetadata({ mathlerSettings: { theme: 'light' } })).toEqual({
      difficulty: 'medium',
      theme: 'light',
    })
  })
})
