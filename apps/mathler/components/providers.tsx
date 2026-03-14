'use client'

import { EthereumWalletConnectors } from '@dynamic-labs/ethereum'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { SolanaWalletConnectors } from '@dynamic-labs/solana'
import { logger } from '@repo/utils/logger'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import * as React from 'react'
import { Toaster } from 'sonner'
import { env } from '@/lib/env'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  const environmentId = env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID

  // Only initialize on client side after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Warn/error handling for missing environment ID and log initialization
  React.useEffect(() => {
    if (!environmentId) {
      if (process.env.NODE_ENV === 'production') {
        logger.error(
          'NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is required in production. Please set it in your environment variables.',
        )
      } else {
        logger.warn(
          'NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not set. Dynamic authentication will be disabled.',
        )
      }
    } else if (mounted) {
      logger.info(
        {
          environmentId,
          walletConnectors: ['Ethereum', 'Solana'],
        },
        'Dynamic SDK initialized with wallet connectors',
      )
    }
  }, [environmentId, mounted])

  // Base providers that don't depend on Dynamic SDK
  const baseProviders = (
    <NuqsAdapter>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        {children}
        <Toaster />
      </NextThemesProvider>
    </NuqsAdapter>
  )

  // Don't initialize Dynamic SDK if:
  // 1. Not mounted yet (SSR)
  // 2. Missing environment ID in production
  // 3. Missing environment ID in development (graceful degradation)
  if (!mounted || !environmentId) {
    return baseProviders
  }

  // Initialize Dynamic SDK with valid environment ID
  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        appName: 'Mathler',
        walletConnectors: [EthereumWalletConnectors, SolanaWalletConnectors],
      }}
    >
      {baseProviders}
    </DynamicContextProvider>
  )
}
