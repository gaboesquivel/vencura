'use client'

import { type Address, getAddress } from 'viem'
import { useReadContract, useAccount } from 'wagmi'
import { testnetTokenAbi } from '../../abis/asset/TestnetToken'

/**
 * Hook to get the balance of a TestToken for a specific address
 * @param token The address of the token contract
 * @param address Optional address to check balance for. Defaults to connected wallet
 * @returns The balance and other useReadContract properties
 */
export function useBalance({ token, address }: { token: Address; address?: Address }) {
  const account = useAccount()
  const targetAddress = address || account.address

  const { data: balance, ...o } = useReadContract({
    address: getAddress(token),
    abi: testnetTokenAbi,
    functionName: 'balanceOf',
    args: targetAddress ? [getAddress(targetAddress)] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  })

  return { balance, ...o }
}
