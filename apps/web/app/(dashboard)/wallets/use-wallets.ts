import { useReactApiConfig } from '@repo/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletsKeys } from '@/lib/query-keys'

export function useWallets() {
  const { client } = useReactApiConfig()
  const queryClient = useQueryClient()

  const query = useQuery({
    ...walletsKeys.list,
    queryFn: () => client.walletsList(),
  })

  const createMutation = useMutation({
    mutationFn: () => client.walletsCreate(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletsKeys.list.queryKey }),
  })

  return {
    wallets: query.data?.wallets ?? [],
    ...query,
    createMutation,
  }
}
