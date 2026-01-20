'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { Button } from '@repo/ui/components/button'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarTrigger,
} from '@repo/ui/components/sidebar'
import { Switch } from '@repo/ui/components/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { useUserSettings } from '@/hooks/use-user-settings'

interface GameSidebarProps {
  onSimulateGame: () => void
}

export function GameSidebar({ onSimulateGame }: GameSidebarProps) {
  const { user, sdkHasLoaded, setShowAuthFlow, handleLogOut } = useDynamicContext()
  const { difficulty, theme, setDifficulty, setTheme } = useUserSettings()
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme()

  // Sync user's saved theme preference with next-themes on mount
  useEffect(() => {
    if (theme && currentTheme !== theme) {
      setNextTheme(theme)
    }
  }, [theme, currentTheme, setNextTheme])

  const handleDifficultyChange = async (value: 'easy' | 'medium' | 'hard') => {
    await setDifficulty(value)
  }

  const handleThemeChange = async (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light'
    await setTheme(newTheme)
    setNextTheme(newTheme)
  }

  // Determine if dark mode is active
  const isDarkMode =
    currentTheme === 'dark' ||
    (currentTheme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
          <h2 className="font-semibold text-lg group-data-[collapsible=icon]:hidden flex-1">
            Game Options
          </h2>
          <SidebarTrigger className="group-data-[collapsible=icon]:ml-0 ml-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <Tabs defaultValue="how-to-play" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="how-to-play" className="cursor-pointer">
                  How to Play
                </TabsTrigger>
                <TabsTrigger value="settings" className="cursor-pointer">
                  Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="how-to-play" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <Button
                    onClick={onSimulateGame}
                    className="w-full cursor-pointer"
                    variant="default"
                  >
                    Simulate Game
                  </Button>
                  <div className="space-y-2 text-sm">
                    <h3 className="font-semibold">How to Play</h3>
                    <p className="text-muted-foreground">
                      Find the equation that equals the target number. You have 6 guesses to find
                      the correct equation.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Each guess must be a valid mathematical expression</li>
                      <li>Use +, -, ×, ÷, and parentheses</li>
                      <li>Green tiles indicate correct numbers in correct positions</li>
                      <li>Yellow tiles indicate correct numbers in wrong positions</li>
                      <li>Gray tiles indicate numbers not in the solution</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-6">
                  {sdkHasLoaded && user && (
                    <div className="text-sm">
                      <div className="font-medium">Logged in as</div>
                      <div className="text-muted-foreground truncate">
                        {user.email || user.username || 'User'}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={handleDifficultyChange}>
                      <SelectTrigger id="difficulty" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (10-50)</SelectItem>
                        <SelectItem value="medium">Medium (10-100)</SelectItem>
                        <SelectItem value="hard">Hard (50-200)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="dark-mode" className="flex-1 cursor-pointer">
                      Dark mode
                    </Label>
                    <Switch
                      id="dark-mode"
                      checked={isDarkMode}
                      onCheckedChange={handleThemeChange}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        {sdkHasLoaded && (
          <div className="w-full">
            {user ? (
              <Button
                onClick={() => handleLogOut()}
                className="w-full cursor-pointer"
                variant="outline"
              >
                Logout
              </Button>
            ) : (
              <Button
                onClick={() => setShowAuthFlow(true)}
                className="w-full cursor-pointer"
                variant="default"
              >
                Login
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
