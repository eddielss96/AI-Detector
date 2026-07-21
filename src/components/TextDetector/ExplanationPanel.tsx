import type { Explanation } from '../../lib/textDetection/explain'

export function ExplanationPanel({ explanation }: { explanation: Explanation }) {
  return (
    <div className="explanation-panel">
      <h3>{explanation.label}</h3>
      <ul>
        {explanation.bullets.map((bullet, i) => (
          <li key={i}>{bullet}</li>
        ))}
      </ul>
      <p className="disclaimer">⚠️ {explanation.disclaimer}</p>
    </div>
  )
}
