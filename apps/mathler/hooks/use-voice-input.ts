'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseVoiceInputOptions {
  onResult?: (text: string) => void
  onCommand?: (command: 'backspace' | 'delete' | 'enter' | 'submit' | 'clear') => void
  enabled?: boolean
}

interface UseVoiceInputReturn {
  isListening: boolean
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
}

// Map spoken words to math symbols
const NUMBER_MAP: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  oh: '0',
}

const OPERATOR_MAP: Record<string, string> = {
  plus: '+',
  minus: '-',
  subtract: '-',
  times: '×',
  multiply: '×',
  multiplied: '×',
  divided: '÷',
  'divided by': '÷',
  divide: '÷',
}

const COMMAND_MAP: Record<string, 'backspace' | 'delete' | 'enter' | 'submit' | 'clear'> = {
  backspace: 'backspace',
  delete: 'delete',
  enter: 'enter',
  submit: 'submit',
  clear: 'clear',
  erase: 'backspace',
}

function parseVoiceInput(text: string): {
  result: string
  command?: 'backspace' | 'delete' | 'enter' | 'submit' | 'clear'
} {
  const lowerText = text.toLowerCase().trim()

  // Check for commands first
  for (const [key, command] of Object.entries(COMMAND_MAP)) {
    if (lowerText.includes(key)) {
      return { result: '', command }
    }
  }

  // Parse numbers and operators
  let result = ''
  const words = lowerText.split(/\s+/)

  for (const word of words) {
    // Check for numbers
    if (NUMBER_MAP[word]) {
      result += NUMBER_MAP[word]
      continue
    }

    // Check for operators
    if (OPERATOR_MAP[word]) {
      result += OPERATOR_MAP[word]
      continue
    }

    // Try to match partial words (e.g., "divided by" as two words)
    if (word === 'divided') {
      const nextWord = words[words.indexOf(word) + 1]
      if (nextWord === 'by') {
        result += '÷'
        continue
      }
    }

    // Try direct digit matching
    if (/^\d+$/.test(word)) {
      result += word
      continue
    }

    // Try operator symbol matching
    if (
      word === '+' ||
      word === '-' ||
      word === '×' ||
      word === '÷' ||
      word === '*' ||
      word === '/'
    ) {
      result += word === '*' ? '×' : word === '/' ? '÷' : word
      continue
    }
  }

  return { result }
}

export function useVoiceInput({
  onResult,
  onCommand,
  enabled = true,
}: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    // Initialize recognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false)
      if (event.error === 'no-speech') {
        setError('No speech detected')
      } else if (event.error === 'not-allowed') {
        setError('Microphone permission denied')
      } else {
        setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1]
      if (!lastResult || lastResult.length === 0) return

      const firstAlternative = lastResult[0]
      if (!firstAlternative) return

      const transcript = firstAlternative.transcript

      const parsed = parseVoiceInput(transcript)

      if (parsed.command) {
        onCommand?.(parsed.command)
      } else if (parsed.result) {
        onResult?.(parsed.result)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onResult, onCommand])

  const startListening = useCallback(() => {
    if (!isSupported || !enabled) return
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch {
        setError('Failed to start speech recognition')
      }
    }
  }, [isSupported, enabled, isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
  }
}
