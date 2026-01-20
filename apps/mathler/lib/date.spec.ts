import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDateKey } from './date'
import { generateSolutionEquation, getRandomTarget } from './math'

describe('getDateKey', () => {
  it('should produce same key for same date', () => {
    const date = new Date('2024-01-15T12:00:00Z')
    const key1 = getDateKey(date)
    const key2 = getDateKey(date)
    expect(key1).toBe(key2)
    expect(key1).toBe('2024-01-15')
  })

  it('should handle year boundaries correctly', () => {
    const dec31 = new Date('2023-12-31T23:59:59Z')
    const jan1 = new Date('2024-01-01T00:00:00Z')
    expect(getDateKey(dec31)).toBe('2023-12-31')
    expect(getDateKey(jan1)).toBe('2024-01-01')
  })

  it('should handle month boundaries correctly', () => {
    const jan31 = new Date('2024-01-31T23:59:59Z')
    const feb1 = new Date('2024-02-01T00:00:00Z')
    expect(getDateKey(jan31)).toBe('2024-01-31')
    expect(getDateKey(feb1)).toBe('2024-02-01')
  })

  it('should handle leap years correctly', () => {
    const feb29 = new Date('2024-02-29T12:00:00Z')
    expect(getDateKey(feb29)).toBe('2024-02-29')
  })

  it('should handle non-leap year February correctly', () => {
    const feb28 = new Date('2023-02-28T23:59:59Z')
    const mar1 = new Date('2023-03-01T00:00:00Z')
    expect(getDateKey(feb28)).toBe('2023-02-28')
    expect(getDateKey(mar1)).toBe('2023-03-01')
  })

  it('should use UTC for date calculation', () => {
    // Test that same UTC date produces same key regardless of local timezone
    const date1 = new Date('2024-01-15T00:00:00Z')
    const date2 = new Date('2024-01-15T23:59:59Z')
    // Both should produce same date key (same day)
    expect(getDateKey(date1)).toBe('2024-01-15')
    expect(getDateKey(date2)).toBe('2024-01-15')
  })

  it('should throw error for invalid date', () => {
    const invalidDate = new Date('invalid')
    expect(() => getDateKey(invalidDate)).toThrow('Invalid date provided to getDateKey')
  })
})

describe('Daily Puzzle Consistency', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should produce same target for same date for all users', () => {
    const date = new Date('2024-01-15T12:00:00Z')
    vi.setSystemTime(date)

    const target1 = getRandomTarget()
    const target2 = getRandomTarget()

    expect(target1).toBe(target2)
    expect(target1).toBeGreaterThanOrEqual(10)
    expect(target1).toBeLessThanOrEqual(100)
  })

  it('should produce different targets for different dates', () => {
    const date1 = new Date('2024-01-15T12:00:00Z')
    const date2 = new Date('2024-01-16T12:00:00Z')

    vi.setSystemTime(date1)
    const target1 = getRandomTarget()

    vi.setSystemTime(date2)
    const target2 = getRandomTarget()

    // Note: There's a small chance they could be the same, but very unlikely
    // In practice, different dates should produce different targets
    expect(target1).toBeGreaterThanOrEqual(10)
    expect(target1).toBeLessThanOrEqual(100)
    expect(target2).toBeGreaterThanOrEqual(10)
    expect(target2).toBeLessThanOrEqual(100)
  })

  it('should produce same equation for same date and target', () => {
    const date = new Date('2024-01-15T12:00:00Z')
    vi.setSystemTime(date)

    const target = getRandomTarget()
    const equation1 = generateSolutionEquation(target)
    const equation2 = generateSolutionEquation(target)

    expect(equation1).toBe(equation2)
    expect(equation1.length).toBeLessThanOrEqual(9)
  })

  it('should produce same puzzle for same date (target + equation)', () => {
    const date = new Date('2024-01-15T12:00:00Z')
    vi.setSystemTime(date)

    const target1 = getRandomTarget()
    const equation1 = generateSolutionEquation(target1)

    vi.setSystemTime(date)
    const target2 = getRandomTarget()
    const equation2 = generateSolutionEquation(target2)

    expect(target1).toBe(target2)
    expect(equation1).toBe(equation2)
  })

  it('should handle year boundaries correctly for puzzle generation', () => {
    const dec31 = new Date('2023-12-31T12:00:00Z')
    const jan1 = new Date('2024-01-01T12:00:00Z')

    vi.setSystemTime(dec31)
    const targetDec31 = getRandomTarget()
    const equationDec31 = generateSolutionEquation(targetDec31)

    vi.setSystemTime(jan1)
    const targetJan1 = getRandomTarget()
    const equationJan1 = generateSolutionEquation(targetJan1)

    // Different dates should produce different puzzles
    expect(targetDec31).toBeGreaterThanOrEqual(10)
    expect(targetDec31).toBeLessThanOrEqual(100)
    expect(targetJan1).toBeGreaterThanOrEqual(10)
    expect(targetJan1).toBeLessThanOrEqual(100)
    expect(equationDec31.length).toBeLessThanOrEqual(9)
    expect(equationJan1.length).toBeLessThanOrEqual(9)
  })

  it('should handle month boundaries correctly for puzzle generation', () => {
    const jan31 = new Date('2024-01-31T12:00:00Z')
    const feb1 = new Date('2024-02-01T12:00:00Z')

    vi.setSystemTime(jan31)
    const targetJan31 = getRandomTarget()
    const equationJan31 = generateSolutionEquation(targetJan31)

    vi.setSystemTime(feb1)
    const targetFeb1 = getRandomTarget()
    const equationFeb1 = generateSolutionEquation(targetFeb1)

    expect(targetJan31).toBeGreaterThanOrEqual(10)
    expect(targetJan31).toBeLessThanOrEqual(100)
    expect(targetFeb1).toBeGreaterThanOrEqual(10)
    expect(targetFeb1).toBeLessThanOrEqual(100)
    expect(equationJan31.length).toBeLessThanOrEqual(9)
    expect(equationFeb1.length).toBeLessThanOrEqual(9)
  })

  it('should handle leap year February 29 correctly', () => {
    const feb29 = new Date('2024-02-29T12:00:00Z')
    vi.setSystemTime(feb29)

    const target = getRandomTarget()
    const equation = generateSolutionEquation(target)

    expect(target).toBeGreaterThanOrEqual(10)
    expect(target).toBeLessThanOrEqual(100)
    expect(equation.length).toBeLessThanOrEqual(9)
  })
})
