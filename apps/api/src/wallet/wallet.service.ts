import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EncryptionService } from '../common/encryption.service'
import {
  getChainMetadata,
  getDynamicNetworkId,
  getDynamicCompatibleChainId,
  isSupportedChain,
  getChainType,
} from '../common/chains'
import { validateAddress } from '../common/address-validation'
import type { ChainType } from '@vencura/types'
import { WalletClientFactory } from './clients/wallet-client-factory'
import type {
  BalanceResult,
  SignMessageResult,
  SendTransactionResult,
} from './clients/base-wallet-client'
import * as schema from '../database/schema'
import { eq, and } from 'drizzle-orm'

@Injectable()
export class WalletService {
  constructor(
    @Inject('DATABASE')
    private readonly db: ReturnType<typeof import('drizzle-orm/pglite').drizzle>,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
    private readonly walletClientFactory: WalletClientFactory,
  ) {}

  async createWallet(
    userId: string,
    chainId: number | string,
  ): Promise<{ id: string; address: string; network: string; chainType: ChainType }> {
    // Map local chain IDs to Dynamic-compatible chain IDs (e.g., 31337 -> 421614)
    // This ensures Dynamic SDK operations use supported chain IDs while RPC can point to localhost
    const compatibleChainId = getDynamicCompatibleChainId(chainId)

    // Validate chain is supported (using compatible chain ID)
    if (!isSupportedChain(compatibleChainId)) {
      throw new BadRequestException(
        `Unsupported chain: ${chainId}. Please provide a valid chain ID or Dynamic network ID.`,
      )
    }

    // Get chain metadata and Dynamic network ID (using compatible chain ID)
    const chainMetadata = getChainMetadata(compatibleChainId)
    if (!chainMetadata) throw new BadRequestException(`Invalid chain: ${compatibleChainId}`)

    const dynamicNetworkId = getDynamicNetworkId(compatibleChainId)
    if (!dynamicNetworkId)
      throw new BadRequestException(
        `Could not determine Dynamic network ID for chain: ${compatibleChainId}`,
      )

    const chainType = getChainType(compatibleChainId)
    if (!chainType)
      throw new BadRequestException(
        `Could not determine chain type for chain: ${compatibleChainId}`,
      )

    // Get appropriate wallet client (using compatible chain ID)
    // Note: RPC URL will still point to localhost if configured via RPC_URL_421614=http://localhost:8545
    const walletClient = this.walletClientFactory.createWalletClient(compatibleChainId)
    if (!walletClient)
      throw new BadRequestException(`Wallet client not available for chain: ${compatibleChainId}`)

    // Create wallet using chain-specific client
    const wallet = await walletClient.createWallet()

    // Encrypt and store the key shares
    const keySharesEncrypted = await this.encryptionService.encrypt(
      JSON.stringify(wallet.externalServerKeyShares),
    )

    const walletId = crypto.randomUUID()

    await this.db.insert(schema.wallets).values({
      id: walletId,
      userId,
      address: wallet.accountAddress,
      privateKeyEncrypted: keySharesEncrypted,
      network: dynamicNetworkId,
      chainType,
    })

    return {
      id: walletId,
      address: wallet.accountAddress,
      network: dynamicNetworkId,
      chainType,
    }
  }

  async getUserWallets(
    userId: string,
  ): Promise<Array<{ id: string; address: string; network: string; chainType: ChainType }>> {
    const wallets = await this.db
      .select({
        id: schema.wallets.id,
        address: schema.wallets.address,
        network: schema.wallets.network,
        chainType: schema.wallets.chainType,
      })
      .from(schema.wallets)
      .where(eq(schema.wallets.userId, userId))

    // Type assertion to ensure chainType matches schema union type
    // Database returns string, but schema expects union of specific chain types
    return wallets.map(wallet => ({
      ...wallet,
      chainType: wallet.chainType as
        | 'evm'
        | 'solana'
        | 'cosmos'
        | 'bitcoin'
        | 'flow'
        | 'starknet'
        | 'algorand'
        | 'sui'
        | 'spark'
        | 'tron',
    }))
  }

  async getBalance(walletId: string, userId: string): Promise<BalanceResult> {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(and(eq(schema.wallets.id, walletId), eq(schema.wallets.userId, userId)))
      .limit(1)

    if (!wallet) throw new NotFoundException('Wallet not found')

    // Get appropriate wallet client based on stored network/chain type
    const walletClient = this.walletClientFactory.createWalletClient(wallet.network)
    if (!walletClient)
      throw new BadRequestException(`Wallet client not available for network: ${wallet.network}`)

    // Get balance using chain-specific client
    return await walletClient.getBalance(wallet.address)
  }

  async signMessage(walletId: string, userId: string, message: string): Promise<SignMessageResult> {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(and(eq(schema.wallets.id, walletId), eq(schema.wallets.userId, userId)))
      .limit(1)

    if (!wallet) throw new NotFoundException('Wallet not found')

    const keySharesEncrypted = await this.encryptionService.decrypt(wallet.privateKeyEncrypted)
    const externalServerKeyShares = JSON.parse(keySharesEncrypted) as string[]

    // Get appropriate wallet client based on stored network/chain type
    const walletClient = this.walletClientFactory.createWalletClient(wallet.network)
    if (!walletClient)
      throw new BadRequestException(`Wallet client not available for network: ${wallet.network}`)

    // Sign message using chain-specific client
    return await walletClient.signMessage(wallet.address, externalServerKeyShares, message)
  }

  async sendTransaction(
    walletId: string,
    userId: string,
    to: string,
    amount: number,
    data?: string,
  ): Promise<SendTransactionResult> {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(and(eq(schema.wallets.id, walletId), eq(schema.wallets.userId, userId)))
      .limit(1)

    if (!wallet) throw new NotFoundException('Wallet not found')

    // Destructure wallet properties
    const { network, address, privateKeyEncrypted, chainType: chainTypeRaw } = wallet

    // Validate chainType is a valid ChainType
    const validChainTypes: readonly ChainType[] = [
      'evm',
      'solana',
      'cosmos',
      'bitcoin',
      'flow',
      'starknet',
      'algorand',
      'sui',
      'spark',
      'tron',
    ] as const

    // Type guard to narrow chainTypeRaw to ChainType
    if (!validChainTypes.includes(chainTypeRaw as ChainType)) {
      throw new BadRequestException(`Invalid chain type: ${chainTypeRaw}`)
    }

    // Type is now validated, safe to use
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const chainType = chainTypeRaw as ChainType

    // Validate recipient address based on wallet's chain type
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    if (!validateAddress({ address: to, chainType: chainType })) {
      throw new BadRequestException(
        `Invalid address format for chain type ${chainType}. Please provide a valid ${chainType} address.`,
      )
    }

    const keySharesEncrypted = await this.encryptionService.decrypt(privateKeyEncrypted)
    const externalServerKeyShares = JSON.parse(keySharesEncrypted) as string[]

    // Get appropriate wallet client based on stored network/chain type
    const walletClient = this.walletClientFactory.createWalletClient(network)
    if (!walletClient)
      throw new BadRequestException(`Wallet client not available for network: ${network}`)

    // Send transaction using chain-specific client
    return await walletClient.sendTransaction(address, externalServerKeyShares, {
      to,
      amount,
      ...(data && { data }),
    })
  }
}
