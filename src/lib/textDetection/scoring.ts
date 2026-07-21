import type { TokenScore } from './types'

/**
 * Heuristic thresholds below are rough empirical anchors, not calibrated
 * probabilities. They map raw statistics (perplexity, burstiness, top-rank
 * fraction) onto a 0-1 "looks AI-generated" scale for each signal, which are
 * then blended into a single percentage. Tune here if real-world samples
 * suggest the scale is off.
 */
const PERPLEXITY_LOW = 8 // at/below this, text reads as highly predictable (AI-like)
const PERPLEXITY_HIGH = 60 // at/above this, text reads as bursty/human-like

const BURSTINESS_LOW = 0.5 // low variance in surprisal (AI-like)
const BURSTINESS_HIGH = 1.3 // high variance in surprisal (human-like)

const TOP_RANK_FRACTION_LOW = 0.15
const TOP_RANK_FRACTION_HIGH = 0.5
const TOP_RANK_THRESHOLD = 10

const WEIGHTS = {
  perplexity: 0.4,
  burstiness: 0.3,
  topRankFraction: 0.3,
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/** Maps a value down from "human-like" to up at "AI-like" using a log-scaled inverse ramp. */
function inverseLogRamp(value: number, low: number, high: number): number {
  const logValue = Math.log(Math.max(value, 1e-6))
  const logLow = Math.log(low)
  const logHigh = Math.log(high)
  return clamp01(1 - (logValue - logLow) / (logHigh - logLow))
}

function inverseLinearRamp(value: number, low: number, high: number): number {
  return clamp01(1 - (value - low) / (high - low))
}

function linearRamp(value: number, low: number, high: number): number {
  return clamp01((value - low) / (high - low))
}

export function computePerplexity(tokens: TokenScore[]): number {
  if (tokens.length === 0) return 1
  const meanSurprisal = tokens.reduce((sum, t) => sum + t.surprisal, 0) / tokens.length
  return Math.exp(meanSurprisal)
}

/** Coefficient of variation of per-token surprisal: stdev / mean. */
export function computeBurstiness(tokens: TokenScore[]): number {
  if (tokens.length < 2) return BURSTINESS_HIGH
  const mean = tokens.reduce((sum, t) => sum + t.surprisal, 0) / tokens.length
  if (mean <= 1e-9) return 0
  const variance =
    tokens.reduce((sum, t) => sum + (t.surprisal - mean) ** 2, 0) / tokens.length
  return Math.sqrt(variance) / mean
}

export function computeTopRankFraction(
  tokens: TokenScore[],
  threshold = TOP_RANK_THRESHOLD,
): number {
  if (tokens.length === 0) return 0
  const count = tokens.filter((t) => t.rank < threshold).length
  return count / tokens.length
}

export interface OverallScoreBreakdown {
  overallScorePercent: number
  perplexity: number
  burstinessCV: number
  topRankFraction: number
  subScores: {
    perplexity: number
    burstiness: number
    topRankFraction: number
  }
}

export function computeOverallScore(tokens: TokenScore[]): OverallScoreBreakdown {
  const perplexity = computePerplexity(tokens)
  const burstinessCV = computeBurstiness(tokens)
  const topRankFraction = computeTopRankFraction(tokens)

  const subScores = {
    perplexity: inverseLogRamp(perplexity, PERPLEXITY_LOW, PERPLEXITY_HIGH),
    burstiness: inverseLinearRamp(burstinessCV, BURSTINESS_LOW, BURSTINESS_HIGH),
    topRankFraction: linearRamp(topRankFraction, TOP_RANK_FRACTION_LOW, TOP_RANK_FRACTION_HIGH),
  }

  const blended =
    subScores.perplexity * WEIGHTS.perplexity +
    subScores.burstiness * WEIGHTS.burstiness +
    subScores.topRankFraction * WEIGHTS.topRankFraction

  return {
    overallScorePercent: Math.round(clamp01(blended) * 100),
    perplexity,
    burstinessCV,
    topRankFraction,
    subScores,
  }
}

/** Per-sentence AI-likelihood, reusing the same rank/surprisal signals at sentence granularity. */
export function computeSentenceLikelihood(tokens: TokenScore[]): number {
  if (tokens.length === 0) return 0
  const perplexity = computePerplexity(tokens)
  const topRankFraction = computeTopRankFraction(tokens)
  const perplexityScore = inverseLogRamp(perplexity, PERPLEXITY_LOW, PERPLEXITY_HIGH)
  const topRankScore = linearRamp(topRankFraction, TOP_RANK_FRACTION_LOW, TOP_RANK_FRACTION_HIGH)
  return clamp01(perplexityScore * 0.6 + topRankScore * 0.4)
}
