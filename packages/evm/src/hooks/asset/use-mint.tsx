'use client'
/**
 * Hook to mint tokens to a user's wallet
 * @param address Optional address to mint tokens to. Defaults to connected wallet
 * @param tokenAddress Token contract address to mint tokens from
 * @param amount Amount of tokens to mint in wei
 * @returns Mint function and transaction state
 */
import { testnetTokenAbi } from '../../abis/asset/TestnetToken'
import { type Address, getAddress } from 'viem'
import { useAccount, useWriteContract } from 'wagmi'

export function useMint({
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

  const mint = () => {
    if (!tokenAddress) return
    if (!account.address && !address) return

    writeContract({
      abi: testnetTokenAbi,
      address: getAddress(tokenAddress),
      functionName: 'mint',
      args: [address || account.address!, amount],
    })
  }

  return {
    hash: data,
    mint,
    ...o,
  }
}
