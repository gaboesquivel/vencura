'use client'

import { useBalance, useTotalSupply } from '@vencura/evm/hooks'
import { FAUCET_TOKENS } from '@/lib/tokens'
import { formatUnits, getAddress } from 'viem'
import { useAccount } from 'wagmi'
import { Button } from '@workspace/ui/components/button'
import { FaucetDialog } from './faucet-dialog'
import { useQueryStates } from 'nuqs'
import { useEffect } from 'react'

const DEFAULT_BALANCE = '0.00'

function useFaucetStates() {
  return useQueryStates({
    action: {
      defaultValue: undefined,
      parse: (value: string) => value as 'mint' | 'burn' | undefined,
    },
    quantity: {
      defaultValue: '42000',
      clearOnDefault: false,
      parse: (value: string) => value as string,
    },
    token: {
      clearOnDefault: false,
      defaultValue: undefined,
      parse: (value: string) => getAddress(value),
    },
    refetch_data: {
      defaultValue: false,
      parse: (value: string) => value === 'true',
    },
  })
}

function TokenRow({ token }: { token: (typeof FAUCET_TOKENS)[number] }) {
  const { address } = useAccount()
  const [{ refetch_data }, setQueryStates] = useFaucetStates()
  const tokenAddress = getAddress(token.address)

  const balanceResult = useBalance({
    token: tokenAddress,
    address,
  })
  const supplyResult = useTotalSupply({
    token: tokenAddress,
  })

  const tokenBalance = balanceResult.balance
  const tokenSupply = supplyResult.supply
  const refetchBalance = balanceResult.refetch
  const refetchSupply = supplyResult.refetch

  const handleAction = (action: 'mint' | 'burn') => {
    setQueryStates({
      action,
      token: tokenAddress,
      quantity: '42000',
    })
  }

  useEffect(() => {
    if (!refetch_data) return

    refetchSupply()
    refetchBalance()
    setQueryStates({ refetch_data: false })
  }, [refetch_data, setQueryStates, refetchSupply, refetchBalance])

  const balanceValue =
    tokenBalance !== undefined && typeof tokenBalance === 'bigint' && tokenBalance > 0n
      ? formatUnits(tokenBalance, token.decimals)
      : DEFAULT_BALANCE

  const supplyValue =
    tokenSupply !== undefined && typeof tokenSupply === 'bigint'
      ? formatUnits(tokenSupply, token.decimals)
      : DEFAULT_BALANCE

  return (
    <tr className="border-b">
      <td className="px-4 py-2">{token.symbol}</td>
      <td className="px-4 py-2">{token.name}</td>
      <td className="px-4 py-2">{balanceValue}</td>
      <td className="px-4 py-2">{supplyValue}</td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleAction('mint')}
            disabled={!address}
          >
            Mint
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction('burn')}
            disabled={!address}
          >
            Burn
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function FaucetTable() {
  return (
    <div className="flex flex-col w-full max-w-4xl items-start gap-4">
      <div className="w-full mt-4 overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Symbol</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Balance</th>
              <th className="px-4 py-2 text-left">Supply</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {FAUCET_TOKENS.map(token => (
              <TokenRow key={token.address} token={token} />
            ))}
          </tbody>
        </table>
      </div>
      <FaucetDialog />
    </div>
  )
}
