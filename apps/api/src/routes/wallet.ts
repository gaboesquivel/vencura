import { Elysia } from 'elysia'
import { createWalletContract, WalletSchema, CreateWalletInputSchema } from '@vencura/types'
import { createWalletService } from '../services/wallet.service'
import { getUserId } from '../middleware/auth'
import { isSupportedChain } from '../services/chain-utils'

export const walletRoute = new Elysia()
  .derive(({ request }) => ({
    userId: getUserId(request),
  }))
  .post(
    createWalletContract.path,
    async ({ body, userId }) => {
      // Validate body with Zod schema (400 if invalid)
      let chainId: number | string
      try {
        const validatedBody = CreateWalletInputSchema.parse(body)
        chainId = validatedBody.chainId
      } catch (err) {
        // Zod validation error - return 400
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message: err instanceof Error ? err.message : 'Invalid request body',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      // Validate chain is supported (404 for unsupported chains)
      if (!isSupportedChain(chainId)) {
        return new Response(
          JSON.stringify({
            error: 'Unsupported chain',
            message: `Chain ${chainId} is not supported`,
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      try {
        const result = await createWalletService({ userId, chainId })

        // Validate response matches contract
        const wallet = WalletSchema.parse({
          id: result.id,
          address: result.address,
          network: result.network,
          chainType: result.chainType,
        })

        // Return 201 for new wallets, 200 for existing (idempotent)
        if (result.isNew) {
          return new Response(JSON.stringify(wallet), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return wallet
      } catch (err) {
        // Handle errors - check for specific error types
        const errorMessage = err instanceof Error ? err.message : String(err)
        const lowerMessage = errorMessage.toLowerCase()

        // Check if this is a "wallet already exists" error (400 Bad Request)
        if (
          lowerMessage.includes('wallet already exists') ||
          lowerMessage.includes('multiple wallets per chain') ||
          lowerMessage.includes('multiple wallets are not allowed')
        ) {
          return new Response(
            JSON.stringify({
              error: 'Wallet already exists',
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
      detail: {
        summary: 'Create a new custodial wallet',
        description:
          'Create a wallet on any supported chain. Returns 201 for new wallets, 200 for existing wallets (idempotent).',
      },
    },
  )
