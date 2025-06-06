# 企業級 AI + MCP 系統專案

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://docker.com/)

> 一個整合企業內部系統的 AI 解決方案，透過 Model Context Protocol (MCP) 提供統一的工具調用介面

## 📋 專案概述

本專案旨在建立一個企業級的 AI 系統，整合人資、財務、任務管理等內部系統，透過 MCP 協議讓 AI 能夠安全、高效地存取企業內部資料。系統採用無認證設計，專注於核心功能的快速實現和部署。

### 🎯 核心價值

- **統一介面**：將複雜的企業系統整合為 AI 可直接調用的標準化工具
- **模組化設計**：各系統職責分離，便於維護和擴展
- **企業友善**：基於 HTTP 標準，易於整合現有系統
- **快速部署**：簡化的架構設計，支持快速 PoC 和生產部署

## 🏗️ 系統架構

```
┌─────────────────┐    HTTP/SSE     ┌─────────────────┐    HTTP API    ┌─────────────────┐
│                 │ ◄──────────────► │                 │ ◄─────────────► │                 │
│   AI 網站系統    │                 │   MCP Server    │                │   企業後端系統   │
│   (主系統)       │                 │   (中間層)       │                │   (資料層)       │
└─────────────────┘                 └─────────────────┘                └─────────────────┘
```

### 系統組件

| 組件             | 職責                              | 技術棧                         |
| ---------------- | --------------------------------- | ------------------------------ |
| **AI 網站系統**  | 用戶介面、AI 邏輯處理、MCP 客戶端 | Next.js, React, MCP Client     |
| **MCP Server**   | 工具定義、API 轉換、錯誤處理      | Node.js, Express, MCP Protocol |
| **企業後端系統** | 業務邏輯、資料存取、權限控制      | RESTful API, Database          |

## 🔧 功能特色

### 已規劃的 MCP 工具

#### 👥 人資管理

- `get_employee_info` - 員工資訊查詢
- `get_department_list` - 部門列表獲取
- `get_attendance_summary` - 出勤統計查詢

#### 💰 財務管理

- `get_budget_status` - 預算執行狀況
- `get_expense_report` - 費用報告分析

#### 📋 任務管理

- `create_task` - 工作任務創建
- `get_task_list` - 任務列表查詢

## 📊 專案評估

### ✅ 架構優勢

- **清晰的三層架構**：職責分離明確，符合企業級系統設計原則
- **標準化協議**：採用 MCP 標準，確保與 AI 系統良好整合
- **模組化工具設計**：易於擴展和維護
- **容器化支持**：支持 Docker 部署，便於環境管理

### 📈 商業價值

| 時期     | 價值                               |
| -------- | ---------------------------------- |
| **短期** | 快速整合現有企業系統，提升工作效率 |
| **中期** | 建立企業 AI 能力基礎設施           |
| **長期** | 成為企業數位轉型的核心平台         |

### 🎯 成功指標

#### 技術指標

- 系統可用性 >99.5%
- API 回應時間 <2 秒
- 錯誤率 <1%
- 並發支援 >100 用戶

#### 業務指標

- 用戶滿意度 >4.5/5
- 查詢成功率 >95%
- 功能覆蓋率：80% 常用企業功能
- 新用戶 5 分鐘內上手

## 🚀 快速開始

### 環境需求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- Docker (可選，建議使用)

### 安裝步驟

1. **克隆專案**

   ```bash
   git clone <repository-url>
   cd sfda_mcpserver
   ```

2. **安裝依賴**

   ```bash
   cd mcp-server
   npm install
   ```

3. **配置環境變數**

   ```bash
   cp .env.example .env
   # 編輯 .env 文件，配置相關參數
   ```

4. **啟動服務**

   ```bash
   npm run start
   ```

5. **驗證安裝**
   ```bash
   curl http://localhost:8080/health
   # 應返回：{"status": "ok", ...}
   ```

### Docker 部署

```bash
# 建立映像檔
docker build -t mcp-server:latest .

# 啟動容器
docker run -d --name mcp-server \
  --env-file .env \
  -p 8080:8080 \
  mcp-server:latest
```

## 📁 專案結構

```
├── mcp-server/                    # MCP 服務器
│   ├── src/
│   │   ├── server.js              # 主服務器文件
│   │   ├── tools/                 # 工具定義模組
│   │   ├── services/              # 服務層
│   │   └── config/                # 配置管理
│   └── package.json
├── docs/                          # 專案文檔
│   ├── api-spec.md               # API 規格文檔
│   ├── api-tools.md              # 工具使用指南
│   └── deployment.md             # 部署指南
├── shared/                        # 共享資源
├── docker-compose.yml             # 容器編排
└── README.md                      # 專案說明
```

## 🔄 開發工作流

### 本地開發

```bash
# 開發模式啟動
npm run dev

# 運行測試
npm run test

# 程式碼檢查
npm run lint
```

### API 測試

```bash
# 健康檢查
curl http://localhost:8080/health

# 獲取工具列表
curl http://localhost:8080/tools

# 調用特定工具
curl -X POST http://localhost:8080/tools/get_employee_info \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "A123456"}'
```

## 📋 路線圖

### 第一階段 (MVP) - 4-6 週

- [ ] 建立基礎 MCP Server 框架
- [ ] 實作 2-3 個核心工具
- [ ] 完成基本 HTTP API 介面
- [ ] 建立簡單錯誤處理機制

### 第二階段 (擴展) - 2-3 個月

- [ ] 增加更多業務工具
- [ ] 實作監控和日誌系統
- [ ] 效能優化和併發處理
- [ ] 添加基礎認證機制

### 第三階段 (生產就緒) - 6 個月+

- [ ] 完整的安全機制
- [ ] 自動化部署流程
- [ ] 完善的監控告警
- [ ] 災難恢復計劃

## ⚠️ 注意事項

### 安全考量

- 目前採用無認證設計，僅適用於內網環境
- 生產環境建議添加 API Key 或 Token 驗證
- 定期更新依賴包，修補安全漏洞

### 效能考量

- 預設配置適用於中小型企業
- 大型企業需要考慮負載均衡和水平擴展
- 建議實作快取機制以提升回應速度

## 🤝 貢獻指南

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 文檔

- [API 規格文檔](docs/api-spec.md)
- [工具使用指南](docs/api-tools.md)
- [部署指南](docs/deployment.md)
- [系統架構規劃](docs/plan.md)

## 📞 聯絡資訊

- **專案維護者**：[Your Name]
- **電子郵件**：[your.email@company.com]
- **問題回報**：請使用 GitHub Issues

## 📄 授權條款

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 文件。

---

**🚀 開始你的企業 AI 之旅吧！**
