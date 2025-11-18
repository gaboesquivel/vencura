'use client'

import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core'

export function useVencuraHeaders(): Record<string, string> | undefined {
  const { user } = useDynamicContext()
  const token = getAuthToken()
  if (!token || !user) return undefined
  return { Authorization: `Bearer ${token}` }
}
