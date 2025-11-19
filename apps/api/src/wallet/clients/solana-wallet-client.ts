import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import { getDefaultRpcUrl, type ChainMetadata } from '../../common/chains'
import {
  BaseWalletClient,
  isHttpException,
  type CreateWalletResult,
  type BalanceResult,
  type SignMessageResult,
  type SendTransactionResult,
  type SendTransactionParams,
} from './base-wallet-client'
import { LoggerService } from '../../common/logger/logger.service'

// Safe fields to log from Dynamic SDK responses
const SAFE_SDK_FIELDS = ['accountAddress', 'chainId', 'networkId'] as const

function sanitizeSdkResponse(response: unknown): Record<string, unknown> {
  if (!response || typeof response !== 'object') return {}

  const sanitized: Record<string, unknown> = {}
  const obj = response as Record<string, unknown>

  for (const field of SAFE_SDK_FIELDS) {
    if (field in obj) {
      sanitized[field] = obj[field]
    }
  }

  // Include error.message if present
  if ('error' in obj && obj.error && typeof obj.error === 'object') {
    const error = obj.error as Record<string, unknown>
    if ('message' in error && typeof error.message === 'string') {
      sanitized.errorMessage = error.message
    }
  }

  return sanitized
}

/**
 * Interface for Dynamic SDK's Solana wallet client.
 * Uses the actual Dynamic SDK client type - no manual duplication.
 * The client is imported dynamically, so we use an interface that matches the SDK's interface.
 */
interface DynamicSvmWalletClient {
  authenticateApiToken: (token: string) => Promise<void>
  createWalletAccount: (options: {
    thresholdSignatureScheme: unknown
    backUpToClientShareService: boolean
  }) => Promise<CreateWalletResult> // Use our aligned type instead of duplicating
  signMessage: (options: {
    accountAddress: string
    externalServerKeyShares: string[]
    message: string
  }) => Promise<string>
  signTransaction: (options: {
    accountAddress: string
    externalServerKeyShares: string[]
    transaction: Transaction
  }) => Promise<Transaction | Buffer>
}

@Injectable()
export class SolanaWalletClient extends BaseWalletClient {
  private dynamicSvmClient: DynamicSvmWalletClient | null = null
  private connection: Connection | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly chainMetadata: ChainMetadata,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {
    super()
  }

  private async getDynamicSvmClient(): Promise<DynamicSvmWalletClient> {
    if (this.dynamicSvmClient) return this.dynamicSvmClient

    try {
      const environmentId = this.configService.get<string>('dynamic.environmentId')
      const apiToken = this.configService.get<string>('dynamic.apiToken')

      if (!environmentId || !apiToken) {
        throw new InternalServerErrorException('Dynamic configuration is not set')
      }

      // Use dynamic import for ESM module compatibility
      // Dynamic SDK packages are ESM-only - dynamic import() works from CommonJS
      // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
      const module = await import('@dynamic-labs-wallet/node-svm')
      const DynamicSvmWalletClientClass = module.DynamicSvmWalletClient
      this.dynamicSvmClient = new DynamicSvmWalletClientClass({
        environmentId,
      }) as DynamicSvmWalletClient
      await this.dynamicSvmClient.authenticateApiToken(apiToken)

      return this.dynamicSvmClient
    } catch (error) {
      // Re-throw HTTP exceptions as-is (using safe HttpException check)
      if (isHttpException(error)) {
        throw error
      }

      // Convert Dynamic SDK errors to appropriate HTTP exceptions
      const errorMessage = error instanceof Error ? error.message : String(error)
      const lowerMessage = errorMessage.toLowerCase()

      // Authentication errors (401)
      if (
        lowerMessage.includes('authentication') ||
        lowerMessage.includes('token') ||
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('auth') ||
        lowerMessage.includes('credential') ||
        lowerMessage.includes('permission denied')
      ) {
        throw new UnauthorizedException(`Dynamic SDK authentication failed: ${errorMessage}`)
      }
      // Rate limit errors (429)
      if (
        lowerMessage.includes('rate limit') ||
        lowerMessage.includes('throttle') ||
        lowerMessage.includes('too many') ||
        lowerMessage.includes('quota') ||
        lowerMessage.includes('limit exceeded')
      ) {
        throw new HttpException(
          `Dynamic SDK rate limit exceeded: ${errorMessage}`,
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      // Network errors (502)
      if (
        lowerMessage.includes('network') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('econnrefused') ||
        lowerMessage.includes('enotfound') ||
        lowerMessage.includes('econnreset') ||
        lowerMessage.includes('socket') ||
        lowerMessage.includes('dns')
      ) {
        throw new BadGatewayException(`Dynamic SDK network error: ${errorMessage}`)
      }
      // Not found errors (404)
      if (
        lowerMessage.includes('not found') ||
        lowerMessage.includes('does not exist') ||
        lowerMessage.includes('missing') ||
        lowerMessage.includes('not available')
      ) {
        throw new BadRequestException(`Dynamic SDK resource not found: ${errorMessage}`)
      }
      // Forbidden errors (403)
      if (
        lowerMessage.includes('forbidden') ||
        lowerMessage.includes('access denied') ||
        lowerMessage.includes('not allowed')
      ) {
        throw new UnauthorizedException(`Dynamic SDK access forbidden: ${errorMessage}`)
      }

      // Log the error for debugging
      const errorStack = error instanceof Error ? error.stack : undefined
      this.logger.error('Dynamic SDK initialization error', {
        message: errorMessage,
        stack: errorStack,
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
      throw new InternalServerErrorException(`Failed to initialize Dynamic SDK: ${errorMessage}`)
    }
  }

  private getConnection(): Connection {
    if (this.connection) return this.connection

    // Get RPC URL with priority: custom env var > Dynamic default > Solana default
    const customRpcUrl = this.configService.get<string>(
      `rpc.${this.chainMetadata.dynamicNetworkId}`,
    )
    const rpcUrl =
      getDefaultRpcUrl(this.chainMetadata.chainId, customRpcUrl) ||
      this.chainMetadata.defaultRpcUrl ||
      'https://api.mainnet-beta.solana.com'

    this.connection = new Connection(rpcUrl, 'confirmed')
    return this.connection
  }

  async createWallet(): Promise<CreateWalletResult> {
    try {
      this.logger.info('Creating Solana wallet', {
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })

      const dynamicSvmClient = await this.getDynamicSvmClient()

      // Use dynamic import for ESM module compatibility
      // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
      const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')

      // Leverage Dynamic SDK return type directly - no unnecessary mapping
      const wallet = await dynamicSvmClient.createWalletAccount({
        thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
        backUpToClientShareService: false,
      })

      // Log SDK response at debug level if flag is set, otherwise log sanitized version
      if (process.env.LOG_SDK_DEBUG === 'true') {
        this.logger.debug('Dynamic SDK wallet creation response', {
          response: wallet,
          chainId: this.chainMetadata.chainId,
        })
      } else {
        const sanitized = sanitizeSdkResponse(wallet)
        this.logger.info('Solana wallet created successfully', {
          ...sanitized,
          chainId: this.chainMetadata.chainId,
        })
      }

      // Return Dynamic SDK result directly (matches CreateWalletResult interface)
      return wallet
    } catch (error) {
      // Re-throw HTTP exceptions as-is (using safe HttpException check)
      if (isHttpException(error)) {
        throw error
      }

      // Convert Dynamic SDK errors to appropriate HTTP exceptions
      const errorMessage = error instanceof Error ? error.message : String(error)
      const lowerMessage = errorMessage.toLowerCase()

      // Multiple wallets per chain not allowed (400) - Check FIRST before other error types
      // Check error status code if available (Dynamic SDK errors have status property)
      const errorStatus = (error as any)?.status || (error as any)?.error?.status
      // Check nested error message (Dynamic SDK wraps errors)
      const nestedError = (error as any)?.error
      const nestedErrorMessage = nestedError ? String(nestedError).toLowerCase() : ''
      // Check error.cause for Node.js error chaining
      const causeMessage = (error as any)?.cause?.message
        ? String((error as any).cause.message).toLowerCase()
        : ''
      // Check if nested error is an object with message property
      const nestedErrorObjMessage =
        nestedError && typeof nestedError === 'object' && nestedError.message
          ? String(nestedError.message).toLowerCase()
          : ''
      // Check entire error object string representation (catches all properties)
      let errorString = ''
      try {
        errorString = JSON.stringify(error).toLowerCase()
      } catch {
        // Ignore circular reference errors
        errorString = ''
      }

      if (
        errorStatus === 400 ||
        lowerMessage.includes('multiple wallets per chain') ||
        lowerMessage.includes('wallet already exists') ||
        nestedErrorMessage.includes('multiple wallets per chain') ||
        nestedErrorMessage.includes('wallet already exists') ||
        causeMessage.includes('multiple wallets per chain') ||
        causeMessage.includes('wallet already exists') ||
        nestedErrorObjMessage.includes('multiple wallets per chain') ||
        nestedErrorObjMessage.includes('wallet already exists') ||
        errorString.includes('multiple wallets per chain') ||
        errorString.includes('wallet already exists')
      ) {
        this.logger.warn('Wallet already exists for chain', {
          chainId: this.chainMetadata.chainId,
          dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
        })
        throw new BadRequestException('Wallet already exists for this chain')
      }

      // Authentication errors (401)
      if (
        lowerMessage.includes('authentication') ||
        lowerMessage.includes('token') ||
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('auth') ||
        lowerMessage.includes('credential') ||
        lowerMessage.includes('permission denied')
      ) {
        throw new UnauthorizedException(`Failed to create wallet: ${errorMessage}`)
      }
      // Rate limit errors (429)
      if (
        lowerMessage.includes('rate limit') ||
        lowerMessage.includes('throttle') ||
        lowerMessage.includes('too many') ||
        lowerMessage.includes('quota') ||
        lowerMessage.includes('limit exceeded')
      ) {
        throw new HttpException(
          `Failed to create wallet: ${errorMessage}`,
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      // Network errors (502)
      if (
        lowerMessage.includes('network') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('econnrefused') ||
        lowerMessage.includes('enotfound') ||
        lowerMessage.includes('econnreset') ||
        lowerMessage.includes('socket') ||
        lowerMessage.includes('dns')
      ) {
        throw new BadGatewayException(`Failed to create wallet: ${errorMessage}`)
      }
      // Not found errors (404)
      if (
        lowerMessage.includes('not found') ||
        lowerMessage.includes('does not exist') ||
        lowerMessage.includes('missing') ||
        lowerMessage.includes('not available')
      ) {
        throw new BadRequestException(`Failed to create wallet: ${errorMessage}`)
      }
      // Forbidden errors (403)
      if (
        lowerMessage.includes('forbidden') ||
        lowerMessage.includes('access denied') ||
        lowerMessage.includes('not allowed')
      ) {
        throw new UnauthorizedException(`Failed to create wallet: ${errorMessage}`)
      }

      // Log the error for debugging
      const errorStack = error instanceof Error ? error.stack : undefined
      this.logger.error('Dynamic SDK wallet creation error', {
        message: errorMessage,
        stack: errorStack,
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
      throw new InternalServerErrorException(`Failed to create wallet: ${errorMessage}`)
    }
  }

  async getBalance(address: string): Promise<BalanceResult> {
    const connection = this.getConnection()
    const publicKey = new PublicKey(address)

    const balance = await connection.getBalance(publicKey)

    return {
      balance: balance / LAMPORTS_PER_SOL,
    }
  }

  async signMessage(
    address: string,
    externalServerKeyShares: string[],
    message: string,
  ): Promise<SignMessageResult> {
    try {
      this.logger.info('Signing Solana message', {
        address,
        chainId: this.chainMetadata.chainId,
        messageLength: message.length,
      })

      const dynamicSvmClient = await this.getDynamicSvmClient()

      const signature = await dynamicSvmClient.signMessage({
        accountAddress: address,
        externalServerKeyShares,
        message,
      })

      this.logger.info('Solana message signed successfully', {
        address,
        chainId: this.chainMetadata.chainId,
      })

      return {
        signedMessage: signature,
      }
    } catch (error) {
      // Re-throw HTTP exceptions as-is (using safe HttpException check)
      if (isHttpException(error)) {
        throw error
      }

      // Convert Dynamic SDK errors to appropriate HTTP exceptions
      const errorMessage = error instanceof Error ? error.message : String(error)
      const lowerMessage = errorMessage.toLowerCase()

      // Authentication errors (401)
      if (
        lowerMessage.includes('authentication') ||
        lowerMessage.includes('token') ||
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('auth') ||
        lowerMessage.includes('credential') ||
        lowerMessage.includes('permission denied')
      ) {
        throw new UnauthorizedException(`Failed to sign message: ${errorMessage}`)
      }
      // Rate limit errors (429)
      if (
        lowerMessage.includes('rate limit') ||
        lowerMessage.includes('throttle') ||
        lowerMessage.includes('too many') ||
        lowerMessage.includes('quota') ||
        lowerMessage.includes('limit exceeded')
      ) {
        throw new HttpException(
          `Failed to sign message: ${errorMessage}`,
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      // Network errors (502)
      if (
        lowerMessage.includes('network') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('econnrefused') ||
        lowerMessage.includes('enotfound') ||
        lowerMessage.includes('econnreset') ||
        lowerMessage.includes('socket') ||
        lowerMessage.includes('dns')
      ) {
        throw new BadGatewayException(`Failed to sign message: ${errorMessage}`)
      }
      // Not found errors (404)
      if (
        lowerMessage.includes('not found') ||
        lowerMessage.includes('does not exist') ||
        lowerMessage.includes('missing') ||
        lowerMessage.includes('not available')
      ) {
        throw new BadRequestException(`Failed to sign message: ${errorMessage}`)
      }
      // Forbidden errors (403)
      if (
        lowerMessage.includes('forbidden') ||
        lowerMessage.includes('access denied') ||
        lowerMessage.includes('not allowed')
      ) {
        throw new UnauthorizedException(`Failed to sign message: ${errorMessage}`)
      }

      // Log the error for debugging
      const errorStack = error instanceof Error ? error.stack : undefined
      this.logger.error('Dynamic SDK sign message error', {
        message: errorMessage,
        stack: errorStack,
        address,
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
      throw new InternalServerErrorException(`Failed to sign message: ${errorMessage}`)
    }
  }

  async sendTransaction(
    address: string,
    externalServerKeyShares: string[],
    params: SendTransactionParams,
  ): Promise<SendTransactionResult> {
    try {
      // Destructure params
      const { to, amount } = params

      this.logger.info('Sending Solana transaction', {
        address,
        to,
        amount,
        chainId: this.chainMetadata.chainId,
      })

      const dynamicSvmClient = await this.getDynamicSvmClient()
      const connection = this.getConnection()

      const fromPublicKey = new PublicKey(address)
      const toPublicKey = new PublicKey(to)

      // Create a transfer transaction using SystemProgram
      const lamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL))
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: Number(lamports),
        }),
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPublicKey

      // Sign transaction using Dynamic SDK
      const signedTransaction = await dynamicSvmClient.signTransaction({
        accountAddress: address,
        externalServerKeyShares,
        transaction,
      })

      // Send transaction - Dynamic SDK may return Transaction object or serialized Buffer
      let signature: string
      if (signedTransaction instanceof Transaction) {
        // Serialize the transaction and send as raw transaction
        signature = await connection.sendRawTransaction(signedTransaction.serialize())
      } else if (Buffer.isBuffer(signedTransaction)) {
        signature = await connection.sendRawTransaction(signedTransaction)
      } else {
        // Try to serialize if it's a Transaction-like object
        const tx = signedTransaction as Transaction
        signature = await connection.sendRawTransaction(tx.serialize())
      }

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')

      this.logger.info('Solana transaction sent successfully', {
        address,
        to,
        transactionHash: signature,
        chainId: this.chainMetadata.chainId,
      })

      return {
        transactionHash: signature,
      }
    } catch (error) {
      // Re-throw HTTP exceptions as-is (using safe HttpException check)
      if (isHttpException(error)) {
        throw error
      }

      // Convert Dynamic SDK errors to appropriate HTTP exceptions
      const errorMessage = error instanceof Error ? error.message : String(error)
      const lowerMessage = errorMessage.toLowerCase()

      // Authentication errors (401)
      if (
        lowerMessage.includes('authentication') ||
        lowerMessage.includes('token') ||
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('auth') ||
        lowerMessage.includes('credential') ||
        lowerMessage.includes('permission denied')
      ) {
        throw new UnauthorizedException(`Failed to send transaction: ${errorMessage}`)
      }
      // Rate limit errors (429)
      if (
        lowerMessage.includes('rate limit') ||
        lowerMessage.includes('throttle') ||
        lowerMessage.includes('too many') ||
        lowerMessage.includes('quota') ||
        lowerMessage.includes('limit exceeded')
      ) {
        throw new HttpException(
          `Failed to send transaction: ${errorMessage}`,
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      // Network errors (502)
      if (
        lowerMessage.includes('network') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('econnrefused') ||
        lowerMessage.includes('enotfound') ||
        lowerMessage.includes('econnreset') ||
        lowerMessage.includes('socket') ||
        lowerMessage.includes('dns')
      ) {
        throw new BadGatewayException(`Failed to send transaction: ${errorMessage}`)
      }
      // Not found errors (404)
      if (
        lowerMessage.includes('not found') ||
        lowerMessage.includes('does not exist') ||
        lowerMessage.includes('missing') ||
        lowerMessage.includes('not available')
      ) {
        throw new BadRequestException(`Failed to send transaction: ${errorMessage}`)
      }
      // Forbidden errors (403)
      if (
        lowerMessage.includes('forbidden') ||
        lowerMessage.includes('access denied') ||
        lowerMessage.includes('not allowed')
      ) {
        throw new UnauthorizedException(`Failed to send transaction: ${errorMessage}`)
      }

      // Log the error for debugging
      const errorStack = error instanceof Error ? error.stack : undefined
      this.logger.error('Dynamic SDK send transaction error', {
        message: errorMessage,
        stack: errorStack,
        address,
        to: params.to,
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
      throw new InternalServerErrorException(`Failed to send transaction: ${errorMessage}`)
    }
  }
}
