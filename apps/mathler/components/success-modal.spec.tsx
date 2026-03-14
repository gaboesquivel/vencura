import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SuccessModal } from './success-modal'

describe('SuccessModal', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnPlayAgain = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should open when open prop is true', () => {
    render(
      <SuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        guessCount={3}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Congratulations/)).toBeInTheDocument()
  })

  it('should not render when open prop is false', () => {
    render(
      <SuccessModal
        open={false}
        onOpenChange={mockOnOpenChange}
        guessCount={3}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should display correct guess count', () => {
    render(
      <SuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        guessCount={5}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    expect(screen.getByText(/you solved it in 5 guesses/i)).toBeInTheDocument()
  })

  it('should display singular guess count', () => {
    render(
      <SuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        guessCount={1}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    expect(screen.getByText(/you solved it in 1 guess/i)).toBeInTheDocument()
  })

  it('should call onPlayAgain when play again button clicked', async () => {
    const user = userEvent.setup()
    render(
      <SuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        guessCount={3}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    const button = screen.getByRole('button', { name: /play again/i })
    await user.click(button)

    expect(mockOnPlayAgain).toHaveBeenCalledTimes(1)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
