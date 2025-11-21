import { describe, it, expect, beforeAll } from 'vitest'
import { walletRoute } from './wallet'
import { testRoute } from '../test/utils/elysia'
import { WalletSchema } from '@vencura/types'

// Skip tests if Dynamic SDK credentials aren't set (real credentials required for blackbox tests)
const hasDynamicCredentials =
  process.env.DYNAMIC_ENVIRONMENT_ID &&
  process.env.DYNAMIC_API_TOKEN &&
  process.env.DYNAMIC_ENVIRONMENT_ID !== 'test-env-id' &&
  process.env.DYNAMIC_API_TOKEN !== 'test-api-token'

describe.skipIf(!hasDynamicCredentials)('walletRoute', () => {
  beforeAll(() => {
    // CRITICAL: Set ENCRYPTION_KEY for tests (mock env var, not SDK)
    process.env.ENCRYPTION_KEY = 'test-encryption-key-for-wallet-tests'
    // Dynamic SDK env vars should be set in environment for real SDK calls
    if (!process.env.DYNAMIC_ENVIRONMENT_ID || !process.env.DYNAMIC_API_TOKEN) {
      throw new Error('DYNAMIC_ENVIRONMENT_ID and DYNAMIC_API_TOKEN must be set for wallet tests')
    }
  })

  it('should create wallet via HTTP endpoint', async () => {
    // Blackbox test: hit HTTP endpoint, not internal handler
    const response = await testRoute(walletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        chainId: 421614, // Arbitrum Sepolia
      },
      headers: {
        'X-Test-User-Id': 'test-user-123',
      },
    })

    // Validate response matches contract
    expect(response.status).toBe(201) // New wallet created
    const data = await response.json()
    const wallet = WalletSchema.parse(data)

    expect(wallet).toHaveProperty('id')
    expect(wallet).toHaveProperty('address')
    expect(wallet).toHaveProperty('network')
    expect(wallet).toHaveProperty('chainType')
    expect(wallet.network).toBe('421614')
    expect(wallet.chainType).toBe('evm')
  })

  it('should return existing wallet on second request (idempotent)', async () => {
    // First request - create wallet
    const firstResponse = await testRoute(walletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        chainId: 421614,
      },
      headers: {
        'X-Test-User-Id': 'test-user-idempotent',
      },
    })

    expect(firstResponse.status).toBe(201)
    const firstData = await firstResponse.json()
    const firstWallet = WalletSchema.parse(firstData)

    // Second request - should return existing wallet with 200
    const secondResponse = await testRoute(walletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        chainId: 421614,
      },
      headers: {
        'X-Test-User-Id': 'test-user-idempotent',
      },
    })

    expect(secondResponse.status).toBe(200) // Existing wallet
    const secondData = await secondResponse.json()
    const secondWallet = WalletSchema.parse(secondData)

    // Should return same wallet
    expect(secondWallet.id).toBe(firstWallet.id)
    expect(secondWallet.address).toBe(firstWallet.address)
    expect(secondWallet.network).toBe(firstWallet.network)
  })

  it('should return 404 for unsupported chain', async () => {
    const response = await testRoute(walletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        chainId: 999999, // Unsupported chain
      },
      headers: {
        'X-Test-User-Id': 'test-user-123',
      },
    })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data).toHaveProperty('message')
    expect(data.error).toBe('Unsupported chain')
  })

  it('should return 400 for invalid chainId format', async () => {
    const response = await testRoute(walletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        // Missing chainId - should fail Zod validation
      },
      headers: {
        'X-Test-User-Id': 'test-user-123',
      },
    })

    // Zod validation should catch this and return 400
    expect(response.status).toBe(400)
  })

  it('should validate response matches WalletSchema contract', async () => {
    const response = await testRoute(walletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        chainId: 421614,
      },
      headers: {
        'X-Test-User-Id': 'test-user-validation',
      },
    })

    expect(response.status).toBe(201)
    const data = await response.json()

    // Should parse successfully with WalletSchema
    const wallet = WalletSchema.parse(data)
    expect(wallet.id).toBeTruthy()
    expect(wallet.address).toBeTruthy()
    expect(wallet.network).toBeTruthy()
    expect(wallet.chainType).toBeTruthy()
  })
})
