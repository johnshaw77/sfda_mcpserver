# MCP Server

企業級 AI + MCP 系統的核心服務器組件。

## 快速開始

1. 安裝依賴：

   ```bash
   npm install
   ```

2. 複製環境變數：

   ```bash
   cp .env.example .env
   ```

3. 啟動開發服務器：

   ```bash
   npm run dev
   ```

4. 測試健康檢查：
   ```bash
   curl http://localhost:8080/health
   ```

## 可用腳本

- `npm start` - 啟動生產服務器
- `npm run dev` - 啟動開發服務器（含熱重載）
- `npm test` - 執行測試
- `npm run lint` - 程式碼檢查
- `npm run format` - 程式碼格式化

## API 端點

- `GET /health` - 健康檢查
- `GET /tools` - 取得可用工具列表
- `GET /` - 服務器資訊

## 環境變數

請參考 `.env.example` 文件了解所有可用的環境變數配置。
