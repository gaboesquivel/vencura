'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { captureError } from '@repo/error/nextjs'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@repo/ui/components/sidebar'
import { logger } from '@repo/utils/logger'
import { useEffect, useTransition } from 'react'
import { useSetState } from 'react-use'
import { toast } from 'sonner'
import { useGameHistory } from '@/hooks/use-game-history'
import { useMathlerInput } from '@/hooks/use-mathler-input'
import { useUserSettings } from '@/hooks/use-user-settings'
import { getDateKey } from '@/lib/date'
import { calculateFeedback } from '@/lib/feedback'
import { evaluateExpression, generateSolutionEquation, getRandomTarget } from '@/lib/math'
import { GameKeypad } from './game-keypad'
import { GameSidebar } from './game-sidebar'
import { GameStatus } from './game-status'
import { GuessRow } from './guess-row'
import { SuccessModal } from './success-modal'

function MobileSidebarTrigger() {
  const { isMobile } = useSidebar()

  if (!isMobile) return null

  return (
    <div className="fixed right-4 top-4 z-50 md:hidden">
      <SidebarTrigger />
    </div>
  )
}

interface GameState {
  target: number
  solution: string
  guesses: string[]
  gameStatus: 'playing' | 'won' | 'lost'
  feedback: Array<Array<'correct' | 'present' | 'absent'>>
  showSuccessModal: boolean
}

export function MathlerGame() {
  const { user, primaryWallet, sdkHasLoaded, setShowAuthFlow } = useDynamicContext()
  const { difficulty } = useUserSettings()
  const [gameState, setGameState] = useSetState<GameState>({
    target: 0,
    solution: '',
    guesses: [],
    gameStatus: 'playing',
    feedback: [],
    showSuccessModal: false,
  })
  const { saveGame, saveGameError } = useGameHistory()
  const [isPending, startTransition] = useTransition()

  // Auto-open auth modal when SDK loads and user is not authenticated
  useEffect(() => {
    if (sdkHasLoaded && !user) {
      setShowAuthFlow(true)
      logger.info('User not authenticated - opening auth modal')
    }
  }, [sdkHasLoaded, user, setShowAuthFlow])

  // Log authentication state changes for monitoring
  useEffect(() => {
    if (sdkHasLoaded && user) {
      logger.info(
        {
          userId: user.userId,
          email: user.email,
          walletAddress: primaryWallet?.address,
        },
        'User authenticated - game access granted',
      )
    }
  }, [sdkHasLoaded, user, primaryWallet])

  const handleSubmit = (value: string) => {
    // Urgent: Basic validation
    if (!value || gameState.gameStatus !== 'playing') return

    // Check authentication before processing guess
    if (!user) {
      setShowAuthFlow(true)
      return
    }

    // Non-urgent: Expensive operations (evaluation, feedback calculation)
    startTransition(() => {
      try {
        const result = evaluateExpression(value)

        if (result === null) {
          const error = new Error('Invalid expression')
          captureError({
            code: 'INVALID_EXPRESSION',
            error,
            label: 'Expression Validation',
            tags: { app: 'mathler' },
            data: { expression: value },
          })
          toast.error('Invalid expression. Please check your equation.')
          return
        }

        const newGuesses = [...gameState.guesses, value]

        // Normalize guess for feedback comparison (× -> *, ÷ -> /)
        const normalizedGuess = value.replace(/×/g, '*').replace(/÷/g, '/')

        // Calculate feedback comparing guess to solution equation
        const feedbackRow = calculateFeedback(normalizedGuess, gameState.solution)

        // Accept any equation that evaluates to the target (supports cumulative solutions)
        // Examples: 1+5*15 and 15*5+1 both win for target 76
        const isWin = result === gameState.target
        const isGameOver = isWin || newGuesses.length >= 6

        if (isWin) {
          setGameState({
            guesses: newGuesses,
            feedback: [...gameState.feedback, feedbackRow],
            gameStatus: 'won',
            showSuccessModal: true,
          })
          resetInput()
        } else if (newGuesses.length >= 6) {
          setGameState({
            guesses: newGuesses,
            feedback: [...gameState.feedback, feedbackRow],
            gameStatus: 'lost',
          })
          resetInput()
        } else {
          setGameState({
            guesses: newGuesses,
            feedback: [...gameState.feedback, feedbackRow],
          })
        }

        // Save game history when game ends
        if (isGameOver) {
          const finalStatus: 'won' | 'lost' = isWin ? 'won' : 'lost'
          const date = getDateKey()
          logger.info(
            {
              status: finalStatus,
              guessCount: newGuesses.length,
              date,
              target: gameState.target,
            },
            'Game completed',
          )
          saveGame({
            date,
            target: gameState.target,
            solution: gameState.solution,
            guesses: newGuesses,
            status: finalStatus,
            guessCount: newGuesses.length,
          }).catch(error => {
            captureError({
              code: 'SAVE_GAME_FAILED',
              error,
              label: 'Save Game History',
              tags: { app: 'mathler' },
              data: { date, status: finalStatus },
            })
            toast.error('Failed to save game history. Your progress may not be saved.')
          })
        }
      } catch (error) {
        captureError({
          code: 'EXPRESSION_EVALUATION_ERROR',
          error: error instanceof Error ? error : new Error(String(error)),
          label: 'Expression Evaluation',
          tags: { app: 'mathler' },
          data: { expression: value },
        })
        toast.error('Invalid expression. Please check your equation.')
      }
    })
  }

  const {
    input: currentInput,
    cursor: cursorPosition,
    insertAt: handleInputAtPosition,
    backspace: handleBackspace,
    setCursor: setCursorPosition,
    reset: resetInput,
  } = useMathlerInput({
    maxLength: 9,
    gameStatus: gameState.gameStatus,
    onSubmit: handleSubmit,
  })

  const initializeGame = () => {
    const newTarget = getRandomTarget(difficulty)
    const newSolution = generateSolutionEquation(newTarget, undefined, difficulty)
    const date = getDateKey()
    logger.info(
      {
        target: newTarget,
        solution: newSolution,
        date,
        difficulty,
      },
      'Game initialized',
    )
    setGameState({
      target: newTarget,
      solution: newSolution,
      guesses: [],
      gameStatus: 'playing',
      feedback: [],
      showSuccessModal: false,
    })
    resetInput()
  }

  // Reinitialize game when difficulty changes
  useEffect(() => {
    if (gameState.target > 0) {
      // Only reinitialize if game has been initialized
      initializeGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- difficulty change should reinitialize
  }, [difficulty])

  const simulateGame = async () => {
    // Generate new target and solution for simulation
    const newTarget = getRandomTarget(difficulty)
    const newSolution = generateSolutionEquation(newTarget, undefined, difficulty)

    // Reset game first
    initializeGame()

    // Wait for game to initialize
    await new Promise(resolve => setTimeout(resolve, 800))

    // Simulate 1-2 invalid expressions
    const invalidExpressions = ['1+', '++2']
    for (const invalidExpr of invalidExpressions) {
      await new Promise(resolve => setTimeout(resolve, 1200))
      handleSubmit(invalidExpr)
    }

    // Wait a bit, then submit correct solution
    await new Promise(resolve => setTimeout(resolve, 1500))
    handleSubmit(newSolution)
  }

  useEffect(() => {
    initializeGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initializeGame should only run once on mount
  }, [])

  const resetGame = () => {
    initializeGame()
  }

  // Handle save game errors
  useEffect(() => {
    if (saveGameError) {
      captureError({
        code: 'SAVE_GAME_FAILED',
        error: saveGameError instanceof Error ? saveGameError : new Error(String(saveGameError)),
        label: 'Save Game History',
        tags: { app: 'mathler' },
      })
      toast.error('Failed to save game history. Your progress may not be saved.')
    }
  }, [saveGameError])

  const handleInputChange = (value: string) => {
    if (gameState.gameStatus !== 'playing') return

    // Check authentication before processing input
    if (!user) {
      setShowAuthFlow(true)
      return
    }

    // Replace entire input
    resetInput()
    for (const char of value) {
      handleInputAtPosition(char)
    }
  }

  const handleInputAtPositionWithAuth = (char: string) => {
    // Check authentication before processing keypad clicks
    if (!user) {
      setShowAuthFlow(true)
      return
    }
    handleInputAtPosition(char)
  }

  return (
    <SidebarProvider>
      <SidebarInset>
        <MobileSidebarTrigger />
        <div className="w-full max-w-sm mx-auto space-y-6 p-4">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">Mathler</h1>
            <p className="text-lg text-muted-foreground">
              Find the equation that equals{' '}
              <span className="font-bold text-primary">{gameState.target}</span>
            </p>
          </div>

          {/* Game Board */}
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => {
              const isCurrentRow =
                i === gameState.guesses.length && gameState.gameStatus === 'playing'
              return (
                <GuessRow
                  key={i}
                  guess={gameState.guesses[i] || ''}
                  feedback={gameState.feedback[i] || []}
                  isCurrentRow={isCurrentRow}
                  currentInput={isCurrentRow ? currentInput : ''}
                  cursorPosition={isCurrentRow ? cursorPosition : -1}
                  onTileClick={isCurrentRow ? pos => setCursorPosition(pos) : undefined}
                />
              )
            })}
          </div>

          {/* Game Status */}
          {gameState.gameStatus !== 'playing' ? (
            <GameStatus
              status={gameState.gameStatus}
              target={gameState.target}
              guessCount={gameState.guesses.length}
              onReset={resetGame}
            />
          ) : null}

          {/* Keypad */}
          {gameState.gameStatus === 'playing' ? (
            <GameKeypad
              onInput={handleInputChange}
              onBackspace={handleBackspace}
              onSubmit={() => {
                if (currentInput) handleSubmit(currentInput)
              }}
              currentInput={currentInput}
              onInputAtPosition={handleInputAtPositionWithAuth}
              isPending={isPending}
            />
          ) : null}

          {/* Success Modal */}
          <SuccessModal
            open={gameState.showSuccessModal}
            onOpenChange={open => setGameState({ showSuccessModal: open })}
            guessCount={gameState.guesses.length}
            onPlayAgain={resetGame}
          />
        </div>
      </SidebarInset>
      <GameSidebar onSimulateGame={simulateGame} />
    </SidebarProvider>
  )
}
