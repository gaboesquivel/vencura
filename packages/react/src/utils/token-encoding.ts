import { encodeFunctionData, type Address, type Abi } from 'viem'

/**
 * Encodes ERC20 mint function call data.
 * Uses RORO pattern for multiple parameters.
 *
 * @param params - Mint parameters
 * @param params.recipient - Address to mint tokens to
 * @param params.amount - Amount to mint (in token's smallest unit, e.g., wei)
 * @param params.abi - ERC20 token ABI
 * @returns Encoded function call data as hex string
 *
 * @example
 * ```ts
 * const mintData = encodeTokenMint({
 *   recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
 *   amount: parseUnits('1000', 18),
 *   abi: testnetTokenAbi,
 * })
 * ```
 */
export function encodeTokenMint({
  recipient,
  amount,
  abi,
}: {
  recipient: Address
  amount: bigint
  abi: Abi
}): string {
  return encodeFunctionData({
    abi,
    functionName: 'mint',
    args: [recipient, amount],
  })
}

/**
 * Encodes ERC20 burn function call data.
 * Uses RORO pattern for multiple parameters.
 *
 * @param params - Burn parameters
 * @param params.account - Address to burn tokens from
 * @param params.amount - Amount to burn (in token's smallest unit, e.g., wei)
 * @param params.abi - ERC20 token ABI
 * @returns Encoded function call data as hex string
 *
 * @example
 * ```ts
 * const burnData = encodeTokenBurn({
 *   account: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
 *   amount: parseUnits('100', 18),
 *   abi: testnetTokenAbi,
 * })
 * ```
 */
export function encodeTokenBurn({
  account,
  amount,
  abi,
}: {
  account: Address
  amount: bigint
  abi: Abi
}): string {
  return encodeFunctionData({
    abi,
    functionName: 'burn',
    args: [account, amount],
  })
}
