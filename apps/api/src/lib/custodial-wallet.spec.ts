import { withTestEnvOverride } from '@test/utils/test-env-override.js'
import { describe, expect, it } from 'vitest'
import type { CustodialWallet } from '../db/schema/index.js'
import {
  decryptPrivateKey,
  encryptPrivateKey,
  generateCustodialWallet,
  getAddress,
  signWalletMessage,
} from './custodial-wallet.js'

function createMockWallet(overrides: Partial<CustodialWallet> = {}): CustodialWallet {
  return {
    id: 'test',
    userId: 'test',
    address: '0x0000000000000000000000000000000000000001',
    encryptedPrivateKey: 'x',
    chainId: 11155111,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('custodial-wallet', () => {
  describe('generateCustodialWallet', () => {
    it('should produce address and privateKey', async () => {
      const { address, privateKey } = await generateCustodialWallet()
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    it('should produce unique addresses per call', async () => {
      const [a, b] = await Promise.all([generateCustodialWallet(), generateCustodialWallet()])
      expect(a.address).not.toBe(b.address)
      expect(a.privateKey).not.toBe(b.privateKey)
    })

    it('should produce checksummed address via getAddress', async () => {
      const { address } = await generateCustodialWallet()
      const checksummed = getAddress(address)
      expect(checksummed).toBe(address)
    })
  })

  describe('encryptPrivateKey / decryptPrivateKey', () => {
    it('should roundtrip a private key', async () => {
      const { privateKey } = await generateCustodialWallet()
      const encrypted = encryptPrivateKey(privateKey)
      expect(encrypted).toBeTruthy()
      expect(encrypted).not.toBe(privateKey)
      if (!encrypted) return
      const decrypted = decryptPrivateKey(encrypted)
      expect(decrypted).toBe(privateKey)
    })

    it('should return null for empty input', () => {
      expect(encryptPrivateKey('')).toBeNull()
      expect(decryptPrivateKey('')).toBeNull()
    })

    it('should produce different ciphertext for same key (random IV)', async () => {
      const { privateKey } = await generateCustodialWallet()
      const enc1 = encryptPrivateKey(privateKey)
      const enc2 = encryptPrivateKey(privateKey)
      expect(enc1).not.toBe(enc2)
      if (enc1) expect(decryptPrivateKey(enc1)).toBe(privateKey)
      if (enc2) expect(decryptPrivateKey(enc2)).toBe(privateKey)
    })
  })

  describe('signWalletMessage', () => {
    it('should return hex signature for valid wallet', async () => {
      const { address, privateKey } = await generateCustodialWallet()
      const encrypted = encryptPrivateKey(privateKey)
      if (!encrypted) throw new Error('encrypt failed')

      const wallet = createMockWallet({ address, encryptedPrivateKey: encrypted })
      const signed = await signWalletMessage(wallet, 'Hello')
      expect(signed).toMatch(/^0x[a-fA-F0-9]+$/)
      expect(signed.length).toBeGreaterThan(130)
    })

    it('should throw when encrypted key fails to decrypt', async () => {
      const wallet = createMockWallet({ encryptedPrivateKey: 'invalid' })
      await expect(signWalletMessage(wallet, 'x')).rejects.toThrow('Failed to decrypt')
    })
  })

  describe('getWalletBalance', () => {
    it('should return balance string when TEST_BALANCE_OVERRIDE is set', async () => {
      await withTestEnvOverride('TEST_BALANCE_OVERRIDE', '1000000000000000000', async () => {
        const { getWalletBalance } = await import('./custodial-wallet.js')
        const wallet = createMockWallet()
        const balance = await getWalletBalance(wallet)
        expect(balance).toBe('1000000000000000000')
      })
    })
  })

  describe('sendWalletTransaction', () => {
    it('should return hash when TEST_SEND_HASH_OVERRIDE is set', async () => {
      await withTestEnvOverride('TEST_SEND_HASH_OVERRIDE', '0xabcd1234', async () => {
        const { sendWalletTransaction } = await import('./custodial-wallet.js')
        const { address, privateKey } = await generateCustodialWallet()
        const encrypted = encryptPrivateKey(privateKey)
        if (!encrypted) throw new Error('encrypt failed')

        const wallet = createMockWallet({ address, encryptedPrivateKey: encrypted })
        const hash = await sendWalletTransaction(
          wallet,
          '0x0000000000000000000000000000000000000001',
          '0.001',
        )
        expect(hash).toBe('0xabcd1234')
      })
    })

    it('should throw INSUFFICIENT_FUNDS when RPC returns insufficient funds', async () => {
      const { sendWalletTransaction } = await import('./custodial-wallet.js')
      const { address, privateKey } = await generateCustodialWallet()
      const encrypted = encryptPrivateKey(privateKey)
      if (!encrypted) throw new Error('encrypt failed')

      const wallet = createMockWallet({ address, encryptedPrivateKey: encrypted })
      await expect(
        sendWalletTransaction(wallet, '0x0000000000000000000000000000000000000001', '1'),
      ).rejects.toMatchObject({ code: 'INSUFFICIENT_FUNDS' })
    })
  })
})
