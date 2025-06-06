# MCP Server

企業級 AI + MCP 系統的核心服務器組件，已完成 HR 工具模組開發。

## 🎉 專案狀態

**Week 3 & Week 4 任務已完成！**

- ✅ **4 個 HR 工具全部實作完成**
- ✅ **35 個測試全部通過**
- ✅ **API 功能完全正常**
- ✅ **系統健康狀態良好**

## 🚀 已實現的 HR 工具

1. **get_employee_info** - 員工基本資訊查詢
2. **get_employee_list** - 員工名單查詢（支援分頁和篩選）
3. **get_attendance_record** - 出勤記錄查詢
4. **get_salary_info** - 薪資資訊查詢（含敏感資料保護）

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

### HR 工具端點

- `POST /tools/get_employee_info` - 員工資訊查詢
- `POST /tools/get_employee_list` - 員工名單查詢
- `POST /tools/get_attendance_record` - 出勤記錄查詢
- `POST /tools/get_salary_info` - 薪資資訊查詢

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
