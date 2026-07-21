import { describe, expect, it } from 'vitest'
import {
  computeBurstiness,
  computeOverallScore,
  computePerplexity,
  computeTopRankFraction,
} from '../scoring'
import type { TokenScore } from '../types'

function makeToken(rank: number, surprisal: number): TokenScore {
  return { text: 'x', rank, surprisal }
}

describe('computePerplexity', () => {
  it('returns 1 for empty input', () => {
    expect(computePerplexity([])).toBe(1)
  })

  it('is exp(mean surprisal)', () => {
    const tokens = [makeToken(0, 1), makeToken(0, 1), makeToken(0, 1)]
    expect(computePerplexity(tokens)).toBeCloseTo(Math.E, 5)
  })
})

describe('computeBurstiness', () => {
  it('is 0 for perfectly uniform surprisal', () => {
    const tokens = [makeToken(0, 2), makeToken(0, 2), makeToken(0, 2)]
    expect(computeBurstiness(tokens)).toBeCloseTo(0, 5)
  })

  it('is higher for more variable surprisal', () => {
    const uniform = [makeToken(0, 2), makeToken(0, 2), makeToken(0, 2), makeToken(0, 2)]
    const bursty = [makeToken(0, 0.1), makeToken(0, 5), makeToken(0, 0.2), makeToken(0, 6)]
    expect(computeBurstiness(bursty)).toBeGreaterThan(computeBurstiness(uniform))
  })
})

describe('computeTopRankFraction', () => {
  it('counts tokens ranked below the threshold', () => {
    const tokens = [makeToken(0, 1), makeToken(5, 1), makeToken(50, 1), makeToken(9, 1)]
    expect(computeTopRankFraction(tokens, 10)).toBeCloseTo(0.75, 5)
  })

  it('returns 0 for empty input', () => {
    expect(computeTopRankFraction([])).toBe(0)
  })
})

describe('computeOverallScore', () => {
  it('stays within [0, 100]', () => {
    const highlyPredictable = Array.from({ length: 50 }, () => makeToken(0, 0.5))
    const highlySurprising = Array.from({ length: 50 }, (_, i) =>
      makeToken(20000, i % 2 === 0 ? 0.1 : 12),
    )
    expect(computeOverallScore(highlyPredictable).overallScorePercent).toBeLessThanOrEqual(100)
    expect(computeOverallScore(highlyPredictable).overallScorePercent).toBeGreaterThanOrEqual(0)
    expect(computeOverallScore(highlySurprising).overallScorePercent).toBeLessThanOrEqual(100)
    expect(computeOverallScore(highlySurprising).overallScorePercent).toBeGreaterThanOrEqual(0)
  })

  it('scores low-surprisal, low-rank, low-variance tokens as more AI-like', () => {
    const aiLike = Array.from({ length: 60 }, () => makeToken(1, 0.3))
    const humanLike = Array.from({ length: 60 }, (_, i) =>
      makeToken(i % 3 === 0 ? 2000 : 5, i % 3 === 0 ? 9 : 0.4),
    )
    const aiScore = computeOverallScore(aiLike).overallScorePercent
    const humanScore = computeOverallScore(humanLike).overallScorePercent
    expect(aiScore).toBeGreaterThan(humanScore)
  })
})
