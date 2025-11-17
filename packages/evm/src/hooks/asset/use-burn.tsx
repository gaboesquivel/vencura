'use client'
/**
 * Hook to burn tokens from a user's wallet
 * @param address Optional address to burn tokens from. Defaults to connected wallet
 * @param tokenAddress Token contract address to burn tokens from
 * @param amount Amount of tokens to burn in wei
 * @returns Burn function and transaction state
 */
import { testnetTokenAbi } from '../../abis/asset/TestnetToken'
import { type Address, getAddress } from 'viem'
import { useAccount, useWriteContract } from 'wagmi'

export function useBurn({
  address,
  tokenAddress,
  amount,
}: {
  address?: Address
  tokenAddress?: Address
  amount: bigint
}) {
  const account = useAccount()

  const { writeContract, data, ...o } = useWriteContract()

  const burn = () => {
    if (!tokenAddress) return
    if (!account.address && !address) return

    writeContract({
      abi: testnetTokenAbi,
      address: getAddress(tokenAddress),
      functionName: 'burn',
      args: [address || account.address!, amount],
    })
  }

  return {
    hash: data,
    burn,
    ...o,
  }
}
