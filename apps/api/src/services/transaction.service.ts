import { createWalletClient, http, parseEther, type Hex } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { getErrorMessage, getChainMetadata } from '@vencura/lib'
import { getEvmClient } from './wallet-client'
import { zEnv } from '../lib/env'
import { getWalletAndKeyShares } from './helpers/wallet'
import { createDynamicLocalAccount } from './helpers/account'
import { BadRequestError } from '../http/errors'

/**
 * Send transaction service for EVM wallets.
 * Uses Dynamic SDK + viem to build, sign, and send transactions.
 */
export async function sendTransactionService({
  userId,
  walletId,
  to,
  amount,
  data,
}: {
  userId: string
  walletId: string
  to: string
  amount: number
  data?: string | null
}): Promise<{ transactionHash: string }> {
  // Get wallet info and key shares
  const { walletInfo, externalServerKeyShares } = await getWalletAndKeyShares({
    userId,
    walletId,
  })

  const { address, chainType } = walletInfo

  // Only support EVM chains for now
  if (chainType !== 'evm') {
    throw new BadRequestError('Unsupported chain type. Only EVM chains are supported.', {
      chainType,
    })
  }

  // For now, assume Arbitrum Sepolia (421614) for EVM wallets
  // TODO: Store chain ID in database or pass as parameter to support multiple EVM chains
  const chainId = 421614
  const chainMetadata = getChainMetadata(chainId)
  if (!chainMetadata || !chainMetadata.chainId || typeof chainMetadata.chainId !== 'number') {
    throw new Error(`Could not determine chain metadata for chain ID ${chainId}`)
  }

  // Get Dynamic EVM client
  const dynamicEvmClient = await getEvmClient()

  // Create account with Dynamic SDK signing methods
  const account = createDynamicLocalAccount({
    address,
    externalServerKeyShares,
    dynamicEvmClient,
  })

  // Get RPC URL (priority: SEPOLIA_RPC_URL > default)
  const rpcUrl =
    zEnv.SEPOLIA_RPC_URL ||
    chainMetadata.viemChain?.rpcUrls?.default?.http?.[0] ||
    'https://sepolia-rollup.arbitrum.io/rpc'

  // Get viem chain (use Arbitrum Sepolia as default for now, extend later)
  const viemChain = chainMetadata.viemChain || arbitrumSepolia

  const walletClient = createWalletClient({
    account,
    chain: viemChain,
    transport: http(rpcUrl),
  })

  // Send transaction
  // Type assertion needed due to viem v2.44+ type inference requiring kzg
  // in some type contexts, even though it's optional at runtime for non-blob transactions
  try {
    const hash = await walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(amount.toString()),
      ...(data && { data: data as Hex }),
    } as unknown as Parameters<typeof walletClient.sendTransaction>[0])

    return {
      transactionHash: hash,
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error) ?? String(error)
    throw new Error(`Failed to send transaction: ${errorMessage}`)
  }
}
