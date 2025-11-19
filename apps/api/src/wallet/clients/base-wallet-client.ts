import { HttpException } from '@nestjs/common'

/**
 * Safe check if error is an HttpException.
 * Uses HttpException base class instead of specific exception types to avoid
 * "Right-hand side of 'instanceof' is not an object" errors when classes aren't loaded.
 */
export function isHttpException(error: unknown): error is HttpException {
  return error instanceof HttpException
}

/**
 * Result type from Dynamic SDK's createWalletAccount().
 * Aligned with Dynamic SDK return type: { accountAddress: string, externalServerKeyShares: string[] }
 * This matches the return type from both DynamicEvmWalletClient and DynamicSvmWalletClient.
 */
export interface CreateWalletResult {
  accountAddress: string
  externalServerKeyShares: string[]
}

export interface BalanceResult {
  balance: number
}

export interface SignMessageResult {
  signedMessage: string
}

export interface SendTransactionResult {
  transactionHash: string
}

export interface SendTransactionParams {
  to: string
  amount: number
  data?: string
}

/**
 * Base interface for chain-specific wallet clients
 */
export abstract class BaseWalletClient {
  abstract createWallet(): Promise<CreateWalletResult>
  abstract getBalance(address: string): Promise<BalanceResult>
  abstract signMessage(
    address: string,
    externalServerKeyShares: string[],
    message: string,
  ): Promise<SignMessageResult>
  abstract sendTransaction(
    address: string,
    externalServerKeyShares: string[],
    params: SendTransactionParams,
  ): Promise<SendTransactionResult>
}
