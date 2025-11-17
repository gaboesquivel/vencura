import type { Address } from 'viem'

export interface TokenConfig {
  address: Address
  name: string
  symbol: string
  decimals: number
}

export const FAUCET_TOKENS: TokenConfig[] = [
  {
    address: '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F',
    name: 'Dynamic Arcade Token',
    symbol: 'DNMC',
    decimals: 18,
  },
  {
    address: '0x6a2fE04d877439a44938D38709698d524BCF5c40',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
  },
  {
    address: '0x5f036f0B6948d4593364f975b81caBB3206aD994',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
  },
] as const
