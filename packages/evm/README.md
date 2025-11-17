# @vencura/evm

TypeScript package for interacting with EVM token contracts using Wagmi v2 and Viem v2. Provides React hooks for UI components and Node.js utilities for backend usage.

## Features

- Type-safe contract interactions with TypeScript
- Built with Wagmi v2 and Viem v2 for reliable blockchain interactions
- React hooks for reading and writing to token contracts
- Node.js utilities for backend contract interactions
- Support for multiple networks including Arbitrum Sepolia
- Automatic error handling and loading states
- Type-safe contract ABIs from Foundry build output
- Pre-configured Viem contract instances

## Installation

```bash
pnpm add @vencura/evm
```

## Peer Dependencies

This package requires the following peer dependencies (provided by your app):

- `wagmi` ^2.0.0
- `viem` ^2.0.0
- `react` ^19.0.0
- `react-dom` ^19.0.0

## Usage

### React Hooks (UI Components)

Hooks must be used within Wagmi and Viem providers. See [Wagmi Setup](#wagmi-setup) for provider configuration.

#### Mint Tokens

```tsx
'use client'

import { useMint } from '@vencura/evm/hooks'
import { parseEther } from 'viem'

function MintButton() {
  const { mint, isPending, hash } = useMint({
    tokenAddress: '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F',
    amount: parseEther('1000'),
  })

  return (
    <button onClick={mint} disabled={isPending}>
      {isPending ? 'Minting...' : 'Mint Tokens'}
    </button>
  )
}
```

#### Burn Tokens

```tsx
'use client'

import { useBurn } from '@vencura/evm/hooks'
import { parseEther } from 'viem'

function BurnButton() {
  const { burn, isPending } = useBurn({
    tokenAddress: '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F',
    amount: parseEther('100'),
  })

  return (
    <button onClick={burn} disabled={isPending}>
      {isPending ? 'Burning...' : 'Burn Tokens'}
    </button>
  )
}
```

#### Read Token Balance

```tsx
'use client'

import { useBalance } from '@vencura/evm/hooks'
import { formatUnits } from 'viem'

function TokenBalance() {
  const { balance, isLoading } = useBalance({
    token: '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F',
  })

  if (isLoading) return <div>Loading...</div>
  if (!balance) return <div>0.00</div>

  return <div>{formatUnits(balance, 18)}</div>
}
```

#### Read Total Supply

```tsx
'use client'

import { useTotalSupply } from '@vencura/evm/hooks'
import { formatUnits } from 'viem'

function TokenSupply() {
  const { supply, isLoading } = useTotalSupply({
    token: '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F',
  })

  if (isLoading) return <div>Loading...</div>
  if (!supply) return <div>0.00</div>

  return <div>Total Supply: {formatUnits(supply, 18)}</div>
}
```

### Node.js Utilities (Backend)

```ts
import { getTestTokenContract } from '@vencura/evm/node'
import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
})

const contract = getTestTokenContract({
  address: '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F',
  client,
})

const supply = await contract.read.totalSupply()
const balance = await contract.read.balanceOf(['0x...'])
```

### ABIs

```ts
import { testnetTokenAbi } from '@vencura/evm/abis'

// Use ABI with viem or wagmi
```

## Wagmi Setup

To use the hooks in your React app, you must set up Wagmi providers:

```tsx
'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http } from 'wagmi'
import { arbitrumSepolia } from 'viem/chains'

const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
```

## Package Structure

```
@vencura/evm/
├── /hooks          # React hooks for UI components
│   ├── useMint     # Mint tokens hook
│   ├── useBurn     # Burn tokens hook
│   ├── useBalance  # Read token balance hook
│   └── useTotalSupply # Read total supply hook
├── /node           # Node.js utilities for backend
│   └── getTestTokenContract # Create contract instance
└── /abis           # Contract ABIs
    └── testnetTokenAbi # TestToken ABI from Foundry
```

## Exports

- `@vencura/evm/hooks` - React hooks
- `@vencura/evm/node` - Node.js utilities
- `@vencura/evm/abis` - Contract ABIs

## Supported Contracts

- **TestToken**: ERC20 token with open minting/burning for testing and faucet purposes
  - Deployed on Arbitrum Sepolia
  - See [contracts/evm/README.md](../../contracts/evm/README.md) for deployed addresses

## License

PROPRIETARY
