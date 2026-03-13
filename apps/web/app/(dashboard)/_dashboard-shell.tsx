'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { Button } from '@repo/ui/components/button'
import { ScrollArea } from '@repo/ui/components/scroll-area'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@repo/ui/components/sidebar'
import { Toaster } from '@repo/ui/components/sonner'
import { useQueryClient } from '@tanstack/react-query'
import { AssistantSidebar } from 'components/assistant'
import { ApiHealthBadge } from 'components/shared/api-health-badge'
import { AuthBadge } from 'components/shared/auth-badge'
import { LogOut } from 'lucide-react'
import { env } from '@/lib/env'
import { authSessionJwtQueryKey, authSessionUserQueryKey } from '@/lib/query-keys'
import { PageTitle } from './page-title'
import { DashboardSidebar } from './sidebar'

const cookieName = env.NEXT_PUBLIC_AUTH_COOKIE_NAME

export function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const queryClient = useQueryClient()
  const { handleLogOut } = useDynamicContext()

  function handleSignOut() {
    handleLogOut?.()
    // biome-ignore lint/suspicious/noDocumentCookie: necessary to clear auth cookie on sign out
    document.cookie = `${cookieName}=; path=/; max-age=0`
    queryClient.invalidateQueries({ queryKey: authSessionUserQueryKey })
    queryClient.invalidateQueries({ queryKey: authSessionJwtQueryKey })
    window.location.href = '/auth/login'
  }

  return (
    <SidebarProvider className="h-dvh min-h-0 overflow-hidden">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1">
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 md:gap-4 md:px-6">
            <div className="flex min-h-11 items-center md:hidden">
              <SidebarTrigger className="size-11 shrink-0" />
            </div>
            <div className="flex min-w-0 flex-1 items-center">
              <PageTitle />
            </div>
            <div className="flex min-h-11 items-center gap-3 md:gap-4">
              <ApiHealthBadge />
              <AuthBadge />
              <Button
                variant="ghost"
                size="icon"
                className="size-11 sm:size-9"
                aria-label="Sign out"
                type="button"
                onClick={handleSignOut}
              >
                <LogOut />
              </Button>
            </div>
          </header>
          <div className="flex min-h-0 flex-1" style={{ height: 'calc(100dvh - 3.5rem)' }}>
            <ScrollArea orientation="vertical" className="min-h-0 min-w-0 w-0 flex-1">
              <main className="block p-4 md:p-6">{children}</main>
            </ScrollArea>
            <AssistantSidebar />
          </div>
        </SidebarInset>
      </div>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}
