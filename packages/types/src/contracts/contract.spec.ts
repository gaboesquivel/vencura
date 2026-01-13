import { describe, it, expect } from 'vitest'
import { CONTRACT_BRAND } from './contract'
import {
  balanceContract,
  createWalletContract,
  sendTransactionContract,
  listWalletsContract,
} from './index'

describe('contract integrity', () => {
  const allContracts = [
    balanceContract,
    createWalletContract,
    sendTransactionContract,
    listWalletsContract,
  ]

  it('all contracts have method and path', () => {
    for (const contract of allContracts) {
      expect(contract).toHaveProperty('method')
      expect(contract).toHaveProperty('path')
      expect(typeof contract.method).toBe('string')
      expect(typeof contract.path).toBe('string')
      expect(contract.path.length).toBeGreaterThan(0)
    }
  })

  it('no duplicate method+path combinations', () => {
    const methodPathPairs = allContracts.map(c => `${c.method}:${c.path}`)
    const uniquePairs = new Set(methodPathPairs)
    expect(uniquePairs.size).toBe(methodPathPairs.length)
  })

  it('all contracts use defineContract (have brand symbol)', () => {
    for (const contract of allContracts) {
      expect(contract).toHaveProperty(CONTRACT_BRAND)
      expect((contract as Record<symbol, unknown>)[CONTRACT_BRAND]).toBe(true)
    }
  })
})
