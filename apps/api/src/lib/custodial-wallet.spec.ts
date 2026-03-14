import { describe, expect, it } from 'vitest'
import {
  decryptPrivateKey,
  encryptPrivateKey,
  generateCustodialWallet,
  getAddress,
} from './custodial-wallet.js'

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
})
