/**
 * Recursive descent parser for basic arithmetic expressions.
 * Handles operator precedence: multiplication/division before addition/subtraction.
 */

export function parseExpression(expr: string, pos: { current: number }): number | null {
  let left = parseTerm(expr, pos)
  if (left === null) return null

  while (pos.current < expr.length) {
    const op = expr[pos.current]
    if (op === '+') {
      pos.current++
      const right = parseTerm(expr, pos)
      if (right === null) return null
      left += right
    } else if (op === '-') {
      pos.current++
      const right = parseTerm(expr, pos)
      if (right === null) return null
      left -= right
    } else break
  }

  return left
}

function parseTerm(expr: string, pos: { current: number }): number | null {
  let left = parseFactor(expr, pos)
  if (left === null) return null

  while (pos.current < expr.length) {
    const op = expr[pos.current]
    if (op === '*') {
      pos.current++
      const right = parseFactor(expr, pos)
      if (right === null) return null
      left *= right
    } else if (op === '/') {
      pos.current++
      const right = parseFactor(expr, pos)
      if (right === null || right === 0) return null
      left /= right
    } else break
  }

  return left
}

function parseFactor(expr: string, pos: { current: number }): number | null {
  // Skip whitespace
  while (pos.current < expr.length && expr[pos.current] === ' ') {
    pos.current++
  }

  if (pos.current >= expr.length) return null

  if (expr[pos.current] === '(') {
    pos.current++
    const result = parseExpression(expr, pos)
    if (result === null) return null
    // Skip whitespace
    while (pos.current < expr.length && expr[pos.current] === ' ') {
      pos.current++
    }
    if (pos.current >= expr.length || expr[pos.current] !== ')') return null
    pos.current++
    return result
  }

  return parseNumber(expr, pos)
}

function parseNumber(expr: string, pos: { current: number }): number | null {
  // Skip whitespace
  while (pos.current < expr.length && expr[pos.current] === ' ') {
    pos.current++
  }

  if (pos.current >= expr.length) return null

  const start = pos.current
  // Parse integer part
  while (pos.current < expr.length) {
    const char = expr[pos.current]
    if (!char || !/^\d$/.test(char)) break
    pos.current++
  }

  // Parse decimal part
  if (pos.current < expr.length) {
    const char = expr[pos.current]
    if (char === '.') {
      pos.current++
      while (pos.current < expr.length) {
        const decimalChar = expr[pos.current]
        if (!decimalChar || !/^\d$/.test(decimalChar)) break
        pos.current++
      }
    }
  }

  if (start === pos.current) return null

  const numStr = expr.slice(start, pos.current)
  const num = Number.parseFloat(numStr)
  if (!Number.isFinite(num)) return null

  return num
}

export function parse(expr: string): number | null {
  const pos = { current: 0 }
  return parseExpression(expr, pos)
}
