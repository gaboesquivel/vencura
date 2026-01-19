import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GameSidebar } from './game-sidebar'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock sidebar components
vi.mock('@repo/ui/components/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar">{children}</div>
  ),
  SidebarContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-group">{children}</div>
  ),
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-group-content">{children}</div>
  ),
  SidebarHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-header">{children}</div>
  ),
  SidebarFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-footer">{children}</div>
  ),
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle</button>,
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Dynamic Labs context
vi.mock('@dynamic-labs/sdk-react-core', () => ({
  useDynamicContext: vi.fn(() => ({
    user: { userId: 'test-user', email: 'test@example.com' },
    sdkHasLoaded: true,
    setShowAuthFlow: vi.fn(),
    handleLogOut: vi.fn(),
  })),
}))

// Mock Select component to avoid Radix UI Slot issues
vi.mock('@repo/ui/components/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select">{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="select-trigger">{children}</button>
  ),
  SelectValue: () => <span data-testid="select-value">Medium (10-100)</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
}))

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    theme: 'system',
    setTheme: vi.fn(),
  })),
}))

// Mock useUserSettings
vi.mock('@/hooks/use-user-settings', () => ({
  useUserSettings: vi.fn(() => ({
    difficulty: 'medium',
    theme: 'system',
    setDifficulty: vi.fn(),
    setTheme: vi.fn(),
    isLoading: false,
    saveSettingsError: null,
  })),
}))

describe('GameSidebar', () => {
  it('should render sidebar with tabs', () => {
    render(<GameSidebar onSimulateGame={vi.fn()} />)
    // Check for tab triggers specifically
    expect(screen.getByRole('tab', { name: 'How to Play' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument()
  })

  it('should show instructions in How to Play tab', () => {
    render(<GameSidebar onSimulateGame={vi.fn()} />)
    expect(screen.getByText(/Find the equation/i)).toBeInTheDocument()
  })

  it('should show simulate game button', () => {
    const mockSimulate = vi.fn()
    render(<GameSidebar onSimulateGame={mockSimulate} />)
    const button = screen.getByText('Simulate Game')
    expect(button).toBeInTheDocument()
  })

  it('should call onSimulateGame when simulate button is clicked', async () => {
    const user = userEvent.setup()
    const mockSimulate = vi.fn()
    render(<GameSidebar onSimulateGame={mockSimulate} />)
    const button = screen.getByText('Simulate Game')
    await user.click(button)
    expect(mockSimulate).toHaveBeenCalledTimes(1)
  })

  it('should show difficulty selector in Settings tab', async () => {
    const user = userEvent.setup()
    render(<GameSidebar onSimulateGame={vi.fn()} />)
    const settingsTab = screen.getByText('Settings')
    await user.click(settingsTab)
    expect(screen.getByText(/Difficulty/i)).toBeInTheDocument()
  })

  it('should show dark mode toggle in Settings tab', async () => {
    const user = userEvent.setup()
    render(<GameSidebar onSimulateGame={vi.fn()} />)
    const settingsTab = screen.getByText('Settings')
    await user.click(settingsTab)
    expect(screen.getByText(/Dark mode/i)).toBeInTheDocument()
  })
})
