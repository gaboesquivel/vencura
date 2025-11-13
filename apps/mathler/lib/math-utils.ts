export function evaluateExpression(expr: string): number | null {
  try {
    // Replace × and ÷ with * and /
    const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/')

    // Validate expression (only allow digits, operators, and parentheses)
    if (!/^[\d+\-*/.()]+$/.test(normalized)) {
      return null
    }

    // Check for valid syntax
    if (/^[+*/%]|[+*/%]$/.test(normalized)) {
      return null
    }

    if (/[+\-*/%]{2,}/.test(normalized)) {
      return null
    }

    // Use Function constructor for safe evaluation
    // This is safer than eval() as it's evaluated in a restricted scope
    const result = Function('"use strict"; return (' + normalized + ')')()

    // Check if result is a valid number
    if (typeof result !== 'number' || !isFinite(result)) {
      return null
    }

    // Round to avoid floating point issues
    return Math.round(result * 1000000) / 1000000
  } catch {
    return null
  }
}

/**
 * Generates a random target number for daily puzzles
 * Uses current date as seed for daily consistency
 */
export function getRandomTarget(): number {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate()

  // Seeded random generator
  let rand = Math.sin(seed) * 10000
  rand = rand - Math.floor(rand)

  // Target between 10 and 100
  return Math.floor(rand * 91) + 10
}

/**
 * Generates all possible equations that equal a target
 * (for hint system or verification)
 */
export function generateEquationsForTarget(target: number, maxLength = 9): string[] {
  const equations: string[] = []

  // Simple brute force for small numbers
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      if (i + j === target && `${i}+${j}`.length <= maxLength) {
        equations.push(`${i}+${j}`)
      }
      if (i - j === target && `${i}-${j}`.length <= maxLength) {
        equations.push(`${i}-${j}`)
      }
      if (i * j === target && `${i}*${j}`.length <= maxLength) {
        equations.push(`${i}*${j}`)
      }
      if (j !== 0 && i % j === 0 && i / j === target && `${i}/${j}`.length <= maxLength) {
        equations.push(`${i}/${j}`)
      }
    }
  }

  return [...new Set(equations)].slice(0, 10)
}

/**
 * Seeded random number generator for consistent daily puzzles
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Generates a solution equation for a given target number
 * Uses seeded random based on date for daily consistency
 * Ensures equation length ≤ 9 characters and supports order of operations
 */
export function generateSolutionEquation(target: number, seed?: number): string {
  const today = new Date()
  const dateSeed = seed ?? today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate()

  // Generate candidate equations
  const candidates: string[] = []

  // Simple two-number operations
  for (let a = 1; a <= 99; a++) {
    for (let b = 1; b <= 99; b++) {
      // Addition
      if (a + b === target) {
        const eq = `${a}+${b}`
        if (eq.length <= 9) candidates.push(eq)
      }
      // Subtraction
      if (a - b === target && a > b) {
        const eq = `${a}-${b}`
        if (eq.length <= 9) candidates.push(eq)
      }
      // Multiplication
      if (a * b === target) {
        const eq = `${a}*${b}`
        if (eq.length <= 9) candidates.push(eq)
      }
      // Division
      if (b !== 0 && a % b === 0 && a / b === target) {
        const eq = `${a}/${b}`
        if (eq.length <= 9) candidates.push(eq)
      }
    }
  }

  // Three-number operations with order of operations
  for (let a = 1; a <= 50; a++) {
    for (let b = 1; b <= 50; b++) {
      for (let c = 1; c <= 50; c++) {
        // a + b * c (multiplication first)
        if (a + b * c === target) {
          const eq = `${a}+${b}*${c}`
          if (eq.length <= 9) candidates.push(eq)
        }
        // a * b + c (multiplication first)
        if (a * b + c === target) {
          const eq = `${a}*${b}+${c}`
          if (eq.length <= 9) candidates.push(eq)
        }
        // a * b - c (multiplication first)
        if (a * b - c === target && a * b > c) {
          const eq = `${a}*${b}-${c}`
          if (eq.length <= 9) candidates.push(eq)
        }
        // a - b * c (multiplication first)
        if (a - b * c === target && a > b * c) {
          const eq = `${a}-${b}*${c}`
          if (eq.length <= 9) candidates.push(eq)
        }
        // a / b + c (division first)
        if (b !== 0 && a % b === 0 && a / b + c === target) {
          const eq = `${a}/${b}+${c}`
          if (eq.length <= 9) candidates.push(eq)
        }
        // a / b - c (division first)
        if (b !== 0 && a % b === 0 && a / b - c === target && a / b > c) {
          const eq = `${a}/${b}-${c}`
          if (eq.length <= 9) candidates.push(eq)
        }
        // a + b / c (division first)
        if (c !== 0 && b % c === 0 && a + b / c === target) {
          const eq = `${a}+${b}/${c}`
          if (eq.length <= 9) candidates.push(eq)
        }
        // a - b / c (division first)
        if (c !== 0 && b % c === 0 && a - b / c === target && a > b / c) {
          const eq = `${a}-${b}/${c}`
          if (eq.length <= 9) candidates.push(eq)
        }
      }
    }
  }

  // Remove duplicates
  const uniqueCandidates = [...new Set(candidates)]

  if (uniqueCandidates.length === 0) {
    // Fallback: simple equation
    return `${target}+0`
  }

  // Use seeded random to pick a consistent equation for the day
  const randomIndex = Math.floor(seededRandom(dateSeed) * uniqueCandidates.length)
  const selected = uniqueCandidates[randomIndex]
  return selected ?? uniqueCandidates[0] ?? `${target}+0`
}
