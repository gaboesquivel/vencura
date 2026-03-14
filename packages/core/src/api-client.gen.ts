// This file is auto-generated. Do not edit manually.

import type { Options } from './gen/index'
import type {
  AccountApikeysCreateData,
  AccountApikeysCreateResponse,
  AccountApikeysListData,
  AccountApikeysListResponse,
  AccountApikeysRevokeData,
  AccountApikeysRevokeResponse,
  AccountProfileUpdateData,
  AccountProfileUpdateResponse,
  ChatData,
  ChatResponse,
  GenerateData,
  GenerateResponse,
  GetUserData,
  GetUserResponse,
  HealthCheckData,
  HealthCheckResponse,
  LogoutData,
  LogoutResponse,
  WalletsBalanceData,
  WalletsBalanceResponse,
  WalletsCreateData,
  WalletsCreateResponse,
  WalletsDetailData,
  WalletsDetailResponse,
  WalletsListData,
  WalletsListResponse,
  WalletsSendData,
  WalletsSendResponse,
  WalletsSignData,
  WalletsSignResponse,
} from './gen/types.gen'

export type CoreApiClient = {
  healthCheck: (opts?: Options<HealthCheckData>) => Promise<HealthCheckResponse>;
  account: {
    apikeys: {
      create: (opts: Options<AccountApikeysCreateData>) => Promise<AccountApikeysCreateResponse>;
      list: (opts?: Options<AccountApikeysListData>) => Promise<AccountApikeysListResponse>;
      id: (opts: Options<AccountApikeysRevokeData>) => Promise<AccountApikeysRevokeResponse>
    };
    profile: (opts: Options<AccountProfileUpdateData>) => Promise<AccountProfileUpdateResponse>
  };
  ai: {
    chat: (opts: Options<ChatData>) => Promise<ChatResponse>;
    generate: (opts: Options<GenerateData>) => Promise<GenerateResponse>
  };
  auth: {
    session: {
      logout: (opts?: Options<LogoutData>) => Promise<LogoutResponse>;
      user: (opts?: Options<GetUserData>) => Promise<GetUserResponse>
    }
  };
  wallets: {
    id: {
      balance: (opts: Options<WalletsBalanceData>) => Promise<WalletsBalanceResponse>;
      detail: (opts: Options<WalletsDetailData>) => Promise<WalletsDetailResponse>;
      send: (opts: Options<WalletsSendData>) => Promise<WalletsSendResponse>;
      sign: (opts: Options<WalletsSignData>) => Promise<WalletsSignResponse>
    }
  };
  walletsCreate: (opts?: Options<WalletsCreateData>) => Promise<WalletsCreateResponse>;
  walletsList: (opts?: Options<WalletsListData>) => Promise<WalletsListResponse>
}
