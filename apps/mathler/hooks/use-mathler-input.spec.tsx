import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMathlerInput } from './use-mathler-input'

describe('useMathlerInput', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('does not attach global key capture when isGlobalKeyCaptureEnabled is false', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useMathlerInput({
        maxLength: 9,
        gameStatus: 'playing',
        onSubmit,
        isGlobalKeyCaptureEnabled: false,
      }),
    )

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '5', bubbles: true }))
    })

    expect(result.current.input).toBe('')
  })

  it('captures digit keys when global capture is enabled', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useMathlerInput({
        maxLength: 9,
        gameStatus: 'playing',
        onSubmit,
        isGlobalKeyCaptureEnabled: true,
      }),
    )

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '5', bubbles: true }))
    })

    expect(result.current.input).toBe('5')
  })

  it('does not handle keys when focus is inside a dialog', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useMathlerInput({
        maxLength: 9,
        gameStatus: 'playing',
        onSubmit,
        isGlobalKeyCaptureEnabled: true,
      }),
    )

    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    const input = document.createElement('input')
    dialog.appendChild(input)
    document.body.appendChild(dialog)
    input.focus()

    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: '7', bubbles: true }))
    })

    expect(result.current.input).toBe('')
  })
})
