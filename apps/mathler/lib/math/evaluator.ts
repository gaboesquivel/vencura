import { parseExpression } from './parser'

/**
 * Evaluates a mathematical expression string.
 * Only supports basic arithmetic: numbers, +, -, *, /, and parentheses.
 * Results are rounded to 6 decimal places to avoid floating-point precision issues.
 *
 * @param expr - Expression string (may contain × and ÷ Unicode operators)
 * @returns Evaluated result as a number, or null if expression is invalid
 */
export function evaluateExpression(expr: string): number | null {
  try {
    // Replace × and ÷ with * and /
    const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/')

    // Validate expression (only allow digits, operators, parentheses, spaces, and decimal points)
    if (!/^[\d+\-*/.() ]+$/.test(normalized)) {
      return null
    }

    // Check for valid syntax - reject expressions starting or ending with operators
    // Reject unary minus at start (we don't support negative numbers)
    if (/^[+*/%-]|[+*/%]$/.test(normalized.trim())) {
      return null
    }

    if (/[+\-*/%]{2,}/.test(normalized)) {
      return null
    }

    // Explicit check for leading zeros (e.g., "01", "02", "03+5")
    // This prevents invalid number representations
    if (/\b0\d/.test(normalized)) {
      return null
    }

    // Evaluate using recursive descent parser
    const pos = { current: 0 }
    const result = parseExpression(normalized, pos)

    // Ensure we consumed the entire expression (allowing trailing whitespace)
    const remaining = normalized.slice(pos.current).trim()
    if (remaining.length > 0) {
      return null
    }

    // Check if result is a valid number
    if (result === null || !Number.isFinite(result)) {
      return null
    }

    // Round to 6 decimal places to avoid floating-point precision issues
    // Example: 0.1 + 0.2 = 0.30000000000000004 -> 0.3
    return Math.round(result * 1000000) / 1000000
  } catch {
    return null
  }
}
