import type { Address, PublicClient, WalletClient } from 'viem'
import { getContract } from 'viem'
import { testnetTokenAbi } from '../abis/asset/TestnetToken'

/**
 * Creates a TestToken contract instance for Node.js/backend usage
 * @param address The contract address
 * @param client The viem client (public or wallet)
 * @returns Contract instance
 */
export function getTestTokenContract({
  address,
  client,
}: {
  address: Address
  client: PublicClient | WalletClient
}) {
  return getContract({
    address,
    abi: testnetTokenAbi,
    client,
  })
}
