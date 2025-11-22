import { createHash } from 'crypto'
import { eq } from 'drizzle-orm'
import { getDatabase } from './database'
import { keyShares } from '../db/schema'
import { encryptKeyShare, decryptKeyShare } from './encryption'
import { createWallet } from './wallet-client'
import {
  getChainMetadata,
  getDynamicNetworkId,
  isSupportedChain,
  getChainType,
  type ChainMetadata as ChainMetadataType,
  type ChainType,
} from './chain-utils'

/**
 * Generate deterministic wallet ID from address and network.
 * Uses SHA-256 hash of address+network to create a deterministic ID.
 */
function generateWalletId(address: string, network: string): string {
  const input = `${address}:${network}`
  const hash = createHash('sha256').update(input).digest('hex')
  // Format as UUID v4-like string (but deterministic)
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

/**
 * Get chain type from Dynamic network ID.
 */
function getChainTypeFromNetwork(network: string): ChainType {
  if (network.startsWith('solana-')) return 'solana'
  // Default to EVM for numeric network IDs
  return 'evm'
}

/**
 * Get all wallets for a user (query DB by network).
 * Note: Schema doesn't track userId, so we return all wallets in key_shares table.
 */
async function getUserWallets(): Promise<
  Array<{ id: string; address: string; network: string; chainType: ChainType }>
> {
  const db = await getDatabase()
  const allKeyShares = await db.select().from(keyShares)

  return allKeyShares.map(keyShare => {
    const chainType = getChainTypeFromNetwork(keyShare.network)
    const id = generateWalletId(keyShare.address, keyShare.network)
    return {
      id,
      address: keyShare.address,
      network: keyShare.network,
      chainType,
    }
  })
}

/**
 * Create wallet with idempotent behavior.
 * Matches NestJS logic exactly:
 * 1. Validate chainId and get chain metadata
 * 2. Query DB first using network
 * 3. If found, return 200 with existing wallet
 * 4. Only call Dynamic SDK if DB is empty
 * 5. Create wallet, encrypt, save to DB
 * 6. Return 201 with new wallet
 */
export async function createWalletService({
  userId,
  chainId,
}: {
  userId: string
  chainId: number | string
}): Promise<{
  id: string
  address: string
  network: string
  chainType: ChainType
  isNew: boolean
}> {
  // Validate chain is supported
  if (!isSupportedChain(chainId)) {
    throw new Error(
      `Unsupported chain: ${chainId}. Please provide a valid chain ID or Dynamic network ID.`,
    )
  }

  // Get chain metadata and Dynamic network ID
  const chainMetadata = getChainMetadata(chainId)
  if (!chainMetadata) {
    throw new Error(`Invalid chain: ${chainId}`)
  }

  const dynamicNetworkId = getDynamicNetworkId(chainId)
  if (!dynamicNetworkId) {
    throw new Error(`Could not determine Dynamic network ID for chain: ${chainId}`)
  }

  const chainType = getChainType(chainId)
  if (!chainType) {
    throw new Error(`Could not determine chain type for chain: ${chainId}`)
  }

  // Query DB first - check if wallet exists for this network (idempotent check)
  const existingWallets = await getUserWallets()
  const existingWallet = existingWallets.find(w => w.network === dynamicNetworkId)

  // If wallet already exists, return it immediately (idempotent success)
  if (existingWallet) {
    return {
      id: existingWallet.id,
      address: existingWallet.address,
      network: existingWallet.network,
      chainType: existingWallet.chainType,
      isNew: false,
    }
  }

  // Only call Dynamic SDK if DB is empty (no existing wallet found)
  try {
    const wallet = await createWallet({
      userId,
      chainId,
      chainMetadata,
    })

    // Encrypt key shares
    const keySharesEncrypted = await encryptKeyShare(JSON.stringify(wallet.externalServerKeyShares))

    // Save to DB (upsert to handle race conditions)
    const db = await getDatabase()
    await db
      .insert(keyShares)
      .values({
        address: wallet.accountAddress,
        network: dynamicNetworkId,
        encryptedKeyShares: keySharesEncrypted,
      })
      .onConflictDoUpdate({
        target: [keyShares.address, keyShares.network],
        set: {
          encryptedKeyShares: keySharesEncrypted,
        },
      })

    // Compute walletId deterministically
    const walletId = generateWalletId(wallet.accountAddress, dynamicNetworkId)

    return {
      id: walletId,
      address: wallet.accountAddress,
      network: dynamicNetworkId,
      chainType,
      isNew: true,
    }
  } catch (error) {
    // Handle Dynamic SDK "wallet already exists" errors
    // Dynamic SDK wraps errors, so we check error message and stack for indicators
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : ''
    const lowerMessage = errorMessage.toLowerCase()
    const stackLower = errorStack.toLowerCase()

    // Check if this is a "multiple wallets" error
    // Dynamic SDK wraps errors, so we check error message and stack for indicators
    const isMultipleWalletsError =
      stackLower.includes('multiple wallets per chain') ||
      stackLower.includes('wallet already exists') ||
      stackLower.includes('you cannot create multiple wallets') ||
      lowerMessage.includes('multiple wallets per chain') ||
      lowerMessage.includes('wallet already exists') ||
      lowerMessage.includes('you cannot create multiple wallets')

    // Check if this is a generic wallet creation error (might be wrapped "multiple wallets" error)
    // Dynamic SDK wraps "multiple wallets" errors as "Error creating wallet account"
    const isWalletCreationError =
      lowerMessage.includes('error creating') ||
      lowerMessage.includes('wallet account') ||
      isMultipleWalletsError

    // If it's a wallet creation error, check DB again (might have been created in race condition)
    if (isWalletCreationError) {
      const finalCheckWallets = await getUserWallets()
      const finalCheckWallet = finalCheckWallets.find(w => w.network === dynamicNetworkId)
      if (finalCheckWallet) {
        return {
          id: finalCheckWallet.id,
          address: finalCheckWallet.address,
          network: finalCheckWallet.network,
          chainType: finalCheckWallet.chainType,
          isNew: false,
        }
      }

      // If we get a wallet creation error but no wallet in DB, it's likely a "multiple wallets" error
      // that was wrapped. Dynamic SDK prevents multiple wallets per chain, so if creation fails,
      // it means a wallet already exists in Dynamic SDK's system (possibly from a previous test run).
      // Throw a user-friendly error indicating wallet already exists.
      throw new Error(
        `Wallet already exists for chain ${chainId}. Multiple wallets per chain are not allowed.`,
      )
    }

    // Re-throw other errors
    throw error
  }
}
