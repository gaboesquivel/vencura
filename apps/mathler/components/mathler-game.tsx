'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  evaluateExpression,
  getRandomTarget,
  generateSolutionEquation,
  getDateKey,
} from '@/lib/math-utils'
import { calculateFeedback } from '@/lib/feedback-utils'
import { useGameHistory } from '@/hooks/use-game-history'
import GuessRow from './guess-row'
import GameKeypad from './game-keypad'
import GameStatus from './game-status'
import SuccessModal from './success-modal'
import VoiceControl from './voice-control'

export default function MathlerGame() {
  const [target, setTarget] = useState<number>(0)
  const [solution, setSolution] = useState<string>('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState<string>('')
  const [cursorPosition, setCursorPosition] = useState<number>(0)
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [feedback, setFeedback] = useState<Array<Array<'correct' | 'present' | 'absent'>>>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { saveGame } = useGameHistory()

  const resetGame = useCallback(() => {
    const newTarget = getRandomTarget()
    const newSolution = generateSolutionEquation(newTarget)
    setTarget(newTarget)
    setSolution(newSolution)
    setGuesses([])
    setCurrentInput('')
    setCursorPosition(0)
    setGameStatus('playing')
    setFeedback([])
    setShowSuccessModal(false)
  }, [])

  useEffect(() => {
    resetGame()
  }, [resetGame])

  const handleInputChange = useCallback(
    (value: string) => {
      if (gameStatus !== 'playing') return
      if (value.length <= 9) {
        setCurrentInput(value)
        setCursorPosition(value.length)
      }
    },
    [gameStatus],
  )

  const handleInputAtPosition = useCallback(
    (char: string, position?: number) => {
      if (gameStatus !== 'playing') return
      const pos = position ?? cursorPosition
      const newInput = currentInput.slice(0, pos) + char + currentInput.slice(pos)
      if (newInput.length <= 9) {
        setCurrentInput(newInput)
        setCursorPosition(pos + 1)
      }
    },
    [gameStatus, currentInput, cursorPosition],
  )

  const handleBackspace = useCallback(() => {
    if (gameStatus !== 'playing') return
    if (cursorPosition > 0) {
      const newInput =
        currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition)
      setCurrentInput(newInput)
      setCursorPosition(Math.max(0, cursorPosition - 1))
    }
  }, [gameStatus, currentInput, cursorPosition])

  const handleCursorMove = useCallback(
    (direction: 'left' | 'right') => {
      if (gameStatus !== 'playing') return
      if (direction === 'left') {
        setCursorPosition(prev => Math.max(0, prev - 1))
      } else {
        setCursorPosition(prev => Math.min(currentInput.length, prev + 1))
      }
    },
    [gameStatus, currentInput.length],
  )

  const handleClear = useCallback(() => {
    if (gameStatus !== 'playing') return
    setCurrentInput('')
    setCursorPosition(0)
  }, [gameStatus])

  const handleSubmit = useCallback(() => {
    if (!currentInput || gameStatus !== 'playing') return

    try {
      const result = evaluateExpression(currentInput)

      if (result === null) {
        alert('Invalid expression')
        return
      }

      setGuesses(prevGuesses => {
        const newGuesses = [...prevGuesses, currentInput]

        // Normalize guess for feedback comparison (× -> *, ÷ -> /)
        const normalizedGuess = currentInput.replace(/×/g, '*').replace(/÷/g, '/')

        // Calculate feedback comparing guess to solution equation
        const feedbackRow = calculateFeedback(normalizedGuess, solution)
        setFeedback(prevFeedback => [...prevFeedback, feedbackRow])

        // Check win condition (result equals target AND guess matches solution exactly)
        const isWin = result === target && normalizedGuess === solution
        const isGameOver = isWin || newGuesses.length >= 6

        if (isWin) {
          setGameStatus('won')
          setShowSuccessModal(true)
        } else if (newGuesses.length >= 6) {
          setGameStatus('lost')
        }

        // Save game history when game ends
        if (isGameOver) {
          const finalStatus: 'won' | 'lost' = isWin ? 'won' : 'lost'
          saveGame({
            date: getDateKey(),
            target,
            solution,
            guesses: newGuesses,
            status: finalStatus,
            guessCount: newGuesses.length,
          }).catch(error => {
            console.error('Failed to save game history:', error)
          })
        }

        return newGuesses
      })

      setCurrentInput('')
      setCursorPosition(0)
    } catch {
      alert('Invalid expression')
    }
  }, [currentInput, gameStatus, solution, target, saveGame])

  const handleVoiceResult = useCallback(
    (text: string) => {
      if (gameStatus !== 'playing') return
      // Insert voice input at cursor position
      for (const char of text) {
        handleInputAtPosition(char)
      }
    },
    [gameStatus, handleInputAtPosition],
  )

  const handleVoiceCommand = useCallback(
    (command: 'backspace' | 'delete' | 'enter' | 'submit' | 'clear') => {
      if (gameStatus !== 'playing') return
      if (command === 'backspace' || command === 'delete') {
        handleBackspace()
      } else if (command === 'enter' || command === 'submit') {
        handleSubmit()
      } else if (command === 'clear') {
        handleClear()
      }
    },
    [gameStatus, handleBackspace, handleSubmit, handleClear],
  )

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return

      // Prevent default for game keys
      if (
        /^[0-9+\-*/]$/.test(e.key) ||
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Enter' ||
        e.key === 'Escape' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault()
      }

      // Handle arrow keys for cursor navigation
      if (e.key === 'ArrowLeft') {
        handleCursorMove('left')
        return
      }
      if (e.key === 'ArrowRight') {
        handleCursorMove('right')
        return
      }

      // Handle Escape to clear
      if (e.key === 'Escape') {
        handleClear()
        return
      }

      // Handle number and operator keys
      if (/^[0-9+\-*/]$/.test(e.key)) {
        handleInputAtPosition(e.key)
        return
      }

      // Handle × and ÷ from keyboard (Alt+0215 for ×, Alt+0247 for ÷)
      if (e.key === '×' || (e.altKey && e.key === 'x')) {
        handleInputAtPosition('×')
        return
      }
      if (e.key === '÷' || (e.altKey && e.key === '/')) {
        handleInputAtPosition('÷')
        return
      }

      // Handle backspace/delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleBackspace()
        return
      }

      // Handle enter
      if (e.key === 'Enter') {
        handleSubmit()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    gameStatus,
    handleSubmit,
    handleBackspace,
    handleCursorMove,
    handleClear,
    handleInputAtPosition,
  ])

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Mathler</h1>
        <p className="text-lg text-muted-foreground">
          Find the equation that equals <span className="font-bold text-primary">{target}</span>
        </p>
      </div>

      {/* Game Board */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <GuessRow
            key={i}
            guess={guesses[i] || ''}
            feedback={feedback[i] || []}
            isCurrentRow={i === guesses.length && gameStatus === 'playing'}
            currentInput={i === guesses.length ? currentInput : ''}
            cursorPosition={i === guesses.length ? cursorPosition : -1}
            onTileClick={i === guesses.length ? pos => setCursorPosition(pos) : undefined}
          />
        ))}
      </div>

      {/* Game Status */}
      {gameStatus !== 'playing' && (
        <GameStatus
          status={gameStatus}
          target={target}
          guessCount={guesses.length}
          onReset={resetGame}
        />
      )}

      {/* Keypad */}
      {gameStatus === 'playing' && (
        <div className="space-y-4">
          <VoiceControl onResult={handleVoiceResult} onCommand={handleVoiceCommand} />
          <GameKeypad
            onInput={handleInputChange}
            onBackspace={handleBackspace}
            onSubmit={handleSubmit}
            currentInput={currentInput}
            onInputAtPosition={handleInputAtPosition}
          />
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        guessCount={guesses.length}
        onPlayAgain={resetGame}
      />
    </div>
  )
}
