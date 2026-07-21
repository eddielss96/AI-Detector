import type { TextAnalysis } from './types'

export interface Explanation {
  label: string
  bullets: string[]
  disclaimer: string
}

function scoreLabel(percent: number): string {
  if (percent >= 75) return '極可能為 AI 生成'
  if (percent >= 55) return '可能為 AI 生成'
  if (percent >= 35) return '較難判斷，特徵混合'
  return '較可能為人類寫作'
}

export function explainAnalysis(
  analysis: Pick<
    TextAnalysis,
    'overallScorePercent' | 'perplexity' | 'burstinessCV' | 'topRankFraction' | 'truncated'
  >,
): Explanation {
  const { overallScorePercent, perplexity, burstinessCV, topRankFraction, truncated } = analysis
  const bullets: string[] = []

  bullets.push(
    perplexity <= 15
      ? `全文困惑度偏低（約 ${perplexity.toFixed(1)}），代表用詞選擇對參考語言模型來說高度可預測，是 AI 生成文字的常見特徵。`
      : perplexity >= 45
        ? `全文困惑度偏高（約 ${perplexity.toFixed(1)}），用詞較不易被參考模型預測，較接近人類寫作的不規則性。`
        : `全文困惑度中等（約 ${perplexity.toFixed(1)}），介於可預測與不可預測之間，不構成強烈訊號。`,
  )

  bullets.push(
    burstinessCV <= 0.7
      ? `句子間的「爆發性」偏低（變異係數約 ${burstinessCV.toFixed(2)}），代表用字難易度起伏較小、風格平均，AI 生成文字常見這種穩定節奏。`
      : burstinessCV >= 1.1
        ? `句子間的「爆發性」偏高（變異係數約 ${burstinessCV.toFixed(2)}），代表難易度起伏大，較接近人類寫作時容易忽難忽易的特性。`
        : `句子間的爆發性中等（變異係數約 ${burstinessCV.toFixed(2)}）。`,
  )

  const topRankPct = (topRankFraction * 100).toFixed(0)
  bullets.push(
    topRankFraction >= 0.4
      ? `有 ${topRankPct}% 的字詞是參考模型認為「前 10 名最可能」的選字，比例偏高，顯示用字選擇相當公式化。`
      : topRankFraction <= 0.2
        ? `只有 ${topRankPct}% 的字詞落在參考模型「前 10 名最可能」的選字內，用字選擇較有個人風格或意外性。`
        : `約 ${topRankPct}% 的字詞落在參考模型「前 10 名最可能」的選字內，中等程度。`,
  )

  if (truncated) {
    bullets.push('文字長度超過分析上限，僅取前段內容進行分析，結果可能無法代表全文。')
  }

  return {
    label: scoreLabel(overallScorePercent),
    bullets,
    disclaimer:
      '本工具使用免費開源語言模型在瀏覽器端計算統計特徵（困惑度、用字可預測性），屬於零樣本推測方法，並非決定性證據，準確度不如需要伺服器運算的商用付費工具，僅供參考，請勿作為唯一判斷依據。',
  }
}
