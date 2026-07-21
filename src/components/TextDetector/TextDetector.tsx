import { useState } from 'react'
import { useTextAnalysis } from '../../hooks/useTextAnalysis'
import { explainAnalysis } from '../../lib/textDetection/explain'
import { MODEL_APPROX_SIZE_MB } from '../../lib/textDetection/modelLoader'
import { HighlightedText } from './HighlightedText'
import { ScoreGauge } from './ScoreGauge'
import { ExplanationPanel } from './ExplanationPanel'

const PLACEHOLDER = '請貼上要偵測的文字（建議 50 字以上，效果較穩定）……'

export function TextDetector() {
  const [text, setText] = useState('')
  const { status, progress, result, error, analyze } = useTextAnalysis()

  const busy = status === 'loading-model' || status === 'analyzing'

  const progressPercent =
    progress?.progress != null
      ? Math.round(progress.progress)
      : progress?.total
        ? Math.round(((progress.loaded ?? 0) / progress.total) * 100)
        : null

  return (
    <div className="text-detector">
      <p className="hint">
        模型（約 {MODEL_APPROX_SIZE_MB}MB）會在第一次分析時下載到瀏覽器並快取，之後重複使用不需再下載。全部運算都在你的裝置上執行，文字不會上傳到任何伺服器。
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={10}
        disabled={busy}
      />

      <button type="button" onClick={() => analyze(text)} disabled={busy || !text.trim()}>
        {busy ? '分析中…' : '開始分析'}
      </button>

      {status === 'loading-model' && (
        <div className="status-line">
          <span>正在載入模型{progress?.file ? `（${progress.file}）` : ''}…</span>
          {progressPercent != null && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          )}
        </div>
      )}
      {status === 'analyzing' && <div className="status-line">正在分析文字…</div>}
      {status === 'error' && <div className="status-line error">發生錯誤：{error}</div>}

      {status === 'done' && result && result.tokens.length > 0 && (
        <div className="results">
          {(() => {
            const explanation = explainAnalysis(result)
            return (
              <>
                <ScoreGauge percent={result.overallScorePercent} label={explanation.label} />
                <div className="legend">
                  <span>螢光標示強度 = 用詞可預測程度：</span>
                  <span
                    className="legend-swatch"
                    style={{ backgroundColor: 'rgba(250,204,21,0.65)' }}
                  >
                    高
                  </span>
                  <span
                    className="legend-swatch"
                    style={{ backgroundColor: 'rgba(250,204,21,0.35)' }}
                  >
                    中
                  </span>
                  <span
                    className="legend-swatch"
                    style={{ backgroundColor: 'rgba(250,204,21,0.14)' }}
                  >
                    低
                  </span>
                  <span className="legend-swatch">無標示 = 不可預測</span>
                </div>
                <HighlightedText tokens={result.tokens} />
                <ExplanationPanel explanation={explanation} />
              </>
            )
          })()}
        </div>
      )}

      {status === 'done' && result && result.tokens.length === 0 && (
        <p className="status-line">文字太短，無法分析，請輸入更多內容。</p>
      )}
    </div>
  )
}
