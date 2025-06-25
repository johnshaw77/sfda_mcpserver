# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🛠️ 常用開發命令

### MCP Server (主要開發區域: `mcp-server/`)

```bash
# 進入 MCP Server 目錄
cd mcp-server

# 安裝依賴
npm install

# 開發模式啟動 (使用 nodemon)
npm run dev

# 生產模式啟動
npm run start

# 執行測試
npm run test

# 監控模式執行測試
npm run test:watch

# 執行測試並生成覆蓋率報告
npm run test:coverage

# 程式碼檢查
npm run lint

# 自動修復 lint 問題
npm run lint:fix

# 程式碼格式化
npm run format
```

### 快速測試各模組工具

```bash
# 健康檢查
curl http://localhost:8080/health

# 查看所有可用工具
curl http://localhost:8080/api/tools | jq

# 測試 HR 工具 - 員工查詢
curl -X POST "http://localhost:8080/api/hr/get_employee" \
  -H "Content-Type: application/json" \
  -d '{"employeeNo": "A123456"}'

# 測試 MIL 工具 - 專案列表
curl -X POST "http://localhost:8080/api/mil/get_mil_list" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "limit": 10}'

# 測試 STAT 工具 - T檢定
curl -X POST "http://localhost:8080/api/stat/perform_ttest" \
  -H "Content-Type: application/json" \
  -d '{"group1": [1,2,3], "group2": [4,5,6]}'
```

## 🏗️ 程式碼架構

### 整體架構概念

這是一個企業級 AI + MCP (Model Context Protocol) 系統，採用三層架構：

```
AI 網站系統 ↔ MCP Server ↔ 企業後端系統
```

### 核心組件架構

```
mcp-server/src/
├── server.js                    # 主伺服器入口，Express 應用程式
├── config/
│   ├── config.js                # 環境設定管理
│   ├── db-config.js             # 資料庫設定
│   ├── logger.js                # 日誌系統設定
│   ├── hybrid-logger.js         # 混合日誌處理器
│   └── module-registry.js       # 模組註冊表
├── services/
│   ├── mcp-protocol.js          # MCP 協議處理核心
│   ├── database.js              # 資料庫服務抽象層
│   ├── api-client.js            # 外部 API 客戶端
│   └── sse-manager.js           # Server-Sent Events 管理
├── tools/                       # MCP 工具模組 (核心業務邏輯)
│   ├── index.js                 # 工具註冊管理器
│   ├── tool-manager.js          # 工具生命週期管理
│   ├── base-tool.js             # 工具基礎類別
│   ├── hr/                      # HR 人資管理模組
│   │   ├── index.js             # HR 模組註冊
│   │   ├── routes.js            # HR API 路由
│   │   ├── get-employee.js      # 員工查詢工具
│   │   ├── search-employees.js  # 員工搜尋工具
│   │   └── get-employee-count.js # 員工統計工具
│   ├── mil/                     # MIL 專案任務管理模組
│   │   ├── index.js             # MIL 模組註冊
│   │   ├── get-mil-list.js      # 專案列表查詢
│   │   ├── get-mil-details.js   # 專案詳情查詢
│   │   ├── get-status-report.js # 狀態報告
│   │   ├── get-mil-type-list.js # 專案類型列表
│   │   └── get-count-by.js      # 統計查詢
│   └── stat/                    # 統計分析工具模組
│       ├── index.js             # 統計模組註冊
│       ├── perform-ttest.js     # T檢定工具
│       ├── perform-anova.js     # ANOVA檢定工具
│       ├── perform-chisquare.js # 卡方檢定工具
│       ├── analyze-data.js      # 數據分析工具
│       ├── parse-csv-ttest.js   # CSV解析T檢定
│       └── create-chart.js      # 圖表創建工具
├── routes/
│   └── index.js                 # 路由統一註冊器
└── middleware/
    ├── auth.js                  # 認證中間件
    └── logging.js               # 請求日誌中間件
```

## 📊 業務模組詳細說明

### HR 模組 (人資管理)
- **模組名稱**: `hr`
- **API 端點**: `/api/hr`
- **主要功能**: 員工資訊查詢、搜尋、統計
- **資料來源**: `org_employee` 資料表
- **工具數量**: 3個
  - `get_employee` - 員工詳細資訊查詢
  - `search_employees` - 員工搜尋
  - `get_employee_count` - 員工統計

### MIL 模組 (專案任務管理)
- **模組名稱**: `mil`
- **API 端點**: `/api/mil`
- **主要功能**: 專案進度追蹤、任務管理、狀態報告
- **工具數量**: 5個
  - `get_mil_list` - 專案列表查詢
  - `get_mil_details` - 專案詳情查詢
  - `get_status_report` - 狀態報告
  - `get_mil_type_list` - 專案類型列表
  - `get_count_by` - 統計查詢

### STAT 模組 (統計分析)
- **模組名稱**: `stat`
- **API 端點**: `/api/stat`
- **主要功能**: 統計假設檢定、數據分析、圖表生成
- **工具數量**: 6個
  - `perform_ttest` - T檢定
  - `perform_anova` - ANOVA檢定
  - `perform_chisquare` - 卡方檢定
  - `analyze_data` - 數據分析
  - `parse_csv_ttest` - CSV解析T檢定
  - `create_chart` - 圖表創建

### 工具架構設計模式

每個業務模組遵循一致的架構模式：

1. **模組註冊** (`tools/{module}/index.js`): 工具定義和模組資訊
2. **工具實作** (`tools/{module}/{tool-name}.js`): 具體工具邏輯
3. **基礎類別繼承**: 所有工具繼承自 `base-tool.js`

## 🔄 開發工作流程

### 新增工具的標準流程

1. 在對應模組目錄 `tools/{module}/` 建立新工具檔案
2. 實作工具邏輯，繼承 `base-tool.js`
3. 在 `tools/{module}/index.js` 註冊新工具
4. 編寫測試檔案到 `tests/`
5. 執行 `npm run test` 確保測試通過
6. 執行 `npm run lint` 檢查程式碼品質

### 測試策略

- 單元測試位於 `tests/` 目錄
- 使用 Jest 測試框架
- 測試命名規則: `test-{功能名稱}.js`
- 各模組都有對應的測試檔案

## 🔧 重要設定檔

### 環境變數 (`.env`)

```bash
# 伺服器設定
MCP_PORT=8080
NODE_ENV=development

# 資料庫設定
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_database

# 日誌設定
LOG_LEVEL=info
LOGGING_ENABLED=true
DEBUG=false
```

### 資料庫連接

專案使用多資料庫策略：
- **HR 資料庫**: 存取 `org_employee` 資料表
- **MIL 資料庫**: 專案任務相關資料表
- **STAT 模組**: 主要進行數據計算，較少直接資料庫操作

## 🚨 開發注意事項

### 資料安全

- HR 工具：所有查詢自動排除測試帳號，禁止快取敏感資料
- MIL 工具：專案資料需要考慮權限控制
- STAT 工具：統計計算結果可以快取以提升效能

### API 路由規範

- 新式路由: `/api/{module}/{toolName}` (建議使用)
- 舊式路由: `/tools/{toolName}` (保持向後相容)

### 錯誤處理

- 使用統一的錯誤處理中間件
- 錯誤日誌自動記錄到 Winston
- 開發環境顯示詳細錯誤，生產環境隱藏敏感資訊

## 📚 相關文檔

- **API 文檔**: `docs/api-spec.md`, `docs/api-tools.md`
- **部署指南**: `docs/deployment.md`
- **開發者指南**: `docs/developer-guide.md`
- **MIL 模組文檔**: `mcp-server/src/services/mil/`
- **統計工具範例**: `mcp-server/tests/performTTest_examples.md`