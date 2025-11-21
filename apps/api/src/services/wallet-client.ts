import type { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm'
import type { DynamicSolanaWalletClient } from '@dynamic-labs-wallet/node-svm'
import { getChainType, type ChainMetadata } from '@vencura/lib'

let evmClient: DynamicEvmWalletClient | null = null
let solanaClient: DynamicSolanaWalletClient | null = null

/**
 * Get singleton EVM wallet client.
 * CRITICAL: Must not recreate on every request - Dynamic SDK instantiation is expensive.
 */
export async function getEvmClient(): Promise<DynamicEvmWalletClient> {
  if (!evmClient) {
    const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID
    const apiToken = process.env.DYNAMIC_API_TOKEN

    if (!environmentId || !apiToken) {
      throw new Error('DYNAMIC_ENVIRONMENT_ID and DYNAMIC_API_TOKEN env vars are required')
    }

    const module = await import('@dynamic-labs-wallet/node-evm')
    const DynamicEvmWalletClientClass = module.DynamicEvmWalletClient
    evmClient = new DynamicEvmWalletClientClass({ environmentId })
    await evmClient.authenticateApiToken(apiToken)
  }
  return evmClient
}

/**
 * Get singleton Solana wallet client.
 * CRITICAL: Must not recreate on every request - Dynamic SDK instantiation is expensive.
 */
export async function getSolanaClient(): Promise<DynamicSolanaWalletClient> {
  if (!solanaClient) {
    const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID
    const apiToken = process.env.DYNAMIC_API_TOKEN

    if (!environmentId || !apiToken) {
      throw new Error('DYNAMIC_ENVIRONMENT_ID and DYNAMIC_API_TOKEN env vars are required')
    }

    const module = await import('@dynamic-labs-wallet/node-svm')
    const DynamicSolanaWalletClientClass = module.DynamicSolanaWalletClient
    solanaClient = new DynamicSolanaWalletClientClass({ environmentId })
    await solanaClient.authenticateApiToken(apiToken)
  }
  return solanaClient
}

/**
 * Create wallet using appropriate client based on chain type.
 */
export async function createWallet({
  userId,
  chainId,
  chainMetadata,
}: {
  userId: string
  chainId: number | string
  chainMetadata: ChainMetadata
}) {
  const chainType = getChainType(chainId)
  if (!chainType) {
    throw new Error(`Could not determine chain type for chain: ${chainId}`)
  }

  switch (chainType) {
    case 'evm': {
      const client = await getEvmClient()
      const result = await client.createWalletAccount({
        userId,
        chainId: Number(chainId),
      })
      return {
        accountAddress: result.accountAddress,
        externalServerKeyShares: result.externalServerKeyShares,
      }
    }
    case 'solana': {
      const client = await getSolanaClient()
      const result = await client.createWalletAccount({
        userId,
        networkId: chainMetadata.dynamicNetworkId,
      })
      return {
        accountAddress: result.accountAddress,
        externalServerKeyShares: result.externalServerKeyShares,
      }
    }
    default:
      throw new Error(`Unsupported chain type: ${chainType}`)
  }
}
