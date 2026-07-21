import type { CSSProperties } from 'react'
import type { TokenScore } from '../../lib/textDetection/types'

function bucketStyle(rank: number): CSSProperties {
  if (rank < 0) return {}
  if (rank < 10) return { backgroundColor: 'rgba(250, 204, 21, 0.65)' }
  if (rank < 100) return { backgroundColor: 'rgba(250, 204, 21, 0.35)' }
  if (rank < 1000) return { backgroundColor: 'rgba(250, 204, 21, 0.14)' }
  return {}
}

function bucketLabel(rank: number): string {
  if (rank < 0) return '無預測資料'
  if (rank < 10) return '前 10 名最可能選字（高度可預測）'
  if (rank < 100) return '前 100 名可能選字'
  if (rank < 1000) return '前 1000 名可能選字'
  return '罕見選字（不可預測）'
}

export function HighlightedText({ tokens }: { tokens: TokenScore[] }) {
  return (
    <div className="highlighted-text" aria-label="AI 可能性螢光標示文字">
      {tokens.map((token, i) => (
        <span
          key={i}
          style={bucketStyle(token.rank)}
          title={
            token.rank < 0
              ? bucketLabel(token.rank)
              : `${bucketLabel(token.rank)}（排名 ${token.rank}，surprisal ${token.surprisal.toFixed(2)}）`
          }
        >
          {token.text}
        </span>
      ))}
    </div>
  )
}
