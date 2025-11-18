import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { getTestAuthToken } from './auth'
import type { App } from 'supertest/types'
import { delay } from '@vencura/lib'
import type { Address } from 'viem'
import { createWalletClient, http, parseEther, privateKeyToAccount } from 'viem'
import { foundry } from 'viem/chains'

export interface TestWallet {
  id: string
  address: string
  network: string
  chainType: string
}

/**
 * Create a new test wallet (always creates, never reuses).
 * Use this when you specifically need a fresh wallet (e.g., testing wallet creation).
 *
 * For most tests, use `getOrCreateTestWallet()` instead, which reuses existing wallets.
 *
 * Note: Wallets are automatically funded when using local blockchain (USE_LOCAL_BLOCKCHAIN=true).
 */
export async function createTestWallet({
  app,
  authToken,
  chainId,
}: {
  app: INestApplication<App>
  authToken: string
  chainId: number | string
}): Promise<TestWallet> {
  const response = await request(app.getHttpServer())
    .post('/wallets')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ chainId })
    .expect(201)

  return response.body as TestWallet
}

/**
 * Fund a wallet with ETH from Anvil's default account or testnet faucet.
 * Only works when using local Anvil blockchain or when FAUCET_PRIVATE_KEY is set.
 *
 * @param address - Wallet address to fund
 * @param amount - Amount of ETH to send (default: 1 ETH)
 * @param rpcUrl - RPC URL (default: http://localhost:8545 for Anvil)
 * @returns Success status and transaction hash if successful
 */
export async function fundWalletWithGas({
  address,
  amount = parseEther('1'),
  rpcUrl = 'http://localhost:8545',
}: {
  address: `0x${string}`
  amount?: bigint
  rpcUrl?: string
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Check if using local Anvil (default account) or testnet (FAUCET_PRIVATE_KEY)
    const faucetPrivateKey =
      process.env.FAUCET_PRIVATE_KEY ||
      // Anvil's default account private key (well-known for local testing)
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

    const account = privateKeyToAccount(faucetPrivateKey as `0x${string}`)

    const client = createWalletClient({
      account,
      chain: foundry, // Use foundry chain for Anvil (works with any EVM chain when RPC is overridden)
      transport: http(rpcUrl),
    })

    const hash = await client.sendTransaction({
      to: address,
      value: amount,
    })

    return { success: true, txHash: hash }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: `Failed to fund wallet: ${errorMessage}`,
    }
  }
}

/**
 * Get or create a test wallet, reusing existing wallets when available.
 * Automatically funds wallets when using local blockchain.
 *
 * IMPORTANT: For local blockchain testing, use Arbitrum Sepolia (421614) as the chainId.
 * Dynamic SDK doesn't support localhost chains, so we use Arbitrum Sepolia chain ID
 * while RPC URLs point to localhost:8545. Set RPC_URL_421614=http://localhost:8545
 * in your .env file to route transactions to Anvil.
 *
 * @param app - NestJS application instance
 * @param authToken - Dynamic auth token (API key in test mode)
 * @param chainId - Chain ID or Dynamic network ID (defaults to 421614 for local testing)
 * @returns Existing wallet if found, otherwise creates a new one
 */
export async function getOrCreateTestWallet({
  app,
  authToken,
  chainId = 421614, // Default to Arbitrum Sepolia for local testing
}: {
  app: INestApplication<App>
  authToken: string
  chainId?: number | string
}): Promise<TestWallet> {
  const effectiveChainId =
    process.env.USE_LOCAL_BLOCKCHAIN !== 'false' && typeof chainId === 'number' && chainId === 31337
      ? 421614
      : chainId

  const wallets = (
    await request(app.getHttpServer())
      .get('/wallets')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
  ).body as TestWallet[]

  const existingWallet = wallets.find(w => w.network === String(effectiveChainId))

  if (existingWallet) {
    if (process.env.USE_LOCAL_BLOCKCHAIN !== 'false' && existingWallet.chainType === 'evm') {
      await fundWalletWithGas({
        address: existingWallet.address as `0x${string}`,
        amount: parseEther('1'),
        rpcUrl:
          process.env.RPC_URL_421614 ||
          process.env[`RPC_URL_${effectiveChainId}`] ||
          'http://localhost:8545',
      })
    }
    return existingWallet
  }

  const wallet = await createTestWallet({ app, authToken, chainId: effectiveChainId })

  if (process.env.USE_LOCAL_BLOCKCHAIN !== 'false' && wallet.chainType === 'evm') {
    await fundWalletWithGas({
      address: wallet.address as `0x${string}`,
      amount: parseEther('1'),
      rpcUrl:
        process.env.RPC_URL_421614 ||
        process.env[`RPC_URL_${effectiveChainId}`] ||
        'http://localhost:8545',
    })
  }

  return wallet
}

/**
 * Mint test tokens using the API transaction endpoint.
 * The TestToken contract has an open mint function, so any wallet can call it.
 * Uses a test wallet created via Dynamic API to call the mint function.
 *
 * For local blockchain testing, use Arbitrum Sepolia (421614) as chainId.
 * Set RPC_URL_421614=http://localhost:8545 to route transactions to Anvil.
 */
export async function mintTestTokenViaFaucet({
  app,
  authToken,
  tokenAddress,
  recipientAddress,
  amount,
  chainId = 421614, // Default to Arbitrum Sepolia for local testing
}: {
  app: INestApplication<App>
  authToken: string
  tokenAddress: Address
  recipientAddress: Address
  amount: bigint
  chainId?: number
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Get or create a test wallet via Dynamic API to use for minting
    // The mint function is open, so any wallet can call it
    const minterWallet = await getOrCreateTestWallet({
      app,
      authToken,
      chainId,
    })

    // Encode the mint function call using @vencura/evm/node utilities
    const { encodeFunctionData } = await import('viem')
    const { testnetTokenAbi } = await import('@vencura/evm/abis')
    const mintData = encodeFunctionData({
      abi: testnetTokenAbi,
      functionName: 'mint',
      args: [recipientAddress, amount],
    })

    // Send transaction to call mint function on the token contract
    const response = await request(app.getHttpServer())
      .post(`/wallets/${minterWallet.id}/send`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        to: tokenAddress,
        amount: 0, // No native token transfer, just contract call
        data: mintData,
      })

    if (response.status === 200) {
      return { success: true, txHash: response.body.transactionHash }
    }

    return {
      success: false,
      error: `Failed to mint tokens: ${response.status} - ${JSON.stringify(response.body)}`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: `Failed to mint tokens: ${errorMessage}`,
    }
  }
}

/**
 * @deprecated Use mintTestTokenViaFaucet instead
 */
export async function mintTestTokenViaAPI({
  app,
  authToken,
  tokenAddress,
  recipientAddress,
  amount,
  chainId = 421614,
}: {
  app: INestApplication<App>
  authToken: string
  tokenAddress: Address
  recipientAddress: Address
  amount: bigint
  chainId?: number
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  return mintTestTokenViaFaucet({
    app,
    authToken,
    tokenAddress,
    recipientAddress,
    amount,
    chainId,
  })
}

export async function getTestAuthTokenHelper(): Promise<string> {
  return getTestAuthToken()
}

export async function waitForTransaction({
  delayMs = 1000,
}: {
  delayMs?: number
}): Promise<boolean> {
  await delay(delayMs)
  return true
}

/**
 * Get initial balance of a wallet before operations.
 * Used for balance delta assertions in tests.
 */
export async function getInitialBalance({
  app,
  authToken,
  walletId,
}: {
  app: INestApplication<App>
  authToken: string
  walletId: string
}): Promise<number> {
  const response = await request(app.getHttpServer())
    .get(`/wallets/${walletId}/balance`)
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200)

  return response.body.balance as number
}

/**
 * Assert that wallet balance changed by expected delta.
 * Accounts for account reuse - tests should assert deltas, not absolute values.
 */
export async function assertBalanceDelta({
  app,
  authToken,
  walletId,
  expectedDelta,
  initialBalance,
  tolerance = 0.0001,
}: {
  app: INestApplication<App>
  authToken: string
  walletId: string
  expectedDelta: number
  initialBalance: number
  tolerance?: number
}): Promise<void> {
  const currentBalance = await getInitialBalance({ app, authToken, walletId })
  const actualDelta = currentBalance - initialBalance
  const deltaDifference = Math.abs(actualDelta - expectedDelta)

  if (deltaDifference > tolerance) {
    throw new Error(
      `Balance delta assertion failed. Expected delta: ${expectedDelta}, Actual delta: ${actualDelta}, Initial: ${initialBalance}, Current: ${currentBalance}`,
    )
  }
}

/**
 * Mint test tokens and return initial and final balances.
 * Useful for tracking balance changes in tests.
 */
/**
 * Mint test tokens with balance tracking.
 * For local blockchain testing, use Arbitrum Sepolia (421614) as chainId.
 */
export async function mintTestTokenWithBalanceTracking({
  app,
  authToken,
  tokenAddress,
  recipientAddress,
  amount,
  chainId = 421614, // Default to Arbitrum Sepolia for local testing
}: {
  app: INestApplication<App>
  authToken: string
  tokenAddress: Address
  recipientAddress: Address
  amount: bigint
  chainId?: number
}): Promise<{
  success: boolean
  txHash?: string
  error?: string
  initialBalance?: number
  finalBalance?: number
}> {
  // Note: Token balance reads require a generic read endpoint
  // For now, we return the transaction result without balance tracking
  const result = await mintTestTokenViaFaucet({
    app,
    authToken,
    tokenAddress,
    recipientAddress,
    amount,
    chainId,
  })

  return {
    ...result,
    // TODO: Add balance tracking when generic read endpoint is available
    initialBalance: undefined,
    finalBalance: undefined,
  }
}
