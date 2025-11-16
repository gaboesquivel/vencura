import { useChat } from 'ai/react'
import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core'
import { useMemo } from 'react'

export interface UseChatbotOptions {
  api?: string
  baseUrl?: string
  model?: string
  initialMessages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
}

export function useChatbot({
  api = '/chat',
  baseUrl,
  model = 'gpt-4o-mini',
  initialMessages = [],
}: UseChatbotOptions = {}) {
  const { user } = useDynamicContext()

  const finalBaseUrl = useMemo(
    () => baseUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
    [baseUrl],
  )

  const headers = useMemo(() => {
    const token = getAuthToken()
    if (!token || !user) return {}
    return { Authorization: `Bearer ${token}` }
  }, [user])

  const chat = useChat({
    api: `${finalBaseUrl}${api}`,
    headers,
    initialMessages,
    body: {
      model,
    },
  })

  return {
    ...chat,
    isAuthenticated: !!user,
  }
}
