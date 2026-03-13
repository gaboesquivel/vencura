'use client'

import { DynamicConnectButton, getAuthToken, useIsLoggedIn } from '@dynamic-labs/sdk-react-core'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { env } from '@/lib/env'

type LoginActionsProps = { initialError?: string }

export function LoginActions({ initialError }: LoginActionsProps): React.JSX.Element {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()

  useEffect(() => {
    if (!isLoggedIn) return
    const token = getAuthToken()
    if (!token) {
      router.push('/')
      return
    }
    void (async () => {
      const res = await fetch('/api/auth/sync-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'include',
      })
      if (res.ok) {
        router.push('/')
      } else {
        const data = (await res.json().catch(() => ({}))) as { message?: string }
        toast.error(data?.message ?? 'Sign-in failed')
      }
    })()
  }, [isLoggedIn, router])

  const envId = env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID

  if (!envId)
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
        Dynamic environment ID is not configured. Set NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID.
      </div>
    )

  return (
    <div className="flex flex-col gap-4">
      {initialError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
          {initialError}
        </div>
      )}
      <div className="flex justify-center">
        <DynamicConnectButton>Sign in</DynamicConnectButton>
      </div>
    </div>
  )
}
