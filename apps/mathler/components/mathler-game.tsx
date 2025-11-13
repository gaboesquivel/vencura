'use client'

import { useState, useEffect, useCallback } from 'react'
import { evaluateExpression, getRandomTarget, generateSolutionEquation } from '@/lib/math-utils'
import GuessRow from './guess-row'
import GameKeypad from './game-keypad'
import GameStatus from './game-status'
import SuccessModal from './success-modal'

export default function MathlerGame() {
  const [target, setTarget] = useState<number>(0)
  const [solution, setSolution] = useState<string>('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState<string>('')
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [feedback, setFeedback] = useState<Array<Array<'correct' | 'present' | 'absent'>>>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const resetGame = useCallback(() => {
    const newTarget = getRandomTarget()
    const newSolution = generateSolutionEquation(newTarget)
    setTarget(newTarget)
    setSolution(newSolution)
    setGuesses([])
    setCurrentInput('')
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
      }
    },
    [gameStatus],
  )

  const handleBackspace = useCallback(() => {
    if (gameStatus !== 'playing') return
    setCurrentInput(prev => prev.slice(0, -1))
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
        if (isWin) {
          setGameStatus('won')
          setShowSuccessModal(true)
        } else if (newGuesses.length >= 6) {
          setGameStatus('lost')
        }

        return newGuesses
      })

      setCurrentInput('')
    } catch {
      alert('Invalid expression')
    }
  }, [currentInput, gameStatus, solution, target])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return

      // Prevent default for game keys
      if (
        /^[0-9+\-*/]$/.test(e.key) ||
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Enter'
      ) {
        e.preventDefault()
      }

      // Handle number and operator keys
      if (/^[0-9+\-*/]$/.test(e.key)) {
        setCurrentInput(prev => {
          if (prev.length < 9) {
            return prev + e.key
          }
          return prev
        })
      }

      // Handle backspace/delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleBackspace()
      }

      // Handle enter
      if (e.key === 'Enter') {
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStatus, handleSubmit, handleBackspace])

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
        <GameKeypad
          onInput={handleInputChange}
          onBackspace={handleBackspace}
          onSubmit={handleSubmit}
          currentInput={currentInput}
        />
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

function calculateFeedback(
  guess: string,
  solution: string,
): Array<'correct' | 'present' | 'absent'> {
  const feedback: Array<'correct' | 'present' | 'absent'> = Array(guess.length).fill('absent')

  // First pass: mark correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === solution[i]) {
      feedback[i] = 'correct'
    }
  }

  // Second pass: mark present but wrong position
  const solutionChars = solution.split('')
  const guessChars = guess.split('')

  // Remove correct matches from consideration
  for (let i = 0; i < guess.length; i++) {
    if (feedback[i] === 'correct') {
      solutionChars[i] = ''
      guessChars[i] = ''
    }
  }

  // Mark present (exists but wrong position)
  for (let i = 0; i < guess.length; i++) {
    if (feedback[i] !== 'correct') {
      const char = guessChars[i]
      if (char) {
        const solutionIndex = solutionChars.indexOf(char)
        if (solutionIndex !== -1) {
          feedback[i] = 'present'
          solutionChars[solutionIndex] = ''
        }
      }
    }
  }

  return feedback
}
