# HR 模組遷移文件

2025-06-16

## 概述

本文檔說明了 MCP Server 中 HR 模組的架構遷移情況。作為架構重構的一部分，我們移除了所有與財務(finance)、任務(tasks)和客訴(complaints)相關的模組，專注於提供 HR 模組功能，並確保其直接與實際資料庫(org_employee 表)串接。

## 遷移後的架構

### 自註冊模式

HR 模組採用了新的自註冊架構，工具和路由定義在同一模組目錄下：

```
/src/tools/hr/
  ├── index.js           # 工具定義和註冊
  ├── routes.js          # HR 路由定義
  ├── get-employee.js    # 員工詳細資訊查詢工具
  ├── search-employees.js # 員工搜尋工具
  └── get-employee-count.js # 員工數量統計工具
```

### 資料庫連接

所有 HR 工具直接與 `org_employee` 資料表連接，透過 `employee-service.js` 提供統一的資料存取層：

```
/src/services/hr/
  └── employee-service.js # 員工資料服務，提供與資料庫的交互
```

## 可用的 HR 工具

| 工具名稱             | 描述                         | 主要參數                                    |
| -------------------- | ---------------------------- | ------------------------------------------- |
| `get_employee`       | 根據員工編號查詢員工詳細資訊 | `employeeNo` (員工編號)                     |
| `search_employees`   | 根據各種條件搜尋員工         | `name`, `department`, `titleName`, `status` |
| `get_employee_count` | 獲取系統中員工總數統計       | `status` (員工狀態)                         |

## 資料庫欄位映射

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

## API 端點

HR 模組通過以下 API 端點提供服務：

- **工具調用**: `/api/hr/:toolName`
  例如：`/api/hr/get_employee`

- **工具列表**: `/api/hr/tools`
  返回所有可用的 HR 工具清單

## 使用範例

### 查詢員工資訊

```bash
curl -X POST "http://localhost:3000/api/hr/get_employee" \
     -H "Content-Type: application/json" \
     -d '{"employeeNo": "A123456"}'
```

### 搜尋員工

```bash
curl -X POST "http://localhost:3000/api/hr/search_employees" \
     -H "Content-Type: application/json" \
     -d '{"department": "研發部", "status": "active", "page": 1, "limit": 10}'
```

### 獲取員工數量統計

```bash
curl -X POST "http://localhost:3000/api/hr/get_employee_count" \
     -H "Content-Type: application/json" \
     -d '{"status": "all"}'
```

## 遷移注意事項

1. 舊有的工具名稱已更新：

   - `get_employee_info` → `get_employee`
   - `get_employee_list` → `search_employees`
   - 新增 `get_employee_count` 工具

2. 所有與其他模組（財務、任務、客訴）相關的功能已移除

3. 舊模組路由(`/src/routes/hr-routes.js`)將在未來版本中移除，請使用新的自註冊架構

## 資料安全與隱私

HR 工具處理敏感的員工資訊，因此：

1. 所有查詢都添加了 `name NOT LIKE '%test%'` 條件以排除測試帳號
2. 所有工具設置了 `cacheable: false`，禁止快取敏感資料
3. 日誌中敏感資料會被遮蔽，不會記錄完整的員工資訊
