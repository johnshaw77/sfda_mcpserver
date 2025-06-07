# MCP Server 演示環境配置指南

> 📅 最後更新：2025 年 6 月 7 日  
> 🎯 適用於：開發演示、客戶展示、功能測試

## 🎯 演示環境概述

演示環境是一個完整的 MCP Server 運行實例，包含所有核心功能和模擬數據，適用於：

- **客戶演示**：展示 MCP 協議和工具集成能力
- **開發測試**：驗證新功能和 API 整合
- **培訓教學**：讓團隊熟悉系統操作
- **概念驗證**：快速驗證商業構想

---

## 🚀 快速啟動演示環境

### 方法一：Docker Compose (推薦)

```bash
# 1. 複製專案
git clone <repository-url>
cd sfda_mcpserver

# 2. 設定演示環境變數
cp mcp-server/.env.example .env.demo
# 編輯 .env.demo，設定演示專用配置

# 3. 啟動完整演示環境
docker-compose -f docker-compose.demo.yml up -d

# 4. 確認服務狀態
docker-compose -f docker-compose.demo.yml ps
```

### 方法二：本地開發模式

```bash
# 1. 安裝依賴
cd mcp-server
npm install

# 2. 設定演示環境
cp .env.example .env
# 設定 NODE_ENV=demo

# 3. 啟動演示服務
npm run demo

# 4. 開啟監控面板
npm run start:monitoring
```

---

## 🎮 演示環境功能

### 核心 API 端點

| 端點                            | 說明       | 演示數據             |
| ------------------------------- | ---------- | -------------------- |
| `GET /`                         | 服務器資訊 | 版本、狀態、端點列表 |
| `GET /health`                   | 健康檢查   | 系統狀態、運行時間   |
| `GET /tools`                    | 工具列表   | 15+ 預設工具         |
| `POST /tools/get_employee_info` | 員工查詢   | 模擬員工資料         |
| `POST /tools/get_company_news`  | 公司新聞   | 示例新聞列表         |
| `GET /sse`                      | 即時事件流 | 實時系統事件         |

### 監控面板

- **Prometheus**：`http://localhost:9090`
- **Grafana**：`http://localhost:3000` (admin/admin)
- **API 文檔**：`http://localhost:8080/docs`

### 測試工具集

```bash
# 基本健康檢查
curl http://localhost:8080/health

# 取得工具列表
curl http://localhost:8080/tools

# 測試員工查詢工具
curl -X POST http://localhost:8080/tools/get_employee_info \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "EMP001"}'

# 訂閱事件流
curl -N http://localhost:8080/sse
```

---

## 📊 演示數據集

### 員工資料 (模擬)

```json
{
  "employees": [
    {
      "employee_id": "EMP001",
      "name": "王大明",
      "department": "資訊部",
      "position": "軟體工程師",
      "email": "wang.daming@company.com"
    },
    {
      "employee_id": "EMP002",
      "name": "李小華",
      "department": "人力資源部",
      "position": "HR 專員",
      "email": "li.xiaohua@company.com"
    }
  ]
}
```

### 公司新聞 (模擬)

```json
{
  "news": [
    {
      "id": "NEWS001",
      "title": "MCP Server 正式上線",
      "content": "新一代 AI 工具整合平台正式啟用...",
      "publish_date": "2025-06-07",
      "category": "技術"
    }
  ]
}
```

---

## 🎯 演示腳本

### 基礎功能演示 (5 分鐘)

1. **服務狀態確認**

   ```bash
   curl http://localhost:8080/health
   ```

2. **工具列表展示**

   ```bash
   curl http://localhost:8080/tools | jq
   ```

3. **員工查詢示範**

   ```bash
   curl -X POST http://localhost:8080/tools/get_employee_info \
     -H "Content-Type: application/json" \
     -d '{"employee_id": "EMP001"}' | jq
   ```

4. **即時事件訂閱**
   ```bash
   curl -N http://localhost:8080/sse
   ```

### 進階功能演示 (10 分鐘)

1. **批量工具調用**
2. **錯誤處理機制**
3. **效能監控展示**
4. **日誌查看**

### 整合演示 (15 分鐘)

1. **MCP 協議完整流程**
2. **多客戶端同時連接**
3. **實時監控儀表板**
4. **故障恢復演示**

---

## 🛠️ 自訂演示環境

### 添加自訂工具

```javascript
// demo-tools/custom-tool.js
module.exports = {
  name: "demo_custom_tool",
  description: "演示用自訂工具",
  parameters: {
    type: "object",
    properties: {
      input: { type: "string", description: "輸入參數" },
    },
  },
  handler: async (params) => {
    return {
      result: `演示結果：${params.input}`,
      timestamp: new Date().toISOString(),
    };
  },
};
```

### 修改演示數據

編輯 `demo-data/` 目錄下的 JSON 檔案：

- `employees.json` - 員工資料
- `news.json` - 公司新聞
- `departments.json` - 部門資訊

---

## 📋 演示檢查清單

### 啟動前檢查

- [ ] Docker 服務正常運行
- [ ] 埠號 8080、9090、3000 未被佔用
- [ ] 環境變數正確設定
- [ ] 演示數據檔案完整

### 演示中檢查

- [ ] 所有 API 端點回應正常
- [ ] SSE 連接穩定
- [ ] 監控面板顯示數據
- [ ] 工具調用成功

### 演示後清理

```bash
# 停止所有演示服務
docker-compose -f docker-compose.demo.yml down

# 清理數據 (可選)
docker-compose -f docker-compose.demo.yml down -v
```

---

## 🚨 常見問題

### Q: 埠號衝突怎麼辦？

修改 `.env.demo` 檔案中的埠號設定：

```bash
MCP_PORT=8081
PROMETHEUS_PORT=9091
GRAFANA_PORT=3001
```

### Q: 演示數據如何重置？

```bash
# 重新載入演示數據
docker-compose exec mcp-server npm run reset-demo-data
```

### Q: 如何新增演示場景？

參考 `scenarios/` 目錄下的範例檔案，建立新的演示腳本。

---

## 📞 支援資訊

- **技術文檔**：`docs/` 目錄
- **API 規格**：`docs/api-spec.md`
- **開發指南**：`docs/developer-guide.md`
- **故障排除**：`docs/troubleshooting.md`
