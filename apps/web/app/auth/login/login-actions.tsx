'use client'

import { DynamicConnectButton, getAuthToken, useIsLoggedIn } from '@dynamic-labs/sdk-react-core'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { env } from '@/lib/env'

function isValidParentOrigin(origin: string): boolean {
  try {
    const u = new URL(origin)
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname
  } catch {
    return false
  }
}

export type LoginActionsProps = {
  initialError?: string
  embedded?: boolean
  parentOrigin?: string
}

export function LoginActions({
  initialError,
  embedded = false,
  parentOrigin,
}: LoginActionsProps): React.JSX.Element {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()

  useEffect(() => {
    if (!isLoggedIn) return
    const token = getAuthToken()
    if (!token) {
      if (!embedded) router.push('/')
      return
    }
    if (embedded && parentOrigin && isValidParentOrigin(parentOrigin)) {
      window.parent.postMessage({ type: 'DYNAMIC_AUTH_TOKEN', token }, parentOrigin)
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
  }, [isLoggedIn, router, embedded, parentOrigin])

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
