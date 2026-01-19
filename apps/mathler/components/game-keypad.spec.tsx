import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameKeypad } from './game-keypad'

describe('GameKeypad', () => {
  const mockOnInput = vi.fn()
  const mockOnBackspace = vi.fn()
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all number buttons', () => {
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput=""
        isPending={false}
      />,
    )

    const buttons = screen.getAllByRole('button')
    const numberButtons = buttons.filter(button => {
      const text = button.textContent?.trim() ?? ''
      return /^\d$/.test(text)
    })

    expect(numberButtons).toHaveLength(10)
    const buttonTexts = numberButtons.map(button => button.textContent?.trim()).sort()
    expect(buttonTexts).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
  })

  it('should render all operator buttons', () => {
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput=""
      />,
    )

    expect(screen.getByRole('button', { name: 'Input operator +' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Input operator -' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Input operator ×' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Input operator ÷' })).toBeInTheDocument()
  })

  it('should call onInput with correct value when number clicked', async () => {
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1"
        isPending={false}
      />,
    )

    const button = screen.getByRole('button', { name: 'Input number 2' })
    await user.click(button)

    expect(mockOnInput).toHaveBeenCalledWith('12')
  })

  it('should call onInput with correct value when operator clicked', async () => {
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1"
      />,
    )

    const button = screen.getByRole('button', { name: 'Input operator +' })
    await user.click(button)

    expect(mockOnInput).toHaveBeenCalledWith('1+')
  })

  it('should call onBackspace when backspace clicked', async () => {
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1+2"
        isPending={false}
      />,
    )

    const button = screen.getByRole('button', { name: /back/i })
    await user.click(button)

    expect(mockOnBackspace).toHaveBeenCalledTimes(1)
  })

  it('should call onSubmit when submit clicked', async () => {
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1+2"
      />,
    )

    const button = screen.getByRole('button', { name: /submit/i })
    await user.click(button)

    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
  })

  it('should disable submit when input empty', () => {
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput=""
        isPending={false}
      />,
    )

    const button = screen.getByRole('button', { name: /submit/i })
    expect(button).toBeDisabled()
  })

  it('should enable submit when input has value', () => {
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1"
      />,
    )

    const button = screen.getByRole('button', { name: /submit/i })
    expect(button).not.toBeDisabled()
  })

  it('should use onInputAtPosition when provided', async () => {
    const mockOnInputAtPosition = vi.fn()
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1"
        onInputAtPosition={mockOnInputAtPosition}
        isPending={false}
      />,
    )

    const button = screen.getByRole('button', { name: 'Input number 2' })
    await user.click(button)

    expect(mockOnInputAtPosition).toHaveBeenCalledWith('2')
    expect(mockOnInput).not.toHaveBeenCalled()
  })
})
