'use client'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Textarea } from '@repo/ui/components/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip'
import { Copy, RefreshCw, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { formatEther } from 'viem'
import { useWalletActions } from './use-wallet-actions'
import { useWalletBalance } from './use-wallet-balance'
import { useWallets } from './use-wallets'

function formatAddress(addr: string) {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

async function copyToClipboard(text: string, label: string) {
  if (!navigator.clipboard) {
    toast.error('Clipboard not available')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to copy')
  }
}

export default function WalletsPage() {
  const { wallets, isError, isLoading, createMutation } = useWallets()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-heading font-semibold md:text-xl">Custodial Wallets</h1>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          size="sm"
        >
          {createMutation.isPending ? 'Creating…' : 'Create wallet'}
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Failed to load wallets. Sign in with Dynamic to continue.
        </p>
      )}

      {wallets.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <Wallet className="size-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No custodial wallets yet. Create one to get started.
            </p>
            <Button
              variant="outline"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create wallet'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wallets.map(w => (
          <WalletCard key={w.id} wallet={w} />
        ))}
      </div>
    </div>
  )
}

function WalletCard({ wallet }: { wallet: { id: string; address: string; chainId: number } }) {
  const { data: balanceData, isLoading: balanceLoading, invalidate } = useWalletBalance(wallet.id)
  const { signMutation, sendMutation } = useWalletActions(wallet.id)

  const balanceWei = balanceData?.balance ?? '0'
  const balanceEth = formatEther(BigInt(balanceWei))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base font-mono">
          <span className="flex items-center gap-2">
            <Wallet className="size-4" />
            {formatAddress(wallet.address)}
          </span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Copy address"
                  onClick={() => copyToClipboard(wallet.address, 'Address')}
                >
                  <Copy className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy address</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Refresh balance"
                  onClick={() => invalidate()}
                >
                  <RefreshCw className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh balance</TooltipContent>
            </Tooltip>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Balance (Sepolia)</p>
          <p className="font-mono text-lg tabular-nums">
            {balanceLoading ? '…' : `${Number(balanceEth).toFixed(4)} ETH`}
          </p>
        </div>

        <WalletSignForm
          onSubmit={msg => signMutation.mutate({ msg })}
          isPending={signMutation.isPending}
          result={signMutation.data?.signedMessage}
        />

        <WalletSendForm
          onSubmit={({ to, amount }) => sendMutation.mutate({ to, amount })}
          isPending={sendMutation.isPending}
          error={sendMutation.error}
        />
      </CardContent>
    </Card>
  )
}

function WalletSignForm({
  onSubmit,
  isPending,
  result,
}: {
  onSubmit: (msg: string) => void
  isPending: boolean
  result?: string
}) {
  return (
    <form
      className="space-y-2"
      onSubmit={e => {
        e.preventDefault()
        const form = e.currentTarget
        const msg = (form.elements.namedItem('msg') as HTMLTextAreaElement)?.value?.trim()
        if (msg) onSubmit(msg)
      }}
    >
      <Label htmlFor="sign-msg">Sign message</Label>
      <Textarea
        id="sign-msg"
        name="msg"
        placeholder="Hello VenCura"
        rows={2}
        className="font-mono text-sm"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Signing…' : 'Sign'}
      </Button>
      {result && (
        <p className="break-all font-mono text-xs text-muted-foreground" title={result}>
          {result.length > 44 ? `${result.slice(0, 22)}…${result.slice(-20)}` : result}
        </p>
      )}
    </form>
  )
}

function WalletSendForm({
  onSubmit,
  isPending,
  error,
}: {
  onSubmit: (opts: { to: string; amount: string }) => void
  isPending: boolean
  error: unknown
}) {
  return (
    <form
      className="space-y-2"
      onSubmit={e => {
        e.preventDefault()
        const form = e.currentTarget
        const to = (form.elements.namedItem('to') as HTMLInputElement)?.value?.trim()
        const amount = (form.elements.namedItem('amount') as HTMLInputElement)?.value?.trim()
        if (to && amount) onSubmit({ to, amount })
      }}
    >
      <Label htmlFor="send-to">Send ETH</Label>
      <Input id="send-to" name="to" placeholder="0x…" className="font-mono text-sm" />
      <Label htmlFor="send-amount">Amount (ETH)</Label>
      <Input
        id="send-amount"
        name="amount"
        placeholder="0.001"
        type="text"
        className="font-mono text-sm"
      />
      <Button type="submit" size="sm" disabled={isPending} variant="secondary">
        {isPending ? 'Sending…' : 'Send'}
      </Button>
      {error ? (
        <p className="text-xs text-destructive">
          {error instanceof Error ? error.message : 'Send failed'}
        </p>
      ) : null}
    </form>
  )
}
