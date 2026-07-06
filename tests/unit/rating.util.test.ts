import { describe, expect, it } from 'vitest'
import {
  formatCompactCount,
  generateRatingSeed,
  ratingAverage,
  ratingSummary,
} from '../../utils/rating'

describe('ratingAverage', () => {
  it('returns 5 when all votes are likes', () => {
    expect(ratingAverage({ likes: 42, dislikes: 0 })).toBe(5)
  })

  it('returns 2 when all votes are dislikes', () => {
    expect(ratingAverage({ likes: 0, dislikes: 7 })).toBe(2)
  })

  it('returns 4 for a 2:1 like/dislike split', () => {
    expect(ratingAverage({ likes: 200, dislikes: 100 })).toBe(4)
  })

  it('returns 0 when there are no votes', () => {
    expect(ratingAverage({ likes: 0, dislikes: 0 })).toBe(0)
  })

  it('rounds to one decimal', () => {
    // (5*9 + 2*1) / 10 = 4.7
    expect(ratingAverage({ likes: 9, dislikes: 1 })).toBe(4.7)
    // (5*5 + 2*1) / 6 = 4.5
    expect(ratingAverage({ likes: 5, dislikes: 1 })).toBe(4.5)
    // (5*6 + 2*1) / 7 = 4.5714… → 4.6
    expect(ratingAverage({ likes: 6, dislikes: 1 })).toBe(4.6)
  })
})

describe('ratingSummary', () => {
  it('derives count and average from the counters', () => {
    expect(ratingSummary({ likes: 9, dislikes: 1 })).toEqual({
      likes: 9,
      dislikes: 1,
      count: 10,
      average: 4.7,
    })
  })
})

describe('formatCompactCount', () => {
  it('keeps small numbers as-is', () => {
    expect(formatCompactCount(0)).toBe('0')
    expect(formatCompactCount(42)).toBe('42')
    expect(formatCompactCount(999)).toBe('999')
  })

  it('formats thousands with one decimal below 10k', () => {
    expect(formatCompactCount(1000)).toBe('1k')
    expect(formatCompactCount(1234)).toBe('1.2k')
    expect(formatCompactCount(1950)).toBe('2k')
  })

  it('drops the decimal at 10k and above', () => {
    expect(formatCompactCount(12345)).toBe('12k')
    expect(formatCompactCount(999999)).toBe('1000k')
  })
})

describe('generateRatingSeed', () => {
  it('produces the minimum seed when rand is 0', () => {
    const seed = generateRatingSeed(() => 0)
    expect(seed.likes + seed.dislikes).toBe(300)
    expect(ratingAverage(seed)).toBe(4)
  })

  it('produces the maximum seed when rand is ~1', () => {
    const seed = generateRatingSeed(() => 0.999999)
    expect(seed.likes + seed.dislikes).toBe(2000)
    expect(seed.dislikes).toBe(0)
    expect(ratingAverage(seed)).toBe(5)
  })

  it('always stays within the required bounds', () => {
    let x = 0.123
    const rand = () => {
      // deterministic pseudo-random sequence in [0, 1)
      x = (x * 9301 + 49297) % 233280
      return x / 233280
    }
    for (let i = 0; i < 200; i++) {
      const seed = generateRatingSeed(rand)
      const total = seed.likes + seed.dislikes
      expect(Number.isInteger(seed.likes)).toBe(true)
      expect(Number.isInteger(seed.dislikes)).toBe(true)
      expect(seed.likes).toBeGreaterThanOrEqual(0)
      expect(seed.dislikes).toBeGreaterThanOrEqual(0)
      expect(total).toBeGreaterThanOrEqual(300)
      expect(total).toBeLessThanOrEqual(2000)
      const avg = ratingAverage(seed)
      expect(avg).toBeGreaterThanOrEqual(4)
      expect(avg).toBeLessThanOrEqual(5)
    }
  })
})
