import { Elysia } from 'elysia'
import { balanceContract, BalanceSchema, BalanceInputSchema } from '@vencura/types'
import { getErrorMessage } from '@vencura/lib'
import { getBalanceService } from '../services/balance.service'
import { getUserId } from '../middleware/auth'

export const balanceRoute = new Elysia()
  .derive(({ request }) => ({
    userId: getUserId(request),
  }))
  .post(
    balanceContract.path,
    async ({ body, userId }) => {
      try {
        const result = await getBalanceService({
          userId,
          chainId: body.chainId,
          chainType: body.chainType,
          tokenAddress: body.tokenAddress,
        })

        // Validate response matches contract
        const balance = BalanceSchema.parse(result)

        return balance
      } catch (err) {
        // Handle errors - check for specific error types
        const errorMessage = getErrorMessage(err) ?? String(err)
        const lowerMessage = errorMessage.toLowerCase()

        // Check if this is a "wallet not found" error (404 Not Found)
        if (
          lowerMessage.includes('wallet not found') ||
          lowerMessage.includes('wallet does not exist')
        ) {
          return new Response(
            JSON.stringify({
              error: 'Wallet not found',
              message: errorMessage,
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Check if this is an unsupported chain error (400 Bad Request)
        if (
          lowerMessage.includes('unsupported chain') ||
          lowerMessage.includes('chain id') ||
          lowerMessage.includes('chain type')
        ) {
          return new Response(
            JSON.stringify({
              error: 'Invalid chain',
              message: errorMessage,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // All other errors are 500 Internal Server Error
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            message: errorMessage,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    },
    {
      body: BalanceInputSchema,
      detail: {
        summary: 'Get wallet balance',
        description:
          "Get balance for a user's wallet. Supports native token balance and ERC20 token balances. Requires chainId, chainType, and authentication. Optionally provide tokenAddress for ERC20 token balance.",
      },
    },
  )
