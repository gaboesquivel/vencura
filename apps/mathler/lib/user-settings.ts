import type { MathlerSettings, UserMetadata } from '../types/user-metadata'

const defaultSettings: MathlerSettings = {
  difficulty: 'medium',
  theme: 'system',
}

export function getSettingsFromMetadata(metadata: UserMetadata | undefined | null): {
  difficulty: 'easy' | 'medium' | 'hard'
  theme: 'light' | 'dark' | 'system'
} {
  const settings: MathlerSettings = metadata?.mathlerSettings ?? {}
  return {
    difficulty: settings.difficulty ?? defaultSettings.difficulty ?? 'medium',
    theme: settings.theme ?? defaultSettings.theme ?? 'system',
  }
}
