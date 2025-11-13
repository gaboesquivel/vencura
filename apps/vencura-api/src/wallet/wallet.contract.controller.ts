import { Controller, UseGuards } from '@nestjs/common'
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest'
import { walletContract } from '@vencura/types'
import { WalletService } from './wallet.service'
import { AuthGuard } from '../auth/auth.guard'
import type { Request } from 'express'

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string }
}

@Controller()
@UseGuards(AuthGuard)
export class WalletContractController {
  constructor(private readonly walletService: WalletService) {}

  @TsRestHandler(walletContract)
  handler() {
    return tsRestHandler(walletContract, {
      list: async ({ req }) => {
        const user = (req as AuthenticatedRequest).user
        const wallets = await this.walletService.getUserWallets(user.id)
        return {
          status: 200 as const,
          body: wallets,
        }
      },
      create: async ({ req, body }) => {
        const user = (req as AuthenticatedRequest).user

        const wallet = await this.walletService.createWallet(user.id, body.chainId)
        return {
          status: 201 as const,
          body: wallet,
        }
      },
      getBalance: async ({ req, params }) => {
        const user = (req as AuthenticatedRequest).user

        const balance = await this.walletService.getBalance(params.id, user.id)
        return {
          status: 200 as const,
          body: balance,
        }
      },
      signMessage: async ({ req, params, body }) => {
        const user = (req as AuthenticatedRequest).user
        const result = await this.walletService.signMessage(
          params.id,
          user.id,

          body.message,
        )
        return {
          status: 200 as const,
          body: result,
        }
      },
      sendTransaction: async ({ req, params, body }) => {
        const user = (req as AuthenticatedRequest).user
        const result = await this.walletService.sendTransaction(
          params.id,
          user.id,

          body.to,

          body.amount,
        )
        return {
          status: 200 as const,
          body: result,
        }
      },
    })
  }
}
