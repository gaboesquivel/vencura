/**
 * Safe arithmetic expression evaluator using recursive descent parsing.
 * Only supports basic arithmetic: numbers, +, -, *, /, and parentheses.
 * No functions, variables, or other features - completely safe from code injection.
 *
 * This replaces expr-eval which has security vulnerabilities with no fixed version.
 */

export { evaluateExpression } from './evaluator'
export { generateSolutionEquation, getRandomTarget } from './generator'
export type { Difficulty, Op } from './types'
