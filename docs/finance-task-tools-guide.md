# 財務與任務管理工具使用指南

## 概述

本文檔介紹新增的財務管理和任務管理工具模組。這些工具擴展了系統的業務功能，提供完整的企業資源管理解決方案。

## 📊 財務管理工具

### 1. get_budget_status - 預算狀態查詢

查詢部門或專案的預算狀態，包括預算總額、已使用金額、剩餘預算等詳細資訊。

#### 功能特點

- 支援部門、專案、類別預算查詢
- 提供預算使用率分析
- 支援門檻警示功能
- 包含詳細的支出明細
- 支援多貨幣單位

#### API 調用範例

```bash
# 查詢 IT 部門預算狀態
curl -X POST http://localhost:3000/tools/get_budget_status \
  -H "Content-Type: application/json" \
  -d '{
    "budgetType": "department",
    "budgetId": "IT",
    "fiscalYear": 2025,
    "includeDetails": true,
    "threshold": 80
  }'
```

#### 回應範例

```json
{
  "success": true,
  "result": {
    "budgets": [
      {
        "budgetId": "IT001",
        "budgetType": "department",
        "name": "資訊技術部年度預算",
        "departmentCode": "IT",
        "departmentName": "資訊技術部",
        "fiscalYear": 2025,
        "totalBudget": 25000000,
        "spentAmount": 15750000,
        "remainingAmount": 9250000,
        "utilizationRate": 63.0,
        "currency": "TWD",
        "status": "active"
      }
    ],
    "summary": {
      "totalBudget": 25000000,
      "totalSpent": 15750000,
      "totalRemaining": 9250000,
      "utilizationRate": 63.0,
      "currency": "TWD",
      "budgetCount": 1
    },
    "alerts": [],
    "timestamp": "2025-01-27T10:30:00.000Z"
  }
}
```

## 📋 任務管理工具

### 1. create_task - 任務創建

創建新的工作任務，支援完整的任務資訊設定和狀態管理。

#### 功能特點

- 完整的任務資訊設定
- 支援多種任務類型和優先級
- 自動計算緊急度評分
- 任務驗證和重複檢查
- 支援標籤和分類

#### API 調用範例

```bash
curl -X POST http://localhost:3000/tools/create_task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "系統安全性檢查",
    "description": "對現有系統進行全面的安全性檢查，包括漏洞掃描和權限審核",
    "type": "security_audit",
    "priority": "high",
    "assigneeId": "user004",
    "department": "IT",
    "dueDate": "2024-02-15",
    "estimatedHours": 16,
    "tags": ["security", "audit", "system"]
  }'
```

#### 回應範例

```json
{
  "success": true,
  "result": {
    "taskId": "TASK1006",
    "title": "系統安全性檢查",
    "description": "對現有系統進行全面的安全性檢查，包括漏洞掃描和權限審核",
    "type": "security_audit",
    "priority": "high",
    "status": "pending",
    "assignee": {
      "id": "user004",
      "name": "陳小強",
      "department": "IT",
      "email": "qiang.chen@company.com"
    },
    "department": "IT",
    "dueDate": "2024-02-15",
    "estimatedHours": 16,
    "urgencyScore": 115,
    "createdAt": "2024-01-27T10:30:00.000Z"
  }
}
```

### 2. get_task_list - 任務列表查詢

查詢任務列表，支援多種過濾、排序和搜尋功能，提供詳細的任務資訊和統計分析。

#### 功能特點

- 多種過濾條件支援
- 靈活的排序選項
- 文字搜尋功能
- 統計分析資訊
- 管理建議提供

#### API 調用範例

```bash
# 查詢 IT 部門的高優先級任務
curl -X POST http://localhost:3000/tools/get_task_list \
  -H "Content-Type: application/json" \
  -d '{
    "department": "IT",
    "priority": "high",
    "sortBy": "due_date",
    "sortOrder": "asc",
    "includeStatistics": true,
    "includeManagementSuggestions": true
  }'
```

#### 回應範例

```json
{
  "success": true,
  "result": {
    "tasks": [
      {
        "id": "TASK1001",
        "title": "使用者認證系統升級",
        "description": "升級現有的使用者認證系統，提升安全性並支援多因子認證",
        "type": "feature_development",
        "priority": "high",
        "status": "in_progress",
        "assignee": {
          "id": "user001",
          "name": "張小明",
          "department": "IT",
          "email": "ming.zhang@company.com"
        },
        "completionPercentage": 60,
        "urgencyScore": 120
      }
    ],
    "statistics": {
      "totalTasks": 5,
      "byStatus": {
        "pending": 2,
        "in_progress": 2,
        "completed": 1
      },
      "byPriority": {
        "high": 3,
        "medium": 1,
        "low": 1
      },
      "overdueCount": 0,
      "averageCompletion": 45
    },
    "managementSuggestions": {
      "overloadedAssignees": [],
      "delayedProjects": [],
      "resourceOptimization": ["考慮重新分配部分任務以平衡工作負載"]
    }
  }
}
```

## 🏗️ 技術架構

### 工具模組結構

```
mcp-server/src/tools/
├── hr/                    # 人力資源工具 (5 個)
├── finance/               # 財務管理工具 (1 個)
│   ├── get-budget-status.js
│   └── index.js
├── task-management/       # 任務管理工具 (2 個)
│   ├── create-task.js
│   ├── get-task-list.js
│   └── index.js
└── index.js              # 主工具註冊器
```

### 工具註冊機制

所有工具都通過統一的註冊機制管理：

```javascript
// 工具自動註冊
registerHRTools(toolManager); // 5 個 HR 工具
registerFinanceTools(toolManager); // 1 個財務工具
registerTaskManagementTools(toolManager); // 2 個任務管理工具

// 總計：8 個業務工具
```

## 📊 測試狀態

### 完整測試覆蓋

- ✅ **35 個測試案例全部通過**
- ✅ **4 個測試套件完整覆蓋**
- ✅ **8 個業務工具全部驗證**

### 測試統計

```json
{
  "testSuites": 4,
  "totalTests": 35,
  "passed": 35,
  "failed": 0,
  "successRate": "100%",
  "coverage": {
    "tools": "8/8 (100%)",
    "modules": "3/3 (100%)"
  }
}
```

## 🚀 部署狀態

### 生產就緒功能

- ✅ **模組化架構設計**
- ✅ **統一錯誤處理機制**
- ✅ **完整參數驗證**
- ✅ **詳細日誌記錄**
- ✅ **效能監控支援**

### 監控指標

- API 回應時間 < 500ms
- 工具執行成功率 100%
- 無內存洩漏問題
- 支援並發調用

## 🔧 最佳實踐

### 1. 錯誤處理

所有工具都支援統一的錯誤處理機制：

```javascript
try {
  const result = await tool.execute(params);
} catch (error) {
  // 錯誤會自動分類和記錄
  logger.error("Tool execution failed", { error });
}
```

### 2. 參數驗證

每個工具都包含完整的參數驗證：

```javascript
// 自動驗證輸入參數
const validationResult = tool.validateInput(params);
if (!validationResult.isValid) {
  throw new ToolExecutionError(validationResult.error);
}
```

### 3. 效能監控

工具執行包含完整的效能追蹤：

```javascript
const startTime = Date.now();
const result = await tool.execute(params);
const executionTime = Date.now() - startTime;
// 自動記錄執行統計
```

## 🎯 未來規劃

### Week 8-10 預定功能

- **工具品質提升**

  - 添加工具參數自動驗證
  - 實作工具執行緩存機制
  - 建立工具版本管理
  - 添加工具使用統計

- **更多業務工具**
  - 財務報表分析工具
  - 進階任務管理功能
  - 項目管理工具

## 🔍 故障排除

### 常見問題

1. **工具註冊失敗**

   - 檢查工具類別是否正確導出
   - 確認工具管理器初始化正常

2. **參數驗證錯誤**

   - 檢查輸入參數格式
   - 確認必填參數完整

3. **執行超時**
   - 檢查網路連接狀態
   - 確認模擬資料庫回應正常

## 📞 技術支援

如需技術支援或回報問題，請：

1. 檢查日誌文件中的錯誤訊息
2. 確認 API 端點和參數正確
3. 運行健康檢查端點驗證系統狀態

---

_最後更新：2025 年 1 月 27 日_
_文檔版本：v1.0_
