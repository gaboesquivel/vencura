import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { createQueryKeys } from '@lukemorales/query-key-factory'
import { useVencuraClient } from '../context'
import type { CreateWalletDto, SignMessageDto, SendTransactionDto } from '@vencura/core'

type Wallet = {
  id?: string
  address?: string
  network?: string
  chainType?: string
}

type WalletBalance = {
  balance?: number
}

type CreateWalletResponse = {
  id?: string
  address?: string
  network?: string
  chainType?: string
}

type SignMessageResponse = {
  signedMessage?: string
}

type SendTransactionResponse = {
  transactionHash?: string
}

/**
 * Query key factory for wallet-related queries.
 * Provides centralized, type-safe query keys for cache management.
 *
 * Note: Query functions are created in hooks using the client from context.
 * This factory provides the query keys for cache invalidation and prefetching.
 *
 * @example
 * ```tsx
 * import { wallets } from '@vencura/react/hooks/use-wallets'
 * import { useQueryClient } from '@tanstack/react-query'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate all wallet queries
 * queryClient.invalidateQueries({ queryKey: wallets._def })
 *
 * // Invalidate specific wallet balance
 * queryClient.invalidateQueries({ queryKey: wallets.balance(walletId).queryKey })
 * ```
 */
export const wallets = createQueryKeys('wallets', {
  /**
   * Query key factory for fetching all wallets.
   * Note: queryFn is provided in the hook using client from context.
   * @returns Query key for listing all wallets
   */
  all: {
    queryKey: null,
  },
  /**
   * Query key factory for fetching wallet balance.
   * Note: queryFn is provided in the hook using client from context.
   * @param id - Wallet ID
   * @returns Query key for wallet balance
   */
  balance: (id: string) => ({
    queryKey: [id, 'balance'] as const,
  }),
})

/**
 * Hook to fetch all wallets for the authenticated user.
 *
 * @param options - Optional React Query options to override defaults
 * @returns Query result with wallets array
 *
 * @example
 * ```tsx
 * import { useWallets } from '@vencura/react'
 *
 * function WalletsList() {
 *   const { data: wallets, isLoading, error } = useWallets()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <ul>
 *       {wallets?.map(wallet => (
 *         <li key={wallet.id}>{wallet.address}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Override default options
 * const { data } = useWallets({
 *   staleTime: 5 * 60 * 1000, // 5 minutes
 *   refetchOnWindowFocus: true,
 * })
 * ```
 */
export function useWallets(
  options?: Omit<UseQueryOptions<Wallet[], void>, 'queryKey' | 'queryFn'>,
) {
  const client = useVencuraClient()
  return useQuery({
    ...wallets.all,
    queryFn: async () => {
      const response = await client.wallets.walletControllerGetWallets()
      return response.data
    },
    ...options,
  })
}

/**
 * Hook to create a new custodial wallet.
 *
 * @param options - Optional React Query mutation options
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * import { useCreateWallet } from '@vencura/react'
 *
 * function CreateWalletButton() {
 *   const createWallet = useCreateWallet({
 *     onSuccess: (data) => {
 *       console.log('Wallet created:', data.address)
 *     },
 *   })
 *
 *   return (
 *     <button
 *       onClick={() =>
 *         createWallet.mutate({ chainId: 421614 })
 *       }
 *     >
 *       Create Wallet
 *     </button>
 *   )
 * }
 * ```
 */
export function useCreateWallet(
  options?: UseMutationOptions<CreateWalletResponse, void, CreateWalletDto>,
) {
  const client = useVencuraClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWalletDto) => {
      const response = await client.wallets.walletControllerCreateWallet(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wallets._def })
    },
    ...options,
  })
}

/**
 * Hook to fetch wallet balance.
 *
 * @param id - Wallet ID
 * @param options - Optional React Query options to override defaults
 * @returns Query result with wallet balance
 *
 * @example
 * ```tsx
 * import { useWalletBalance } from '@vencura/react'
 *
 * function WalletBalance({ walletId }: { walletId: string }) {
 *   const { data, isLoading } = useWalletBalance(walletId)
 *
 *   if (isLoading) return <div>Loading balance...</div>
 *
 *   return <div>Balance: {data?.balance} ETH</div>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Only fetch when walletId exists
 * const { data } = useWalletBalance(walletId, {
 *   enabled: !!walletId,
 *   refetchInterval: 30000, // Refetch every 30 seconds
 * })
 * ```
 */
export function useWalletBalance(
  id: string,
  options?: Omit<UseQueryOptions<WalletBalance, void>, 'queryKey' | 'queryFn'>,
) {
  const client = useVencuraClient()
  return useQuery({
    ...wallets.balance(id),
    queryFn: async () => {
      const response = await client.wallets.walletControllerGetBalance({ id })
      return response.data
    },
    ...options,
  })
}

/**
 * Hook to sign a message with a wallet's private key.
 *
 * @param id - Wallet ID
 * @param options - Optional React Query mutation options
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * import { useSignMessage } from '@vencura/react'
 *
 * function SignButton({ walletId }: { walletId: string }) {
 *   const signMessage = useSignMessage(walletId, {
 *     onSuccess: (data) => {
 *       console.log('Signed message:', data.signedMessage)
 *     },
 *   })
 *
 *   return (
 *     <button
 *       onClick={() =>
 *         signMessage.mutate({ message: 'Hello, World!' })
 *       }
 *     >
 *       Sign Message
 *     </button>
 *   )
 * }
 * ```
 */
export function useSignMessage(
  id: string,
  options?: UseMutationOptions<SignMessageResponse, void, SignMessageDto>,
) {
  const client = useVencuraClient()

  return useMutation({
    mutationFn: async (data: SignMessageDto) => {
      const response = await client.wallets.walletControllerSignMessage({ id }, data)
      return response.data
    },
    ...options,
  })
}

/**
 * Hook to send a transaction from a wallet.
 *
 * @param id - Wallet ID
 * @param options - Optional React Query mutation options
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * import { useSendTransaction } from '@vencura/react'
 *
 * function SendButton({ walletId }: { walletId: string }) {
 *   const sendTransaction = useSendTransaction(walletId, {
 *     onSuccess: (data) => {
 *       console.log('Transaction hash:', data.transactionHash)
 *     },
 *   })
 *
 *   return (
 *     <button
 *       onClick={() =>
 *         sendTransaction.mutate({
 *           to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
 *           amount: 0.001,
 *         })
 *       }
 *     >
 *       Send Transaction
 *     </button>
 *   )
 * }
 * ```
 */
export function useSendTransaction(
  id: string,
  options?: UseMutationOptions<SendTransactionResponse, void, SendTransactionDto>,
) {
  const client = useVencuraClient()

  return useMutation({
    mutationFn: async (data: SendTransactionDto) => {
      const response = await client.wallets.walletControllerSendTransaction({ id }, data)
      return response.data
    },
    ...options,
  })
}
