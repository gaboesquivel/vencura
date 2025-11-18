/**
 * @vencura/evm
 *
 * TypeScript package for EVM token contract ABIs and Node.js utilities.
 *
 * **Note**: React hooks have been removed. Use `@vencura/react` hooks instead,
 * which call the Ventura API (single integration point to Dynamic SDK).
 *
 * @example
 * ```ts
 * // Using ABIs for encoding contract calls
 * import { testnetTokenAbi } from '@vencura/evm/abis'
 * import { encodeFunctionData } from 'viem'
 *
 * const mintData = encodeFunctionData({
 *   abi: testnetTokenAbi,
 *   functionName: 'mint',
 *   args: [recipient, amount],
 * })
 * ```
 *
 * @example
 * ```ts
 * // Using Node.js utilities (backend only)
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

export * from './abis'
export * from './node'
