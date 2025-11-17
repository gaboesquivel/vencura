'use client'

import { type Address, getAddress } from 'viem'
import { useReadContract } from 'wagmi'
import { testnetTokenAbi } from '../../abis/asset/TestnetToken'

/**
 * Hook to get the total supply of a TestToken
 * @param token The address of the token contract
 * @returns The total supply and other useReadContract properties
 */
export function useTotalSupply({ token }: { token: Address }) {
  const { data: supply, ...o } = useReadContract({
    address: getAddress(token),
    abi: testnetTokenAbi,
    functionName: 'totalSupply',
  })

  return { supply, ...o }
}
