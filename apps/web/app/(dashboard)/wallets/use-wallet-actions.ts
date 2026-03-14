import { useReactApiConfig } from '@repo/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { walletsKeys } from '@/lib/query-keys'

export function useWalletActions(walletId: string) {
  const { client } = useReactApiConfig()
  const queryClient = useQueryClient()

  const signMutation = useMutation({
    mutationFn: ({ msg }: { msg: string }) =>
      client.wallets.id.sign({ path: { id: walletId }, body: { msg } }),
  })

  const sendMutation = useMutation({
    mutationFn: ({ to, amount }: { to: string; amount: string }) =>
      client.wallets.id.send({ path: { id: walletId }, body: { to, amount } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: walletsKeys.balance(walletId).queryKey }),
  })

  return { signMutation, sendMutation }
}
