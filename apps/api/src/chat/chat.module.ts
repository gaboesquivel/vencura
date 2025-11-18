import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { WalletModule } from '../wallet/wallet.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [WalletModule, AuthModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
