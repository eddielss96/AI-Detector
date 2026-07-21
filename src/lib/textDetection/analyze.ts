import { Tensor } from '@huggingface/transformers'
import { computeOverallScore, computeSentenceLikelihood } from './scoring'
import type { ModelLoadProgress, SentenceScore, TextAnalysis, TokenScore } from './types'
import { loadModel } from './modelLoader'

/** Cap input length so a single analysis stays responsive in the browser. */
export const MAX_TOKENS = 400

const SENTENCE_BOUNDARY_RE = /[。！？!?.\n]/

interface LogitsTensorLike {
  dims: number[]
  data: ArrayLike<number>
}

function computeTokenStats(
  logits: LogitsTensorLike,
  inputIds: number[],
): Array<{ rank: number; surprisal: number }> {
  const [, seqLen, vocabSize] = logits.dims
  const data = logits.data
  const stats: Array<{ rank: number; surprisal: number }> = []

  // Position i's logits predict token i+1. The last position has no "next"
  // token to compare against, so we stop one short.
  for (let t = 0; t < seqLen - 1; t++) {
    const offset = t * vocabSize
    const actualId = inputIds[t + 1]
    const actualLogit = data[offset + actualId]

    let max = -Infinity
    for (let v = 0; v < vocabSize; v++) {
      const val = data[offset + v]
      if (val > max) max = val
    }

    let sumExp = 0
    let rank = 0
    for (let v = 0; v < vocabSize; v++) {
      const val = data[offset + v]
      sumExp += Math.exp(val - max)
      if (val > actualLogit) rank++
    }
    const logSumExp = max + Math.log(sumExp)
    const surprisal = logSumExp - actualLogit // -logProb, in nats

    stats.push({ rank, surprisal })
  }

  return stats
}

function buildTokens(
  decodedTexts: string[],
  stats: Array<{ rank: number; surprisal: number }>,
): TokenScore[] {
  // decodedTexts[0] has no preceding prediction (sentinel rank -1).
  const tokens: TokenScore[] = [{ text: decodedTexts[0] ?? '', rank: -1, surprisal: 0 }]
  for (let i = 0; i < stats.length; i++) {
    tokens.push({
      text: decodedTexts[i + 1] ?? '',
      rank: stats[i].rank,
      surprisal: stats[i].surprisal,
    })
  }
  return tokens
}

function segmentSentences(tokens: TokenScore[]): SentenceScore[] {
  const sentences: SentenceScore[] = []
  let start = 0
  let buffer = ''

  const flush = (end: number) => {
    if (end <= start) return
    const scored = tokens.slice(start, end).filter((t) => t.rank >= 0)
    const meanRank = scored.length
      ? scored.reduce((s, t) => s + t.rank, 0) / scored.length
      : 0
    const meanSurprisal = scored.length
      ? scored.reduce((s, t) => s + t.surprisal, 0) / scored.length
      : 0
    sentences.push({
      text: buffer,
      tokenStart: start,
      tokenEnd: end,
      meanRank,
      meanSurprisal,
      aiLikelihood: computeSentenceLikelihood(scored),
    })
    buffer = ''
    start = end
  }

  for (let i = 0; i < tokens.length; i++) {
    buffer += tokens[i].text
    if (SENTENCE_BOUNDARY_RE.test(tokens[i].text)) {
      flush(i + 1)
    }
  }
  flush(tokens.length)

  return sentences
}

export interface AnalyzeOptions {
  onStatus?: (stage: 'loading-model' | 'analyzing') => void
  onModelProgress?: (info: ModelLoadProgress) => void
}

const EMPTY_RESULT: TextAnalysis = {
  tokens: [],
  sentences: [],
  overallScorePercent: 0,
  perplexity: 1,
  burstinessCV: 0,
  topRankFraction: 0,
  truncated: false,
}

export async function analyzeText(
  text: string,
  options: AnalyzeOptions = {},
): Promise<TextAnalysis> {
  if (!text.trim()) return EMPTY_RESULT

  options.onStatus?.('loading-model')
  const { model, tokenizer } = await loadModel(options.onModelProgress)

  options.onStatus?.('analyzing')

  let inputIds: number[] = tokenizer.encode(text)
  let truncated = false
  if (inputIds.length > MAX_TOKENS) {
    inputIds = inputIds.slice(0, MAX_TOKENS)
    truncated = true
  }
  if (inputIds.length < 2) return EMPTY_RESULT

  const decodedTexts = inputIds.map((id) => tokenizer.decode([id], { skip_special_tokens: true }))

  const input_ids = new Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [
    1,
    inputIds.length,
  ])
  const attention_mask = new Tensor(
    'int64',
    BigInt64Array.from(inputIds.map(() => 1n)),
    [1, inputIds.length],
  )

  const { logits } = await model({ input_ids, attention_mask })
  const stats = computeTokenStats(logits as LogitsTensorLike, inputIds)
  const tokens = buildTokens(decodedTexts, stats)
  const scoredTokens = tokens.filter((t) => t.rank >= 0)

  const overall = computeOverallScore(scoredTokens)
  const sentences = segmentSentences(tokens)

  return {
    tokens,
    sentences,
    overallScorePercent: overall.overallScorePercent,
    perplexity: overall.perplexity,
    burstinessCV: overall.burstinessCV,
    topRankFraction: overall.topRankFraction,
    truncated,
  }
}
