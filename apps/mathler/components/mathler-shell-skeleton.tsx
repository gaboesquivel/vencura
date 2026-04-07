'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@repo/ui/components/sidebar'
import { MathlerGameSkeleton } from './mathler-game-skeleton'

export function MathlerShellSkeleton() {
  return (
    <SidebarProvider defaultOpen>
      <SidebarInset>
        <div
          className="fixed right-4 top-4 z-50 md:hidden h-7 w-7 rounded-md bg-muted animate-pulse"
          aria-hidden
        />
        <div className="w-full max-w-sm mx-auto space-y-6 p-4">
          <MathlerGameSkeleton />
        </div>
      </SidebarInset>
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="h-7 flex-1 max-w-[8rem] rounded-md bg-muted animate-pulse" />
            <div className="h-7 w-7 shrink-0 rounded-md bg-muted animate-pulse" />
          </div>
        </SidebarHeader>
        <SidebarContent className="group-data-[collapsible=icon]:hidden">
          <SidebarGroup>
            <SidebarGroupContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="h-9 rounded-md bg-muted animate-pulse" />
                <div className="h-9 rounded-md bg-muted animate-pulse" />
              </div>
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
                <div className="h-16 w-full rounded-md bg-muted animate-pulse" />
                <div className="h-12 w-full rounded-md bg-muted animate-pulse" />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
          <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
