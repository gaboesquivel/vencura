'use client'

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { createClient } from '@repo/core'
import { ApiProvider } from '@repo/react'
import { Toaster } from '@repo/ui/components/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import { env } from '@/lib/env'

const queryClient = new QueryClient()

export const coreClient = createClient({
  baseUrl: env.NEXT_PUBLIC_API_URL,
  dynamicAuth: {
    getAuthToken: async () =>
      (await import('@dynamic-labs/sdk-react-core')).getAuthToken?.() ?? null,
  },
})

export function Providers({ children }: { children: ReactNode }) {
  const envId = env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID
  const content = (
    <ApiProvider client={coreClient}>
      <NuqsAdapter>
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
          <Toaster richColors position="top-right" />
        </NextThemesProvider>
      </NuqsAdapter>
    </ApiProvider>
  )
  const withDynamic = envId ? (
    <DynamicContextProvider settings={{ environmentId: envId }}>{content}</DynamicContextProvider>
  ) : (
    content
  )
  return <QueryClientProvider client={queryClient}>{withDynamic}</QueryClientProvider>
}
