'use client'

import dynamicImport from 'next/dynamic'

const FaucetTable = dynamicImport(
  () => import('@/components/faucet/faucet-table').then(mod => ({ default: mod.FaucetTable })),
  {
    ssr: false,
  },
)

export const dynamic = 'force-dynamic'

export default function FaucetPage() {
  return (
    <div className="min-h-svh p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Token Faucet</h1>
        <p className="text-muted-foreground">
          Mint or burn test tokens on Arbitrum Sepolia. These tokens are for testing purposes only.
        </p>
        <FaucetTable />
      </div>
    </div>
  )
}
