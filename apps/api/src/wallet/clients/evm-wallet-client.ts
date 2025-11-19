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
// Lodash imports removed - using direct imports for ESM compatibility
import {
  createWalletClient,
  createPublicClient,
  http,
  formatEther,
  parseEther,
  type LocalAccount,
  type Hex,
  type TypedData,
  type SignableMessage,
  type TransactionSerializable,
} from 'viem'
import type { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm'
import { getViemChain, getDefaultRpcUrl, type ChainMetadata } from '../../common/chains'
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

@Injectable()
export class EvmWalletClient extends BaseWalletClient {
  private dynamicEvmClient: DynamicEvmWalletClient | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly chainMetadata: ChainMetadata,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {
    super()
  }

  private async getDynamicEvmClient(): Promise<DynamicEvmWalletClient> {
    if (this.dynamicEvmClient) return this.dynamicEvmClient

    try {
      const environmentId = this.configService.get<string>('dynamic.environmentId')
      const apiToken = this.configService.get<string>('dynamic.apiToken')

      if (!environmentId || !apiToken) {
        throw new InternalServerErrorException('Dynamic configuration is not set')
      }

      // Use dynamic import for ESM module compatibility
      // Dynamic SDK packages are ESM-only - dynamic import() works from CommonJS
      // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
      const module = await import('@dynamic-labs-wallet/node-evm')
      const DynamicEvmWalletClientClass = module.DynamicEvmWalletClient
      this.dynamicEvmClient = new DynamicEvmWalletClientClass({ environmentId })
      await this.dynamicEvmClient.authenticateApiToken(apiToken)

      return this.dynamicEvmClient
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

  async createWallet(): Promise<CreateWalletResult> {
    try {
      this.logger.info('Creating EVM wallet', {
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })

      const dynamicEvmClient = await this.getDynamicEvmClient()

      // Use dynamic import for ESM module compatibility
      // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
      const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')

      // Leverage Dynamic SDK return type directly - no unnecessary mapping
      const wallet = await dynamicEvmClient.createWalletAccount({
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
        this.logger.info('EVM wallet created successfully', {
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
    // Destructure chainMetadata
    const { chainId, dynamicNetworkId } = this.chainMetadata

    const viemChain = getViemChain(chainId)
    if (!viemChain) throw new Error(`Unsupported EVM chain: ${chainId}`)

    // Get RPC URL with priority: custom env var > Dynamic default > viem default
    const customRpcUrl = this.configService.get<string>(`rpc.${dynamicNetworkId}`)
    const rpcUrl = getDefaultRpcUrl(chainId, customRpcUrl) || viemChain.rpcUrls.default.http[0]

    const client = createPublicClient({
      chain: viemChain,
      transport: http(rpcUrl),
    })

    const balance = await client.getBalance({
      address: address as `0x${string}`,
    })

    return {
      balance: parseFloat(formatEther(balance)),
    }
  }

  async signMessage(
    address: string,
    externalServerKeyShares: string[],
    message: string,
  ): Promise<SignMessageResult> {
    try {
      this.logger.info('Signing EVM message', {
        address,
        chainId: this.chainMetadata.chainId,
        messageLength: message.length,
      })

      const dynamicEvmClient = await this.getDynamicEvmClient()

      const signature = await dynamicEvmClient.signMessage({
        accountAddress: address,
        externalServerKeyShares,
        message,
      })

      this.logger.info('EVM message signed successfully', {
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
      // Destructure chainMetadata and params
      const { chainId, dynamicNetworkId } = this.chainMetadata
      const { to, amount, data } = params

      this.logger.info('Sending EVM transaction', {
        address,
        to,
        amount,
        chainId,
        hasData: !!data,
      })

      const viemChain = getViemChain(chainId)
      if (!viemChain) {
        throw new InternalServerErrorException(`Unsupported EVM chain: ${chainId}`)
      }

      const dynamicEvmClient = await this.getDynamicEvmClient()

      // Get RPC URL with priority: custom env var > Dynamic default > viem default
      const customRpcUrl = this.configService.get<string>(`rpc.${dynamicNetworkId}`)
      const rpcUrl = getDefaultRpcUrl(chainId, customRpcUrl) || viemChain.rpcUrls.default.http[0]

      // Helper to convert SignableMessage to string for Dynamic SDK
      const messageToString = (message: SignableMessage): string => {
        if (typeof message === 'string') return message
        if (message instanceof Uint8Array) {
          return new TextDecoder().decode(message)
        }
        if ('raw' in message) {
          if (typeof message.raw === 'string') return message.raw
          return new TextDecoder().decode(message.raw)
        }
        return String(message)
      }

      // Create a wallet account that can sign transactions
      const account = {
        address: address as `0x${string}`,
        type: 'local' as const,
        signMessage: async ({ message }: { message: SignableMessage }) => {
          const messageStr = messageToString(message)
          return (await dynamicEvmClient.signMessage({
            accountAddress: address,
            externalServerKeyShares,
            message: messageStr,
          })) as Hex
        },
        signTypedData: async <const TTypedData extends TypedData | { [key: string]: unknown }>(
          parameters: TTypedData,
        ) =>
          (await dynamicEvmClient.signTypedData({
            accountAddress: address,
            externalServerKeyShares,
            typedData: parameters,
          })) as Hex,
        signTransaction: async <
          transaction extends TransactionSerializable = TransactionSerializable,
        >(
          transaction: transaction,
        ) =>
          (await dynamicEvmClient.signTransaction({
            senderAddress: address,
            externalServerKeyShares,
            transaction,
          })) as Hex,
      } as LocalAccount

      const walletClient = createWalletClient({
        account,
        chain: viemChain,
        transport: http(rpcUrl),
      })

      const hash = await walletClient.sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount.toString()),
        ...(data && { data: data as Hex }),
      })

      this.logger.info('EVM transaction sent successfully', {
        address,
        to,
        transactionHash: hash,
        chainId,
      })

      return {
        transactionHash: hash,
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
