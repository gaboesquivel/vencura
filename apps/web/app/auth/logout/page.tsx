'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { env } from '@/lib/env'

const cookieName = env.NEXT_PUBLIC_AUTH_COOKIE_NAME

function clearAuthCookie() {
  if (typeof document === 'undefined') return
  // biome-ignore lint/suspicious/noDocumentCookie: necessary to clear auth cookie on sign out
  document.cookie = `${cookieName}=; path=/; max-age=0`
}

export default function LogoutPage() {
  const router = useRouter()
  const { handleLogOut } = useDynamicContext()
  useEffect(() => {
    handleLogOut?.()
    clearAuthCookie()
    router.replace('/auth/login')
  }, [router, handleLogOut])
  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing out…</p>
    </div>
  )
}
