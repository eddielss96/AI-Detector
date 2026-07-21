export function VideoDetector() {
  return (
    <div className="coming-soon">
      <h2>影片偵測（開發中）</h2>
      <p>規劃方向：</p>
      <ul>
        <li>依固定間隔抽樣影片幀，套用圖片偵測流程逐幀評分。</li>
        <li>挑出 AI 生成可能性最高的幾個時間點，標示「幾分幾秒」並輸出該幀截圖與框選區域。</li>
        <li>下方附上整體判斷理由與 AI 機率（%）。</li>
      </ul>
      <p className="hint">此分頁目前僅為規劃說明，尚未實作偵測功能。</p>
    </div>
  )
}
