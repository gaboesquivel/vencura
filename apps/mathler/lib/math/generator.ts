import isEmpty from 'lodash-es/isEmpty'
import isString from 'lodash-es/isString'
import { evaluateExpression } from './evaluator'
import type { Difficulty, Op } from './types'

/**
 * Seeded random number generator for consistent daily puzzles
 * Accepts both number and string seeds (strings are hashed to numbers)
 */
function seededRandom(seed: number | string): number {
  let numericSeed: number
  if (isString(seed)) {
    // Simple hash function to convert string to number
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash | 0 // Convert to 32-bit integer
    }
    numericSeed = hash
  } else numericSeed = seed
  const x = Math.sin(numericSeed) * 10000
  return x - Math.floor(x)
}

/**
 * Available operators for equation generation
 * - Addition: Always valid, precedence 1
 * - Subtraction: Only valid when x > y (to avoid negative results), precedence 1
 * - Multiplication: Always valid, precedence 2 (higher than add/sub)
 * - Division: Only valid when y !== 0 and x is divisible by y (integer results), precedence 2
 */
const OPS: Op[] = [
  { sym: '+', fn: (x, y) => x + y, guard: () => true, prec: 1, commutative: true },
  { sym: '-', fn: (x, y) => x - y, guard: (x, y) => x > y, prec: 1, commutative: false },
  { sym: '*', fn: (x, y) => x * y, guard: () => true, prec: 2, commutative: true },
  {
    sym: '/',
    fn: (x, y) => (y !== 0 && x % y === 0 ? x / y : undefined),
    guard: (_x, y) => y !== 0,
    prec: 2,
    commutative: false,
  },
]

/**
 * Generates a random target number for daily puzzles
 * Uses current date as seed for daily consistency
 */
export function getRandomTarget(difficulty: Difficulty = 'medium'): number {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate()

  // Seeded random generator
  let rand = Math.sin(seed) * 10000
  rand = rand - Math.floor(rand)

  // Target ranges based on difficulty
  if (difficulty === 'easy') {
    // Target between 10 and 50
    return Math.floor(rand * 41) + 10
  }
  if (difficulty === 'hard') {
    // Target between 50 and 200
    return Math.floor(rand * 151) + 50
  }
  // Medium (default): Target between 10 and 100
  return Math.floor(rand * 91) + 10
}

/**
 * Generates a solution equation for a given target number.
 *
 * ## Strategy
 *
 * This function uses a two-phase approach to generate valid equations:
 *
 * ### Phase 1: Two-Number Equations
 * Generates simple equations of the form `a op b = target`:
 * - Iterates through all combinations of numbers (1-99) and operators
 * - Validates operations using operator guards (e.g., no division by zero, no negative subtraction)
 * - Filters equations that exceed the 9-character limit
 *
 * Examples: `5+10=15`, `20-5=15`, `3*5=15`, `30/2=15`
 *
 * ### Phase 2: Three-Number Equations with Order of Operations
 * Generates equations with three numbers considering operator precedence:
 *
 * **Left-associative**: `(a op1 b) op2 c`
 * - Example: `(2+3)*4` evaluates as `(5)*4 = 20`
 * - Parentheses added when op2 has higher precedence than op1
 * - Also added when equal precedence but non-commutative (e.g., subtraction)
 *
 * **Right-associative**: `a op1 (b op2 c)`
 * - Example: `2+(3*4)` evaluates as `2+(12) = 14`
 * - Parentheses added when op2 has lower precedence than op1
 * - Example: `2+(3*4)` needs parens, but `2*(3+4)` doesn't (due to precedence)
 *
 * ### Selection Strategy
 * - Collects all valid candidates in a Set (automatic deduplication)
 * - Uses seeded random based on date and target for daily consistency
 * - Falls back to `target+0` if no valid equations found (shouldn't happen in practice)
 *
 * ## Constraints
 * - Maximum equation length: 9 characters
 * - Operators: +, -, *, / only
 * - No negative results (subtraction only when x > y)
 * - Integer division only (x must be divisible by y)
 * - No division by zero
 * - Supports parentheses for grouping
 *
 * ## Daily Consistency
 * Uses date-based seeding to ensure the same puzzle is generated for the same date.
 * The seed combines the date (YYYYMMDD format) with the target number to avoid collisions.
 *
 * @param target - The target number the equation must equal (typically 10-100)
 * @param seed - Optional seed for deterministic generation (defaults to current date)
 * @param difficulty - Optional difficulty level affecting equation complexity (defaults to 'medium')
 * @returns A valid equation string that evaluates to the target
 */
export function generateSolutionEquation(
  target: number,
  seed?: number,
  difficulty: Difficulty = 'medium',
): string {
  const today = new Date()
  const dateSeed = seed ?? today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate()

  const MAX = 9
  const candidates = new Set<string>()

  // Adjust number ranges based on difficulty
  // Easy: smaller numbers (1-50), prefer simpler equations
  // Medium: current behavior (1-99)
  // Hard: larger numbers (1-99), more complex equations
  const maxNumber = difficulty === 'easy' ? 50 : 99
  const maxThreeNumber = difficulty === 'easy' ? 30 : 50

  // Generate two-number equations: a op b = target
  // Iterate through all combinations of numbers and operators
  // Example: 5+10=15, 20-5=15, 3*5=15, 30/2=15
  for (let a = 1; a <= maxNumber; a++) {
    for (let b = 1; b <= maxNumber; b++) {
      for (const { sym, fn, guard } of OPS) {
        // Skip if operation is invalid (e.g., division by zero, negative subtraction)
        if (!guard(a, b)) continue
        const v = fn(a, b)
        // If result matches target and equation fits length constraint, add to candidates
        if (v === target) {
          const eq = `${a}${sym}${b}`
          if (eq.length <= MAX) candidates.add(eq)
        }
      }
    }
  }

  // Generate three-number equations with order of operations support
  // We need to consider both left-associative and right-associative groupings
  // Example: (2+3)*4=20 vs 2+(3*4)=14
  // For easy difficulty, prefer two-number equations (smaller maxThreeNumber)
  for (let a = 1; a <= maxThreeNumber; a++) {
    for (let b = 1; b <= maxThreeNumber; b++) {
      for (let c = 1; c <= maxThreeNumber; c++) {
        for (const op1 of OPS) {
          // First operation: a op1 b
          if (!op1.guard(a, b)) continue
          const v1 = op1.fn(a, b)
          if (v1 === undefined) continue

          for (const op2 of OPS) {
            // Left-associative: (a op1 b) op2 c
            // Example: (2+3)*4 evaluates as (5)*4 = 20
            // Need parentheses if op2 has higher precedence, or if equal precedence and non-commutative
            if (op2.guard(v1, c)) {
              const v2 = op2.fn(v1, c)
              if (v2 === target) {
                // Validate the equation evaluates correctly before adding to candidates
                const needParens =
                  op2.prec > op1.prec || (op2.prec === op1.prec && !op2.commutative)
                const left = needParens ? `(${a}${op1.sym}${b})` : `${a}${op1.sym}${b}`
                const expr = `${left}${op2.sym}${c}`
                // Verify the equation evaluates correctly to avoid filtering later
                if (expr.length <= MAX) {
                  const result = evaluateExpression(expr)
                  if (result === target) candidates.add(expr)
                }
              }
            }

            // Right-associative: a op1 (b op2 c)
            // Example: 2+(3*4) evaluates as 2+(12) = 14
            // Parentheses are needed when op2 has lower precedence than op1
            // (e.g., 2+(3*4) needs parens, but 2*(3+4) doesn't due to precedence)
            if (op2.guard(b, c)) {
              const v3 = op2.fn(b, c)
              if (v3 === undefined) continue
              if (op1.guard(a, v3)) {
                const v4 = op1.fn(a, v3)
                if (v4 === target) {
                  // Add parentheses only when necessary for correct evaluation
                  // If op2 has lower precedence than op1, we need parens
                  // Example: 2+(3*4) needs parens, but 2*(3+4) doesn't
                  const mid = op2.prec < op1.prec ? `(${b}${op2.sym}${c})` : `${b}${op2.sym}${c}`
                  const expr = `${a}${op1.sym}${mid}`
                  // Verify the equation evaluates correctly to avoid filtering later
                  if (expr.length <= MAX) {
                    const result = evaluateExpression(expr)
                    if (result === target) candidates.add(expr)
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Convert Set to array (validation already done during generation)
  const arr = Array.from(candidates)

  // Fallback if no valid equations found (shouldn't happen in practice)
  if (isEmpty(arr)) return `${target}+0`

  // Use seeded random to ensure same puzzle for same date and target
  // Combine dateSeed with target using string concatenation to avoid collisions
  // This makes puzzles consistent across sessions for the same day
  const combinedSeed = `${dateSeed}:${target}`
  const randomIndex = Math.floor(seededRandom(combinedSeed) * arr.length)
  return arr[randomIndex] ?? arr[0] ?? `${target}+0`
}
