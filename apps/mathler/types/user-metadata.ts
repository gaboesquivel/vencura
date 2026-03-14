import type { GameHistoryEntry } from '../hooks/use-game-history'

export interface MathlerSettings {
  difficulty?: 'easy' | 'medium' | 'hard'
  theme?: 'light' | 'dark' | 'system'
}

export interface UserMetadata {
  mathlerHistory?: GameHistoryEntry[]
  mathlerTokens?: number
  mathlerSettings?: MathlerSettings
  [key: string]: unknown // Index signature for extensibility (Dynamic SDK v4 pattern)
}
