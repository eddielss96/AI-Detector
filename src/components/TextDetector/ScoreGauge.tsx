function colorForScore(percent: number): string {
  if (percent >= 75) return '#dc2626'
  if (percent >= 55) return '#f97316'
  if (percent >= 35) return '#eab308'
  return '#16a34a'
}

export function ScoreGauge({ percent, label }: { percent: number; label: string }) {
  const color = colorForScore(percent)
  return (
    <div className="score-gauge">
      <div className="score-gauge-header">
        <span className="score-gauge-percent" style={{ color }}>
          {percent}%
        </span>
        <span className="score-gauge-label">{label}</span>
      </div>
      <div className="score-gauge-track">
        <div
          className="score-gauge-fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <p className="score-gauge-caption">AI 生成可能性（統計推測，非決定性判斷）</p>
    </div>
  )
}
