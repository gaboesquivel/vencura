'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/button'
import { useWalletBalance, useSignMessage, useSendTransaction, type Wallet } from '@vencura/react'
import { getChainByNetworkId } from '@/lib/chains'
import { getErrorMessage } from '@/lib/error-utils'
import { signMessageSchema, sendTransactionSchema, validateAddressInput } from '@/lib/validation'

export function WalletCard({ wallet }: { wallet: Wallet }) {
  const [message, setMessage] = useState('')
  const [signedMessage, setSignedMessage] = useState<string | null>(null)
  const [txTo, setTxTo] = useState('')
  const [txAmount, setTxAmount] = useState('')
  const [showBalance, setShowBalance] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)

  const {
    data: balanceData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance(wallet.id, { enabled: showBalance })

  const signMessage = useSignMessage(wallet.id, {
    onSuccess: data => {
      setSignedMessage(data.signedMessage)
      setMessage('')
    },
  })

  const sendTransaction = useSendTransaction(wallet.id, {
    onSuccess: () => {
      setTxTo('')
      setTxAmount('')
      refetchBalance()
    },
  })

  const chainInfo = getChainByNetworkId(wallet.network)
  const currency = chainInfo?.currency || (wallet.chainType === 'solana' ? 'SOL' : 'ETH')
  const txHash = sendTransaction.data?.transactionHash || null

  const handleGetBalance = () => {
    setShowBalance(true)
    refetchBalance()
  }

  const handleSignMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    const validation = signMessageSchema.safeParse({ message })
    if (!validation.success) return
    signMessage.mutate(validation.data)
  }

  const handleSendTransaction = () => {
    // Validate address format
    const addressValidation = validateAddressInput({
      address: txTo,
      chainType: wallet.chainType,
    })
    if (!addressValidation.valid) {
      setAddressError(addressValidation.error || 'Invalid address')
      return
    }
    setAddressError(null)

    // Parse and validate amount
    const amount = parseFloat(txAmount)
    const transactionValidation = sendTransactionSchema.safeParse({
      to: txTo.trim(),
      amount,
    })
    if (!transactionValidation.success) {
      const error = transactionValidation.error.errors.find(e => e.path[0] === 'amount')
      setAmountError(error?.message || 'Invalid amount')
      return
    }
    setAmountError(null)

    sendTransaction.mutate(transactionValidation.data)
  }

  const isLoading = balanceLoading || signMessage.isPending || sendTransaction.isPending
  const error =
    getErrorMessage(signMessage.error) ||
    getErrorMessage(sendTransaction.error) ||
    (balanceData === undefined && showBalance ? 'Failed to fetch balance' : null)

  return (
    <div className="border rounded-lg p-6 space-y-6 bg-card">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Wallet</h3>
          {wallet.chainType && (
            <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md uppercase">
              {wallet.chainType}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground font-mono break-all">{wallet.address}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {chainInfo?.name || wallet.network} {chainInfo?.testnet && '(Testnet)'}
          </span>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGetBalance}
            disabled={isLoading}
            size="sm"
            variant="outline"
            type="button"
          >
            {balanceLoading ? 'Loading...' : 'Get Balance'}
          </Button>
          {balanceData && (
            <div className="text-sm">
              <span className="text-muted-foreground">Balance: </span>
              <strong className="text-lg">
                {balanceData.balance} {currency}
              </strong>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <h4 className="font-semibold text-sm">Sign Message</h4>
        <form onSubmit={handleSignMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={e => {
              setMessage(e.target.value)
            }}
            placeholder="Enter message to sign"
            className="flex-1 px-3 py-2 border rounded-md text-sm bg-background"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !message.trim()} size="sm">
            {signMessage.isPending ? 'Signing...' : 'Sign'}
          </Button>
        </form>
        {signedMessage && (
          <div className="mt-2 p-3 bg-muted rounded-md">
            <p className="text-xs font-medium text-muted-foreground mb-1">Signed Message:</p>
            <p className="text-xs font-mono break-all">{signedMessage}</p>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t pt-4">
        <h4 className="font-semibold text-sm">Send Transaction</h4>
        <div className="space-y-2">
          <div className="space-y-1">
            <input
              type="text"
              value={txTo}
              onChange={e => {
                setTxTo(e.target.value)
                setAddressError(null)
              }}
              placeholder={
                wallet.chainType === 'solana'
                  ? 'Recipient address (Solana)'
                  : 'Recipient address (0x...)'
              }
              className={`w-full px-3 py-2 border rounded-md text-sm font-mono bg-background ${
                addressError ? 'border-destructive' : ''
              }`}
              disabled={isLoading}
            />
            {addressError && <p className="text-xs text-destructive">{addressError}</p>}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <input
                type="number"
                step="0.0001"
                value={txAmount}
                onChange={e => {
                  setTxAmount(e.target.value)
                  setAmountError(null)
                }}
                placeholder={`Amount (${currency})`}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-background ${
                  amountError ? 'border-destructive' : ''
                }`}
                disabled={isLoading}
              />
              {amountError && <p className="text-xs text-destructive">{amountError}</p>}
            </div>
            <Button onClick={handleSendTransaction} disabled={isLoading} size="sm">
              {sendTransaction.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
          {txHash && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-xs font-medium text-muted-foreground mb-1">Transaction Hash:</p>
              <p className="text-xs font-mono break-all">{txHash}</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
    </div>
  )
}
