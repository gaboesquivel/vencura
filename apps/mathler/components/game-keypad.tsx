'use client'

import { Button } from '@repo/ui/components/button'

interface GameKeypadProps {
  onInput: (value: string) => void
  onBackspace: () => void
  onSubmit: () => void
  currentInput: string
  onInputAtPosition?: (char: string) => void
  isPending?: boolean
}

export function GameKeypad({
  onInput,
  onBackspace,
  onSubmit,
  currentInput,
  onInputAtPosition,
  isPending = false,
}: GameKeypadProps) {
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  const operators = ['+', '-', '×', '÷']

  const handleClick = (char: string) => {
    if (onInputAtPosition) onInputAtPosition(char)
    else onInput(currentInput + char)
  }

  return (
    <div className="space-y-3">
      {/* Numbers Grid */}
      <div className="grid grid-cols-5 gap-2">
        {numbers.map(num => (
          <Button
            key={num}
            variant="secondary"
            size="lg"
            onClick={() => handleClick(num)}
            aria-label={`Input number ${num}`}
            className="py-3 font-semibold"
          >
            {num}
          </Button>
        ))}
      </div>

      {/* Operators */}
      <div className="grid grid-cols-4 gap-2">
        {operators.map(op => (
          <Button
            key={op}
            variant="outline"
            size="lg"
            onClick={() => handleClick(op)}
            aria-label={`Input operator ${op}`}
            className="py-3 font-semibold text-lg"
          >
            {op}
          </Button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="destructive"
          size="lg"
          onClick={onBackspace}
          aria-label="Backspace"
          className="py-3 font-semibold"
        >
          ← Back
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={onSubmit}
          disabled={!currentInput || isPending}
          aria-label="Submit guess"
          className="py-3 font-semibold"
        >
          {isPending ? 'Processing...' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
