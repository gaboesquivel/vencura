import { defineContract } from './contract'
import { BalanceInputSchema, BalanceSchema } from '../schemas/balance.schema'

/**
 * Get balance endpoint contract.
 * Defines the POST /wallets/balance endpoint structure.
 */
export const balanceContract = defineContract({
  method: 'POST',
  path: '/wallets/balance',
  body: BalanceInputSchema,
  response: BalanceSchema,
  openapi: {
    summary: 'Get wallet balance',
    description:
      "Get balance for a user's wallet. Supports native token balance and ERC20 token balances. Requires chainId, chainType, and authentication. Optionally provide tokenAddress for ERC20 token balance.",
    tags: ['wallets'],
    operationId: 'wallets_getBalance',
  },
  mcp: {
    toolName: 'wallets.balance',
    description: 'Return wallet balance for a chain/token',
  },
})

export type BalanceContract = typeof balanceContract
