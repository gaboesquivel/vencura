'use client'

import { useEffect, useState } from 'react'
import { MathlerGameSkeleton } from './mathler-game-skeleton'

export function ClientHydrationWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    // This is a common pattern for client-side hydration
    const timer = setTimeout(() => {
      setMounted(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return <MathlerGameSkeleton />
  }

  return <>{children}</>
}
