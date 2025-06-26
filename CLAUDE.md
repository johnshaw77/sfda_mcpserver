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
  -d '{"data": {"sample1": [1,2,3,4,5], "sample2": [6,7,8,9,10]}}'

# 測試 STAT 工具 - Mann-Whitney U 檢定
curl -X POST "http://localhost:8080/api/stat/perform_mann_whitney" \
  -H "Content-Type: application/json" \
  -d '{"data": {"sample1": [1,2,3,4,5], "sample2": [6,7,8,9,10]}}'

# 測試 STAT 工具 - 直方圖創建
curl -X POST "http://localhost:8080/api/stat/create_histogram" \
  -H "Content-Type: application/json" \
  -d '{"values": [1,2,3,4,5,6,7,8,9,10], "title": "測試直方圖"}'

# 測試 STAT 工具 - 盒鬚圖創建
curl -X POST "http://localhost:8080/api/stat/create_boxplot" \
  -H "Content-Type: application/json" \
  -d '{"groups": [[1,2,3,4,5], [6,7,8,9,10], [11,12,13,14,15]], "group_labels": ["組A", "組B", "組C"]}'
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
│       ├── perform-mann-whitney.js # Mann-Whitney U 檢定工具
│       ├── perform-wilcoxon.js  # Wilcoxon 符號等級檢定工具
│       ├── perform-kruskal-wallis.js # Kruskal-Wallis 檢定工具
│       ├── analyze-data.js      # 數據分析工具
│       ├── parse-csv-ttest.js   # CSV解析T檢定
│       ├── create-chart.js      # 簡單圖表創建工具
│       ├── create-histogram.js  # 直方圖創建工具
│       ├── create-boxplot.js    # 盒鬚圖創建工具
│       └── create-scatter.js    # 散點圖創建工具
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
- **主要功能**: 統計假設檢定、數據分析、圖表生成、視覺化
- **資料來源**: sfda_stat 統計分析後端 (http://localhost:8000)
- **工具數量**: 12個

#### 統計檢定工具 (6個)
  - `perform_ttest` - T檢定 (單樣本、獨立樣本、配對樣本)
  - `perform_anova` - ANOVA 單因子變異數分析
  - `perform_chisquare` - 卡方檢定 (適合度檢定、獨立性檢定)
  - `perform_mann_whitney` - Mann-Whitney U 檢定 (非參數雙組比較)
  - `perform_wilcoxon` - Wilcoxon 符號等級檢定 (非參數配對比較)
  - `perform_kruskal_wallis` - Kruskal-Wallis 檢定 (非參數多組比較)

#### 數據分析工具 (2個)
  - `analyze_data` - 智能數據分析和檢定建議
  - `parse_csv_ttest` - CSV 數據解析和統計檢定

#### 圖表創建工具 (4個)
  - `create_chart` - 簡單圖表創建 (圓餅圖、長條圖、折線圖)
  - `create_histogram` - 直方圖創建 (數據分佈視覺化)
  - `create_boxplot` - 盒鬚圖創建 (組間比較、異常值檢測)
  - `create_scatter` - 散點圖創建 (相關性分析、迴歸視覺化)

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

## 📊 統計分析系統重要資訊

### STAT 模組架構設計

STAT 模組採用**雙層架構設計**，提供強大的統計分析能力：

```
AI 使用者 → MCP Server (Node.js) → sfda_stat Backend (FastAPI/Python)
```

#### 後端統計服務 (sfda_stat)
- **位置**: `/Users/johnhsiao/Desktop/@Projects/sfda_stat`
- **技術棧**: FastAPI + Python + NumPy + SciPy + matplotlib + seaborn
- **端點**: `http://localhost:8000`
- **功能**: 統計計算引擎、圖表生成、效果量計算

#### 前端 MCP 工具層
- **位置**: `mcp-server/src/tools/stat/`
- **技術棧**: Node.js + Express
- **功能**: 工具包裝、參數驗證、結果格式化、情境化解釋

### 統計功能特色

#### 🔬 **完整效果量支援**
- **T檢定**: Cohen's d 效果量
- **ANOVA**: Eta squared (η²) 效果量  
- **卡方檢定**: Cramér's V 效果量
- **非參數檢定**: r 效果量 (Mann-Whitney, Wilcoxon, Kruskal-Wallis)

#### 📈 **進階視覺化功能**
- **直方圖**: 數據分佈檢查、常態性視覺評估
- **盒鬚圖**: 組間比較、異常值檢測、四分位數分析
- **散點圖**: 相關性視覺化、迴歸線顯示、異常值識別
- **基礎圖表**: 圓餅圖、長條圖、折線圖

#### 🧠 **智能分析建議**
- **自動檢定選擇**: 根據數據特徵建議適當的統計檢定
- **假設檢查**: 常態性、變異數齊性、樣本大小充足性
- **情境化解釋**: 醫療、教育、品質控制等領域的專業解釋
- **後續分析建議**: 事後檢定、效果量解釋、實務意義

### 使用最佳實務

#### 參數檢定 vs 非參數檢定選擇
```javascript
// 數據常態分佈 + 變異數齊性 → 使用參數檢定
perform_ttest, perform_anova

// 數據偏態分佈 or 序位資料 → 使用非參數檢定  
perform_mann_whitney, perform_wilcoxon, perform_kruskal_wallis
```

#### 圖表選擇指南
```javascript
// 單變數分佈 → 直方圖
create_histogram

// 組間比較 → 盒鬚圖
create_boxplot  

// 雙變數關係 → 散點圖
create_scatter

// 類別資料 → 圓餅圖、長條圖
create_chart
```

### 資料安全

- HR 工具：所有查詢自動排除測試帳號，禁止快取敏感資料
- MIL 工具：專案資料需要考慮權限控制
- STAT 工具：統計計算結果可以快取以提升效能，數據經過匿名化處理

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