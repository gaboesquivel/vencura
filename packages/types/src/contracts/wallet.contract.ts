import { z } from 'zod'
import { defineContract } from './contract'
import {
  CreateWalletInputSchema,
  WalletSchema,
  SendTransactionInputSchema,
  SendTransactionResultSchema,
  ListWalletsResponseSchema,
} from '../schemas/wallet.schema'

// Params schema for wallet ID
const WalletIdParamsSchema = z.object({
  id: z.string().min(1),
})

/**
 * Create wallet endpoint contract.
 * Defines the POST /wallets endpoint structure.
 */
export const createWalletContract = defineContract({
  method: 'POST',
  path: '/wallets',
  body: CreateWalletInputSchema,
  response: WalletSchema,
  openapi: {
    summary: 'Create a new custodial wallet',
    description:
      'Create a wallet for a chain type. Returns 201 for new wallets, 200 for existing wallets (idempotent). One wallet per chainType.',
    tags: ['wallets'],
    operationId: 'wallets_create',
  },
})

export type CreateWalletContract = typeof createWalletContract

/**
 * Send transaction endpoint contract.
 * Defines the POST /wallets/:id/send endpoint structure.
 */
export const sendTransactionContract = defineContract({
  method: 'POST',
  path: '/wallets/:id/send',
  params: WalletIdParamsSchema,
  body: SendTransactionInputSchema,
  response: SendTransactionResultSchema,
  openapi: {
    summary: 'Send a transaction from a wallet',
    description:
      'Send a transaction from a custodial wallet. Only EVM chains are currently supported.',
    tags: ['wallets'],
    operationId: 'wallets_sendTransaction',
  },
})

export type SendTransactionContract = typeof sendTransactionContract

/**
 * List wallets endpoint contract.
 * Defines the GET /wallets endpoint structure.
 */
export const listWalletsContract = defineContract({
  method: 'GET',
  path: '/wallets',
  response: ListWalletsResponseSchema,
  openapi: {
    summary: 'List all wallets for the authenticated user',
    description: 'Get all wallets associated with the authenticated user.',
    tags: ['wallets'],
    operationId: 'wallets_list',
  },
})

export type ListWalletsContract = typeof listWalletsContract
