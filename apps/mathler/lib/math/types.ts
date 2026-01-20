export type Difficulty = 'easy' | 'medium' | 'hard'

/**
 * Operator definition for equation generation
 * @property sym - The operator symbol (+, -, *, /)
 * @property fn - Function that performs the operation, returns undefined for invalid operations
 * @property guard - Predicate that checks if operation is valid (e.g., no division by zero, positive subtraction)
 * @property prec - Precedence level (1 = addition/subtraction, 2 = multiplication/division)
 */
export interface Op {
  sym: '+' | '-' | '*' | '/'
  fn: (x: number, y: number) => number | undefined
  guard: (x: number, y: number) => boolean
  prec: 1 | 2
  commutative: boolean
}
