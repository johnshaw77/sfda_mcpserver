# MCP Server

企業級 AI + MCP 系統的核心服務器組件，專注於 HR 模組與實際資料庫 (org_employee 表) 串接。

## 🎉 專案狀態

**架構重構完成！**

- ✅ **移除所有非 HR 模組**（財務、任務、客訴）
- ✅ **保留 3 個 HR 工具**（查詢員工、搜尋員工、獲取員工總數）
- ✅ **直接與實際資料庫串接**（org_employee 表）
- ✅ **自註冊架構實施完成**
- ✅ **API 路由一致化**

## 🚀 已實現的 HR 工具

### HR 工具 (3個)

1. **get_employee** - 根據員工編號查詢員工詳細資訊
2. **search_employees** - 根據各種條件搜尋員工（支援分頁和篩選）
3. **get_employee_count** - 獲取員工總數統計

## 📊 資料庫欄位映射

`org_employee` 資料表的欄位映射如下：

- **基本資料** (basic)

  - name -> 姓名
  - employee_no -> 工號
  - sex -> 性別
  - birthday -> 生日
  - is_suspended -> 是否停用

- **聯絡方式** (contact)

  - email -> 電子郵件
  - mobile -> 手機
  - telphone -> 公司電話
  - ext_num -> 公司桌機
  - address -> 住址

- **部門資訊** (department)

  - group_name -> 部門名稱
  - group_code -> 部門代碼

- **職位資訊** (position)

  - title_name -> 職位名稱
  - user_type -> 用戶類型

- **雇用資訊** (employment)
  - arrive_date -> 到職日期
  - leave_date -> 離職日期
  - last_suspended_date -> 停用時間
  - domain -> AD Domain
  - account -> AD 帳號
  - lang -> 語系

詳細資訊請參考：[HR 模組遷移文件](../docs/hr-module-migration.md)

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
curl -X POST "http://localhost:8080/api/hr/get_employee" \
  -H "Content-Type: application/json" \
  -d '{"employeeNo": "A123456"}'

# 2. 搜尋員工
curl -X POST "http://localhost:8080/api/hr/search_employees" \
  -H "Content-Type: application/json" \
  -d '{"department": "研發部", "status": "active", "page": 1, "limit": 10}'

# 3. 獲取員工統計
curl -X POST "http://localhost:8080/api/hr/get_employee_count" \
  -H "Content-Type: application/json" \
  -d '{"status": "all"}'
```

## 模組架構

```
/src/tools/hr/
  ├── index.js           # 工具定義和註冊
  ├── routes.js          # HR 路由定義
  ├── get-employee.js    # 員工詳細資訊查詢工具
  ├── search-employees.js # 員工搜尋工具
  └── get-employee-count.js # 員工數量統計工具
```

## 資料安全與隱私

HR 工具處理敏感的員工資訊，因此：

1. 所有查詢都添加了 `name NOT LIKE '%test%'` 條件以排除測試帳號
2. 所有工具設置了 `cacheable: false`，禁止快取敏感資料
3. 日誌中敏感資料會被遮蔽，不會記錄完整的員工資訊

## 版本歷史

- **v1.0.0** - 初始版本，包含 HR、財務、任務和客訴模組
- **v2.0.0** - 架構重構，移除非 HR 模組，專注於 HR 資料庫串接
