import {
  type Address,
  type Chain,
  createPublicClient,
  createWalletClient,
  formatEther,
  getAddress,
  type Hash,
  type Hex,
  http,
  type PublicClient,
  parseEther,
  type WalletClient,
} from 'viem'
import { generatePrivateKey, privateKeyToAccount, signMessage } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import type { CustodialWallet } from '../db/schema/index.js'
import { decrypt, encrypt } from './crypto.js'
import { env } from './env.js'

const sepoliaChainId = 11155111

const defaultSepoliaRpc = 'https://sepolia.infura.io/v3/91de7ed3c17344cc95f8ea31bf6b3adf'

function getSepoliaRpcUrl(): string {
  return env.SEPOLIA_RPC_URL ?? defaultSepoliaRpc
}

export async function generateCustodialWallet(): Promise<{ address: string; privateKey: Hex }> {
  const privateKey = generatePrivateKey() as Hex
  const account = privateKeyToAccount(privateKey)
  const address = getAddress(account.address)
  return { address, privateKey }
}

export function encryptPrivateKey(plaintext: string): string | null {
  return encrypt(plaintext)
}

export function decryptPrivateKey(ciphertext: string): string | null {
  return decrypt(ciphertext)
}

function getHttpTransport(chainId: number) {
  if (chainId === sepoliaChainId) return http(getSepoliaRpcUrl())
  throw new Error(`Unsupported chain for custodial wallets: ${chainId}`)
}

export function getWalletClient(chainId: number, privateKey: Hex): WalletClient {
  const chain: Chain = chainId === sepoliaChainId ? sepolia : ({} as Chain)
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain,
    transport: getHttpTransport(chainId),
  })
}

export function getPublicClient(chainId: number): PublicClient {
  const chain: Chain = chainId === sepoliaChainId ? sepolia : ({} as Chain)
  return createPublicClient({
    chain,
    transport: getHttpTransport(chainId),
  })
}

export async function getWalletBalance(wallet: CustodialWallet): Promise<string> {
  // Test-only: read at call time so tests can set process.env per test; NODE_ENV guard prevents prod misuse
  const testBalance = process.env.NODE_ENV === 'test' && process.env.TEST_BALANCE_OVERRIDE // eslint-disable-line no-restricted-properties
  if (testBalance) return testBalance

  const decrypted = decryptPrivateKey(wallet.encryptedPrivateKey)
  if (!decrypted) throw new Error('Failed to decrypt private key')

  const publicClient = getPublicClient(wallet.chainId)
  const balance = await publicClient.getBalance({
    address: wallet.address as Address,
  })
  return balance.toString()
}

export async function signWalletMessage(wallet: CustodialWallet, message: string): Promise<string> {
  const decrypted = decryptPrivateKey(wallet.encryptedPrivateKey)
  if (!decrypted) throw new Error('Failed to decrypt private key')

  return signMessage({ message, privateKey: decrypted as Hex })
}

export async function sendWalletTransaction(
  wallet: CustodialWallet,
  to: string,
  amount: string,
): Promise<Hash> {
  // Test-only: read at call time so tests can set process.env per test; NODE_ENV guard prevents prod misuse
  const testOverride = process.env.NODE_ENV === 'test' && process.env.TEST_SEND_HASH_OVERRIDE // eslint-disable-line no-restricted-properties
  if (testOverride) return testOverride as Hash

  const decrypted = decryptPrivateKey(wallet.encryptedPrivateKey)
  if (!decrypted) throw new Error('Failed to decrypt private key')

  const normalizedTo = getAddress(to)
  const value = parseEther(amount)

  const walletClient = getWalletClient(wallet.chainId, decrypted as Hex)
  const account = walletClient.account
  if (!account) throw new Error('Wallet client has no account')

  const chain = wallet.chainId === sepoliaChainId ? sepolia : undefined
  try {
    const hash = await walletClient.sendTransaction({
      account,
      chain,
      to: normalizedTo,
      value,
    })
    return hash
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('insufficient funds') || msg.includes('INSUFFICIENT_FUNDS'))
      throw Object.assign(new Error('Insufficient funds'), { code: 'INSUFFICIENT_FUNDS' })
    throw err
  }
}

export { getAddress, parseEther, formatEther }
export type { Address, Hash, Hex }
