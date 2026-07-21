export interface TokenScore {
  /** Decoded text for this token, used to reconstruct the highlighted view. */
  text: string
  /** 0-indexed rank of the actual token within the model's predicted distribution (0 = most likely). */
  rank: number
  /** Surprisal of the actual token, i.e. -log(P(token)), in nats. */
  surprisal: number
}

export interface SentenceScore {
  text: string
  tokenStart: number
  tokenEnd: number
  meanRank: number
  meanSurprisal: number
  /** 0-1 likelihood used to drive highlight intensity for this sentence. */
  aiLikelihood: number
}

export interface TextAnalysis {
  tokens: TokenScore[]
  sentences: SentenceScore[]
  overallScorePercent: number
  perplexity: number
  burstinessCV: number
  topRankFraction: number
  truncated: boolean
}

export type ModelLoadProgress = {
  status: string
  file?: string
  progress?: number
  loaded?: number
  total?: number
}

export type WorkerRequest = { type: 'analyze'; text: string }

export type WorkerResponse =
  | { type: 'model-progress'; info: ModelLoadProgress }
  | { type: 'status'; stage: 'loading-model' | 'analyzing' }
  | { type: 'result'; result: TextAnalysis }
  | { type: 'error'; message: string }
