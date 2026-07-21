export function ImageDetector() {
  return (
    <div className="coming-soon">
      <h2>圖片偵測（開發中）</h2>
      <p>規劃方向：</p>
      <ul>
        <li>用臉部 / 手部關鍵點偵測鎖定常見 AI 生成瑕疵位置（如五官比例、手指數量）。</li>
        <li>對這些區域做局部異常評分，於圖片上框選出可疑區域。</li>
        <li>全圖再跑一次整體 AI 生成機率評估，顯示於下方（含 % 與判斷理由）。</li>
      </ul>
      <p className="hint">此分頁目前僅為規劃說明，尚未實作偵測功能。</p>
    </div>
  )
}
