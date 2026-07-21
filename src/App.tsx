import { Tabs } from './components/layout/Tabs'
import { TextDetector } from './components/TextDetector/TextDetector'
import { ImageDetector } from './components/ComingSoon/ImageDetector'
import { VideoDetector } from './components/ComingSoon/VideoDetector'

function App() {
  return (
    <div className="app">
      <header>
        <h1>AI 內容識別器</h1>
        <p className="subtitle">
          在瀏覽器端偵測文字是否為 AI 生成，標示可疑段落與判斷依據 —— 完全免費、無需伺服器。
        </p>
      </header>

      <Tabs
        tabs={[
          { key: 'text', label: '文字偵測', content: <TextDetector /> },
          { key: 'image', label: '圖片偵測', content: <ImageDetector /> },
          { key: 'video', label: '影片偵測', content: <VideoDetector /> },
        ]}
      />

      <footer>
        <a href="https://github.com/eddielss96/AI-Detector-" target="_blank" rel="noreferrer">
          GitHub 原始碼
        </a>
      </footer>
    </div>
  )
}

export default App
