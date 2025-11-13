'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { VencuraProvider } from '@vencura/react'
import { useVencuraHeaders } from '@/hooks/use-vencura-headers'

function VencuraProviderWrapper({ children }: { children: React.ReactNode }) {
  const headers = useVencuraHeaders()
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  return (
    <VencuraProvider baseUrl={baseUrl} headers={headers}>
      {children}
    </VencuraProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || 'placeholder-id'

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
      }}
    >
      <VencuraProviderWrapper>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
        </NextThemesProvider>
      </VencuraProviderWrapper>
    </DynamicContextProvider>
  )
}
