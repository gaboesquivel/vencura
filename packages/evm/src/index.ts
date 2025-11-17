/**
 * @vencura/evm
 *
 * TypeScript package for interacting with EVM token contracts using Wagmi v2 and Viem v2.
 * Provides React hooks for UI components and Node.js utilities for backend usage.
 *
 * @example
 * ```tsx
 * // Using hooks in React components
 * import { useMint, useBalance } from '@vencura/evm/hooks'
 *
 * function FaucetComponent() {
 *   const { mint, isPending } = useMint({
 *     tokenAddress: '0x...',
 *     amount: parseEther('1000')
 *   })
 *   // ...
 * }
 * ```
 *
 * @example
 * ```ts
 * // Using Node.js utilities
 * import { getTestTokenContract } from '@vencura/evm/node'
 * import { createPublicClient } from 'viem'
 *
 * const client = createPublicClient({ ... })
 * const contract = getTestTokenContract({
 *   address: '0x...',
 *   client
 * })
 * const supply = await contract.read.totalSupply()
 * ```
 *
 * @packageDocumentation
 */

export * from './hooks'
export * from './abis'
export * from './node'
