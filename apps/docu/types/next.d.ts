// Type declarations for Next.js auto-generated types
// These will be overridden by Next.js when it generates types in .next/types

import type { ReactNode } from 'react'

declare global {
  type PageProps<_T extends string> = {
    params: Promise<Record<string, string | string[] | undefined>>
    searchParams?: Promise<Record<string, string | string[] | undefined>>
  }

  type LayoutProps<_T extends string> = {
    children: ReactNode
    params?: Promise<Record<string, string | string[] | undefined>>
  }

  type RouteContext<_T extends string> = {
    params: Promise<Record<string, string | string[] | undefined>>
  }
}
