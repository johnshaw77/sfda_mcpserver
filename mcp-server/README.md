# MCP Server

企業級 AI + MCP 系統的核心服務器組件，已完成 HR、財務、任務管理工具模組開發，並整合混合日誌系統。

## 🎉 專案狀態

**Week 7-8 任務已完成！**

- ✅ **8 個業務工具全部實作完成** (HR 5個、財務 1個、任務管理 2個)
- ✅ **35 個測試全部通過**
- ✅ **API 功能完全正常**
- ✅ **混合日誌系統完成整合**
- ✅ **系統健康狀態良好**

## 🚀 已實現的業務工具

### HR 工具 (5個)

1. **get_employee_info** - 員工基本資訊查詢
2. **get_employee_list** - 員工名單查詢（支援分頁和篩選）
3. **get_attendance_record** - 出勤記錄查詢
4. **get_salary_info** - 薪資資訊查詢（含敏感資料保護）
5. **get_department_list** - 部門列表查詢

### 財務工具 (1個)

1. **get_budget_status** - 預算狀態查詢

### 任務管理工具 (2個)

1. **create_task** - 創建任務
2. **get_task_list** - 任務列表查詢

## 📊 混合日誌系統

新增的企業級日誌記錄系統：

- ✅ **雙重記錄**：檔案日誌 + SQLite 資料庫
- ✅ **完整追蹤**：工具執行全程記錄 (started → cache_hit/miss → success/error)
- ✅ **API 端點**：實時查詢系統狀態和統計資料
- ✅ **錯誤處理**：驗證錯誤和執行錯誤完整記錄
- ✅ **安全保護**：敏感參數自動清理

### 日誌 API 端點

- `GET /api/logging/status` - 系統日誌狀態
- `GET /api/logging/tools/stats` - 工具使用統計
- `GET /api/logging/metrics/:metric` - 系統性能指標

詳細使用說明請參考：[HR Tools 使用指南](../docs/hr-tools-guide.md)

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

## 🧪 測試 HR 工具

### 快速測試所有工具：

```bash
# 1. 查詢員工資訊
curl -X POST "http://localhost:8080/tools/get_employee_info" \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "A123456"}'

# 2. 查詢員工名單
curl -X POST "http://localhost:8080/tools/get_employee_list" \
  -H "Content-Type: application/json" \
  -d '{"department": "IT", "limit": 5}'

# 3. 查詢出勤記錄
curl -X POST "http://localhost:8080/tools/get_attendance_record" \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "A123456", "startDate": "2024-12-01", "endDate": "2024-12-05"}'

# 4. 查詢薪資資訊
curl -X POST "http://localhost:8080/tools/get_salary_info" \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "A123456", "period": "2024-12"}'
```

## 可用腳本

- `npm start` - 啟動生產服務器
- `npm run dev` - 啟動開發服務器（含熱重載）
- `npm test` - 執行測試（35 個測試）
- `npm run lint` - 程式碼檢查
- `npm run format` - 程式碼格式化

## 📊 API 端點

### 核心端點

- `GET /health` - 健康檢查
- `GET /tools` - 取得可用工具列表
- `GET /` - 服務器資訊

### 業務工具端點

#### HR 工具

- `POST /tools/get_employee_info` - 員工資訊查詢
- `POST /tools/get_employee_list` - 員工名單查詢
- `POST /tools/get_attendance_record` - 出勤記錄查詢
- `POST /tools/get_salary_info` - 薪資資訊查詢
- `POST /tools/get_department_list` - 部門列表查詢

#### 財務工具

- `POST /tools/get_budget_status` - 預算狀態查詢

#### 任務管理工具

- `POST /tools/create_task` - 創建任務
- `POST /tools/get_task_list` - 任務列表查詢

### 日誌監控端點

- `GET /api/logging/status` - 日誌系統狀態
- `GET /api/logging/tools/stats` - 工具使用統計
- `GET /api/logging/metrics/:metric` - 系統性能指標

### 監控端點

- `GET /tools/stats` - 工具統計資訊
- `GET /tools/health` - 工具健康狀態
- `GET /tools/:toolName/stats` - 特定工具統計

## 🔧 環境變數

請參考 `.env.example` 文件了解所有可用的環境變數配置。

## 📈 測試結果

最新測試狀態：

- **Test Suites**: 4 passed, 4 total
- **Tests**: 35 passed, 35 total
- **Success Rate**: 100%
- **All HR Tools**: ✅ Operational
