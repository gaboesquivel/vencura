import uniq from 'lodash-es/uniq'

/**
 * Generates all possible equations that equal a target
 * (for hint system or verification)
 */
export function generateEquationsForTarget(target: number, maxLength = 9): string[] {
  const equations: string[] = []

  // Simple brute force for small numbers
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      if (i + j === target && `${i}+${j}`.length <= maxLength) equations.push(`${i}+${j}`)
      if (i - j === target && `${i}-${j}`.length <= maxLength) equations.push(`${i}-${j}`)
      if (i * j === target && `${i}*${j}`.length <= maxLength) equations.push(`${i}*${j}`)
      if (j !== 0 && i % j === 0 && i / j === target && `${i}/${j}`.length <= maxLength)
        equations.push(`${i}/${j}`)
    }
  }

  return uniq(equations).slice(0, 10)
}
