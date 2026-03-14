import { useReactApiConfig } from '@repo/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { walletsKeys } from '@/lib/query-keys'

export function useWalletBalance(walletId: string) {
  const { client } = useReactApiConfig()
  const queryClient = useQueryClient()

  const query = useQuery({
    ...walletsKeys.balance(walletId),
    queryFn: () => client.wallets.id.balance({ path: { id: walletId } }),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: walletsKeys.balance(walletId).queryKey })

  return { ...query, invalidate }
}
