**`deployment.md`** 通常用來紀錄 MCP Server（或其他專案）的「部署步驟、環境需求、設定方式」等資訊。這是給**DevOps、工程師、維運人員**看的文件，目的是讓大家能快速、正確地完成部署或升級。

---

# `deployment.md` 內容範例

````markdown
# MCP Server 部署說明（deployment.md）

本文件說明 MCP Server 的部署流程、環境需求與常見問題排查。

---

## 1. 環境需求

- Node.js 18.x 以上
- npm 9.x 以上
- Linux 或 macOS（建議 Ubuntu 22.04 LTS）
- 企業內網可存取企業後端 API
- 建議使用 Docker（可選）

---

## 2. 前置作業

1. 取得 MCP Server 原始碼（Git clone 或下載壓縮檔）
2. 準備 `.env` 設定檔，內容範例如下：

   ```
   # MCP Server 環境變數
   MAIN_SYSTEM_URL=http://10.0.0.1:3000/api/mcp
   API_TIMEOUT=30000
   LOG_LEVEL=info
   ```

---

## 3. 安裝依賴

```bash
cd mcp-server
npm install
```

---

## 4. 啟動服務

### 方式一：直接啟動

```bash
npm run start
```

### 方式二：以 PM2 管理

```bash
npm install -g pm2
pm2 start app.js --name mcp-server
pm2 save
```

### 方式三：Docker 部署（建議）

1. 建立 Docker 映像檔

   ```bash
   docker build -t mcp-server:latest .
   ```

2. 啟動容器

   ```bash
   docker run -d --name mcp-server \
     --env-file .env \
     -p 8080:8080 \
     mcp-server:latest
   ```

---

## 5. 檢查服務狀態

- 開啟瀏覽器或用 curl 測試健康檢查 API：

  ```bash
  curl http://localhost:8080/health
  # 預期回應：{"status": "ok", ...}
  ```

---

## 6. 升級/更新流程

1. 拉取最新程式碼
2. 重新安裝依賴
3. 重新啟動服務（或重啟 Docker 容器）

---

## 7. 常見問題排查

| 問題現象        | 可能原因             | 解決方式            |
| --------------- | -------------------- | ------------------- |
| 服務啟動失敗    | .env 設定錯誤        | 檢查環境變數        |
| API 回傳 500    | 企業後端 API 無回應  | 檢查內網連線        |
| 無法安裝依賴    | Node/npm 版本不符    | 升級 Node.js 與 npm |
| Docker 啟動異常 | 埠號衝突、env 檔缺失 | 檢查埠號與環境變數  |

---

## 8. 其他注意事項

- 請勿將 `.env` 檔案上傳到公開倉庫
- 建議定期備份日誌與設定檔
- 若需設定自動重啟，建議使用 PM2 或 Docker restart policy

---

## 9. 聯絡窗口

如遇部署相關問題，請聯繫 DevOps 團隊（xxx@company.com）

---

# 版本資訊

- 文件更新：2024-06-06
````

---

## 小結

- `deployment.md` 是**部署與維運的 SOP**，讓新手或資深工程師都能快速上手。
- 內容涵蓋：環境需求、設定檔、安裝、啟動、升級、問題排查、聯絡方式等。
- 若有特殊部署需求（如多台機器、K8s、自動化腳本），也可加入對應章節。
