'use client'

import { createConfig, http, type Config } from 'wagmi'
import { arbitrumSepolia } from 'viem/chains'
import { injected } from 'wagmi/connectors'

let wagmiConfigInstance: Config | null = null

export function getWagmiConfig(): Config {
  if (wagmiConfigInstance) return wagmiConfigInstance

  const connectors = typeof window !== 'undefined' ? [injected()] : []

  wagmiConfigInstance = createConfig({
    chains: [arbitrumSepolia],
    connectors,
    transports: {
      [arbitrumSepolia.id]: (() => {
        const rpcUrl = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL
        if (rpcUrl) return http(rpcUrl)
        return http('https://sepolia-rollup.arbitrum.io/rpc')
      })(),
    },
    ssr: true,
  })

  return wagmiConfigInstance
}

export const wagmiConfig: Config | null = typeof window !== 'undefined' ? getWagmiConfig() : null
