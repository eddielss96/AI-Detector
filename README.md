# AI 內容識別器

在瀏覽器端偵測文字是否為 AI 生成，標示可疑段落與判斷依據 —— 完全免費、無需伺服器。

## 目前進度

- ✅ **文字偵測**：已實作。使用開源語言模型（`onnx-community/Qwen2.5-0.5B`，透過 [transformers.js](https://github.com/huggingface/transformers.js) 在瀏覽器端以 ONNX Runtime Web 執行）計算困惑度、爆發性、用字可預測度等統計特徵，推測文字是否為 AI 生成，並用螢光標示可疑片段、附上 AI 機率（%）與判斷理由。
- 🚧 **圖片偵測**：規劃中，尚未實作（UI 已有分頁說明未來方向）。
- 🚧 **影片偵測**：規劃中，尚未實作（UI 已有分頁說明未來方向）。

本工具的偵測方法是免費的零樣本統計推測，**不是**決定性證據，準確度不如需要伺服器運算的商用付費工具，僅供參考。

## 開發

```bash
npm install
npm run dev       # 本地開發伺服器
npm test          # 執行單元測試
npm run build     # 產出 dist/，供 GitHub Pages 部署
```

## 部署到 GitHub Pages

推送到 `main` 分支會自動觸發 `.github/workflows/deploy.yml` 建置並部署到 GitHub Pages。

**第一次部署前，需要手動到 repo 設定一次：** Settings → Pages → Source 選擇 **GitHub Actions**（這一步無法透過程式碼自動完成）。
