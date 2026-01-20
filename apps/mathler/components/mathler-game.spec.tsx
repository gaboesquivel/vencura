import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateFeedback } from '@/lib/feedback'
import { evaluateExpression, generateSolutionEquation, getRandomTarget } from '@/lib/math'
import { MathlerGame } from './mathler-game'

// Mock sidebar components
vi.mock('@repo/ui/components/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarInset: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle</button>,
  Sidebar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar">{children}</div>
  ),
  SidebarHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-header">{children}</div>
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
  SidebarFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-footer">{children}</div>
  ),
  useSidebar: vi.fn(() => ({
    state: 'expanded' as const,
    open: true,
    setOpen: vi.fn(),
    openMobile: false,
    setOpenMobile: vi.fn(),
    isMobile: false,
    toggleSidebar: vi.fn(),
  })),
}))

// Mock Dynamic Labs context
vi.mock('@dynamic-labs/sdk-react-core', () => ({
  useDynamicContext: vi.fn(() => ({
    user: { userId: 'test-user', email: 'test@example.com' },
    primaryWallet: { address: '0x123' },
    sdkHasLoaded: true,
    setShowAuthFlow: vi.fn(),
  })),
}))

// Mock the utility functions to control game behavior
vi.mock('@/lib/math', () => ({
  evaluateExpression: vi.fn(),
  getRandomTarget: vi.fn(),
  generateSolutionEquation: vi.fn(),
  getDateKey: vi.fn(() => '2024-01-01'),
}))

vi.mock('@/lib/feedback', () => ({
  calculateFeedback: vi.fn(),
}))

vi.mock('@/hooks/use-game-history', () => ({
  useGameHistory: vi.fn(() => ({
    saveGame: vi.fn().mockResolvedValue(true),
    getHistory: vi.fn(() => []),
    getGameByDate: vi.fn(() => undefined),
    getStats: vi.fn(() => ({
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageGuesses: 0,
    })),
    isAuthenticated: false,
    history: [],
    saveGameError: null,
  })),
}))

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

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock child components to simplify testing
vi.mock('./guess-row', () => ({
  GuessRow: function GuessRow({
    guess,
    currentInput,
    isCurrentRow,
    cursorPosition,
    onTileClick,
  }: {
    guess: string
    currentInput: string
    isCurrentRow: boolean
    cursorPosition?: number
    onTileClick?: (position: number) => void
  }) {
    const display = isCurrentRow ? currentInput : guess
    // Only rows with actual guesses should be marked as 'past'
    // Empty rows (no guess yet) should not have the 'past' test ID
    const testId = isCurrentRow ? 'guess-row-current' : guess ? 'guess-row-past' : 'guess-row-empty'
    return (
      <div data-testid={testId}>
        {display}
        {onTileClick && isCurrentRow ? (
          <button onClick={() => onTileClick(0)} data-testid="tile-click-0">
            Click Tile 0
          </button>
        ) : null}
        {cursorPosition !== undefined && cursorPosition >= 0 && isCurrentRow ? (
          <span data-testid="cursor-position">{cursorPosition}</span>
        ) : null}
      </div>
    )
  },
}))

vi.mock('./game-keypad', () => ({
  GameKeypad: function GameKeypad({
    onInput,
    onBackspace,
    onSubmit,
    currentInput,
    onInputAtPosition,
  }: {
    onInput: (value: string) => void
    onBackspace: () => void
    onSubmit: () => void
    currentInput: string
    onInputAtPosition?: (char: string) => void
  }) {
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    const operators = ['+', '-', '×', '÷']

    const handleClick = (char: string) => {
      if (onInputAtPosition) {
        onInputAtPosition(char)
      } else {
        onInput(char)
      }
    }

    return (
      <div data-testid="game-keypad">
        {numbers.map(num => (
          <button key={num} onClick={() => handleClick(num)}>
            {num}
          </button>
        ))}
        {operators.map(op => (
          <button key={op} onClick={() => handleClick(op)}>
            {op}
          </button>
        ))}
        <button onClick={onBackspace}>Back</button>
        <button onClick={onSubmit} disabled={!currentInput}>
          Submit
        </button>
      </div>
    )
  },
}))

vi.mock('./game-status', () => ({
  GameStatus: function GameStatus({
    status,
    onReset,
  }: {
    status: 'won' | 'lost'
    onReset: () => void
  }) {
    return (
      <div data-testid="game-status">
        <div>{status}</div>
        <button onClick={onReset}>Reset</button>
      </div>
    )
  },
}))

vi.mock('./success-modal', () => ({
  SuccessModal: function SuccessModal({
    open,
    onPlayAgain,
  }: {
    open: boolean
    onPlayAgain: () => void
  }) {
    if (!open) return null
    return (
      <div data-testid="success-modal">
        <button onClick={onPlayAgain}>Play Again</button>
      </div>
    )
  },
}))

describe('MathlerGame', () => {
  const mockEvaluateExpression = evaluateExpression as ReturnType<typeof vi.fn>
  const mockGetRandomTarget = getRandomTarget as ReturnType<typeof vi.fn>
  const mockGenerateSolutionEquation = generateSolutionEquation as ReturnType<typeof vi.fn>
  const mockCalculateFeedback = calculateFeedback as ReturnType<typeof vi.fn>
  const mockToastError = vi.mocked(toast.error)

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear mock call counts but keep implementations
    mockEvaluateExpression.mockClear()
    mockCalculateFeedback.mockClear()
    mockGetRandomTarget.mockClear()
    mockGenerateSolutionEquation.mockClear()
    // Set up default mocks
    mockGetRandomTarget.mockReturnValue(10)
    mockGenerateSolutionEquation.mockReturnValue('5+5')
    mockEvaluateExpression.mockImplementation(expr => {
      if (expr === '5+5') return 10
      if (expr === '1+2') return 3
      if (expr === '2+3') return 5
      return null
    })
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
  })

  it('should initialize game with target and solution', () => {
    render(<MathlerGame />)

    expect(mockGetRandomTarget).toHaveBeenCalled()
    expect(mockGenerateSolutionEquation).toHaveBeenCalledWith(10, undefined, 'medium')
    expect(screen.getAllByText(/find the equation that equals/i)[0]).toBeInTheDocument()
  })

  it('should accept valid input characters', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<MathlerGame />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('game-keypad')).toBeInTheDocument()
    })

    const button1 = screen.getByRole('button', { name: '1' })
    await user.click(button1)

    // Input should be handled
    await waitFor(() => {
      expect(screen.getByTestId('guess-row-current')).toHaveTextContent('1')
    })
  })

  it('should limit input to 9 characters', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(10)
    render(<MathlerGame />)

    // Use keyboard to input more than 9 characters
    await user.keyboard('1234567890')

    // Should only accept first 9 characters
    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      // Extract just the input text (numbers and operators), excluding mock UI elements
      const text = currentRow.textContent || ''
      const inputMatch = text.match(/^[\d+\-×÷]+/)
      expect((inputMatch?.[0] || '').length).toBeLessThanOrEqual(9)
    })
  })

  it('should validate expression before submission', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(null) // Invalid expression
    await act(async () => {
      render(<MathlerGame />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('game-keypad')).toBeInTheDocument()
    })

    const button1 = screen.getByRole('button', { name: '1' })
    await user.click(button1)

    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    // Should show toast error for invalid expression
    await waitFor(() => {
      expect(mockEvaluateExpression).toHaveBeenCalled()
      expect(mockToastError).toHaveBeenCalledWith('Invalid expression. Please check your equation.')
    })
  })

  it('should calculate feedback correctly on submit', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(10)
    mockCalculateFeedback.mockReturnValue(['correct', 'correct', 'correct'])
    render(<MathlerGame />)

    // Input the solution
    const button5 = screen.getByRole('button', { name: '5' })
    await user.click(button5)
    const buttonPlus = screen.getByRole('button', { name: '+' })
    await user.click(buttonPlus)
    await user.click(button5)

    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCalculateFeedback).toHaveBeenCalledWith('5+5', '5+5')
    })
  })

  it('should detect win condition', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(10)
    mockCalculateFeedback.mockReturnValue(['correct', 'correct', 'correct'])
    await act(async () => {
      render(<MathlerGame />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('game-keypad')).toBeInTheDocument()
    })

    // Input correct solution
    const button5 = screen.getByRole('button', { name: '5' })
    await user.click(button5)
    const buttonPlus = screen.getByRole('button', { name: '+' })
    await user.click(buttonPlus)
    await user.click(button5)

    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('success-modal')).toBeInTheDocument()
    })
  })

  it('should accept cumulative solutions (e.g., 1+5*15 === 15*5+1)', async () => {
    const user = userEvent.setup()
    // Set up solution as '1+5*15' which equals 76
    mockGetRandomTarget.mockReturnValue(76)
    mockGenerateSolutionEquation.mockReturnValue('1+5*15')
    mockEvaluateExpression.mockImplementation(expr => {
      if (expr === '1+5*15') return 76 // 1 + 75 = 76
      if (expr === '15*5+1') return 76 // 75 + 1 = 76
      return null
    })
    mockCalculateFeedback.mockReturnValue(['correct', 'correct', 'correct', 'correct', 'correct'])

    await act(async () => {
      render(<MathlerGame />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('game-keypad')).toBeInTheDocument()
    })

    // Input cumulative solution '15*5+1' instead of '1+5*15'
    await user.keyboard('15*5+1')
    await user.keyboard('{Enter}')

    // Should detect win even though it's not the exact solution
    await waitFor(() => {
      expect(mockEvaluateExpression).toHaveBeenCalledWith('15*5+1')
      expect(screen.getByTestId('success-modal')).toBeInTheDocument()
    })
  })

  it('should detect lose condition after 6 guesses', { timeout: 30000 }, async () => {
    const user = userEvent.setup()
    // Override mocks for this test (clear previous implementation)
    mockEvaluateExpression.mockImplementation(() => 5) // Wrong answer
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
    render(<MathlerGame />)

    // Submit 6 wrong guesses
    for (let i = 0; i < 6; i++) {
      const button1 = screen.getByRole('button', { name: '1' })
      await user.click(button1)
      const buttonPlus = screen.getByRole('button', { name: '+' })
      await user.click(buttonPlus)
      const button2 = screen.getByRole('button', { name: '2' })
      await user.click(button2)

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitButton)

      // Wait for the guess to be processed and state updated
      await waitFor(
        () => {
          expect(mockEvaluateExpression).toHaveBeenCalledTimes(i + 1)
        },
        { timeout: 2000 },
      )

      // Wait for state update to complete (startTransition)
      await waitFor(
        () => {
          const pastRows = screen.getAllByTestId('guess-row-past')
          expect(pastRows.length).toBe(i + 1)
        },
        { timeout: 2000 },
      )
    }

    // Wait for game status to update to 'lost' after the 6th guess
    // The game status should be set when guesses.length >= 6
    await waitFor(
      () => {
        expect(screen.getByTestId('game-status')).toBeInTheDocument()
        expect(screen.getByText('lost')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('should reset game when reset button clicked', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(5)
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
    await act(async () => {
      render(<MathlerGame />)
    })

    await waitFor(() => {
      expect(mockGetRandomTarget).toHaveBeenCalledTimes(1)
    })

    // Lose the game first to show reset button
    for (let i = 0; i < 6; i++) {
      await user.keyboard('1+2')
      await user.keyboard('{Enter}')
      // Wait for the guess to be processed
      await waitFor(
        () => {
          expect(mockEvaluateExpression).toHaveBeenCalled()
        },
        { timeout: 3000 },
      )
      // Wait for state update to complete
      await waitFor(
        () => {
          const pastRows = screen.getAllByTestId('guess-row-past')
          expect(pastRows.length).toBe(i + 1)
        },
        { timeout: 3000 },
      )
    }

    // Wait for game to be lost and GameStatus to render
    await waitFor(
      () => {
        expect(screen.getByTestId('game-status')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
    // Click reset button (mocked component uses "Reset" text)
    const resetButton = screen.getByRole('button', { name: 'Reset' })
    await user.click(resetButton)

    // Should call getRandomTarget again
    await waitFor(
      () => {
        expect(mockGetRandomTarget).toHaveBeenCalledTimes(2)
      },
      { timeout: 5000 },
    )
  })

  it('should handle keyboard input', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    // Simulate keyboard input
    await user.keyboard('1')

    await waitFor(() => {
      expect(screen.getByTestId('guess-row-current')).toHaveTextContent('1')
    })
  })

  it('should handle Enter key for submit', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(10)
    await act(async () => {
      render(<MathlerGame />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('game-keypad')).toBeInTheDocument()
    })

    // Type the expression
    await user.keyboard('5+5')
    // Wait for input to be set
    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      expect(currentRow.textContent).toContain('5+5')
    })

    // Submit with Enter
    await user.keyboard('{Enter}')

    // Wait for evaluation to be called with correct input
    await waitFor(
      () => {
        expect(mockEvaluateExpression).toHaveBeenCalledWith('5+5')
      },
      { timeout: 3000 },
    )
  })

  it('should handle Backspace key', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    await user.keyboard('123')
    await user.keyboard('{Backspace}')

    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      const text = currentRow.textContent || ''
      const inputMatch = text.match(/^[\d+\-×÷]+/)
      expect(inputMatch?.[0] || '').toBe('12')
    })
  })

  it('should block input when game is not playing', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(5)
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
    await act(async () => {
      render(<MathlerGame />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('game-keypad')).toBeInTheDocument()
    })

    // Lose the game
    for (let i = 0; i < 6; i++) {
      await user.keyboard('1+2')
      await user.keyboard('{Enter}')
      // Wait for the guess to be processed
      await waitFor(
        () => {
          expect(mockEvaluateExpression).toHaveBeenCalled()
        },
        { timeout: 3000 },
      )
      // Wait for state update to complete
      await waitFor(
        () => {
          const pastRows = screen.getAllByTestId('guess-row-past')
          expect(pastRows.length).toBe(i + 1)
        },
        { timeout: 3000 },
      )
    }

    // Wait for game to be lost - keypad should be removed and game status shown
    await waitFor(
      () => {
        expect(screen.queryByTestId('game-keypad')).not.toBeInTheDocument()
        expect(screen.getByTestId('game-status')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    // Try to input after game is lost
    await user.keyboard('9')
    // Should not accept input - current row should not be rendered when game is not playing
    const currentRow = screen.queryByTestId('guess-row-current')
    expect(currentRow).not.toBeInTheDocument()
  })

  it('should clear current input after submit', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(5)
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
    render(<MathlerGame />)

    await user.keyboard('1+2')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      const text = currentRow.textContent || ''
      const inputMatch = text.match(/^[\d+\-×÷]+/)
      expect(inputMatch?.[0] || '').toBe('')
    })
  })

  it('should handle arrow keys for cursor navigation', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<MathlerGame />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('game-keypad')).toBeInTheDocument()
    })

    await user.keyboard('123')
    await user.keyboard('{ArrowLeft}')
    await user.keyboard('{ArrowLeft}')

    await waitFor(() => {
      const cursorPos = screen.getByTestId('cursor-position')
      expect(cursorPos.textContent).toBe('1')
    })
  })

  it('should handle Escape key to clear input', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    await user.keyboard('123')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      const text = currentRow.textContent || ''
      const inputMatch = text.match(/^[\d+\-×÷]+/)
      expect(inputMatch?.[0] || '').toBe('')
    })
  })

  it('should handle tile click to position cursor', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<MathlerGame />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('game-keypad')).toBeInTheDocument()
    })

    await user.keyboard('123')
    const tileButton = screen.getByTestId('tile-click-0')
    await user.click(tileButton)

    await waitFor(() => {
      const cursorPos = screen.getByTestId('cursor-position')
      expect(cursorPos.textContent).toBe('0')
    })
  })
})
