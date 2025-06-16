# HR 工具集合

本目錄包含所有與人力資源相關的工具，提供員工查詢、搜尋和統計功能。
2025-06-16

## 可用工具

### 1. 員工資訊查詢 (get_employee)

根據員工編號查詢員工詳細資訊。

**參數：**

| 參數名     | 類型   | 必填 | 說明                                                                                                                                                 |
| ---------- | ------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| employeeNo | string | 是   | 員工編號，對應資料庫中的 employee_no 欄位                                                                                                            |
| fields     | array  | 否   | 指定返回的欄位群組（選填），可包含：basic, contact, department, position, employment。這些群組是對資料表欄位的邏輯分類，不是資料表中的實際欄位名稱。 |

**範例請求：**

```json
{
  "employeeNo": "A116592",
  "fields": ["basic", "contact", "department"]
}
```

**範例回應：**

```json
{
  "employeeNo": "A116592",
  "queryTime": "2023-06-15T08:30:45.123Z",
  "data": {
    "basic": {
      "employeeNo": "A116592",
      "name": "張三",
      "nickName": "Sam",
      "sex": "M",
      "birthday": "1985-03-15",
      "isSuspended": false
    },
    "contact": {
      "email": "sam.zhang@example.com",
      "mobile": "0912345678",
      "telphone": "02-12345678",
      "extNum": "1234",
      "address": "台北市中山區南京東路一段123號"
    },
    "department": {
      "groupName": "研發部",
      "groupCode": "RD001"
    }
  },
  "fields": ["basic", "contact", "department"]
}
```

### 2. 員工搜尋 (search_employees)

根據各種條件搜尋員工。

**參數：**

| 參數名         | 類型    | 必填 | 說明                                                                  |
| -------------- | ------- | ---- | --------------------------------------------------------------------- |
| name           | string  | 否   | 員工姓名，支援模糊查詢                                                |
| department     | string  | 否   | 部門名稱或代碼                                                        |
| titleName      | string  | 否   | 職位名稱                                                              |
| status         | string  | 否   | 員工狀態：active(在職)、inactive(離職/停用)、all(全部)，預設為 active |
| page           | integer | 否   | 頁碼，從1開始，預設為1                                                |
| limit          | integer | 否   | 每頁筆數，預設為20，最大值為50                                        |
| includeDetails | boolean | 否   | 是否包含詳細資訊，預設為 false                                        |

**範例請求：**

```json
{
  "department": "研發部",
  "status": "active",
  "page": 1,
  "limit": 10
}
```

**範例回應：**

```json
{
  "employees": [
    {
      "employeeNo": "A116592",
      "name": "張三",
      "groupName": "研發部",
      "groupCode": "RD001",
      "titleName": "資深工程師",
      "isActive": true
    },
    {
      "employeeNo": "A116593",
      "name": "李四",
      "groupName": "研發部",
      "groupCode": "RD001",
      "titleName": "工程師",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 3. 員工數量查詢 (get_employee_count)

獲取系統中員工總數，可根據員工狀態（在職/離職）進行篩選。

**參數：**

| 參數名 | 類型   | 必填 | 說明                                                               |
| ------ | ------ | ---- | ------------------------------------------------------------------ |
| status | string | 否   | 員工狀態：active(在職)、inactive(離職/停用)、all(全部)，預設為 all |

**範例請求：**

```json
{
  "status": "all"
}
```

**範例回應：**

```json
{
  "queryTime": "2023-06-15T08:30:45.123Z",
  "status": "all",
  "total": 250,
  "activeCount": 200,
  "inactiveCount": 50,
  "maleCount": 150,
  "femaleCount": 100,
  "percentages": {
    "active": 80,
    "inactive": 20,
    "male": 60,
    "female": 40
  }
}
```

**單一狀態查詢（如僅查詢在職員工）：**

```json
{
  "status": "active"
}
```

**範例回應：**

```json
{
  "queryTime": "2023-06-15T08:30:45.123Z",
  "status": "active",
  "total": 200,
  "maleCount": 120,
  "femaleCount": 80
}
```

## 資料模型

### 資料表欄位說明

org_employee 資料表主要欄位說明:

- name -> 姓名
- nickname -> 別名 (英文名)
- group_name -> 部門名稱
- group_code -> 部門代碼
- email -> 電子郵件
- is_suspended -> 是否停用
- last_suspended_date -> 停用時間
- user_type -> 用戶類型
- employee_no -> 工號
- domain -> AD Domain
- account -> AD 帳號
- lang -> 語系
- address -> 住址
- arrive_date -> 到職日期
- leave_date -> 離職日期
- birthday -> 生日
- sex -> 性別 (M:男性，F:女性)
- telphone -> 公司電話
- ext_num -> 公司桌機
- mobile -> 手機
- title_name -> 職位名稱

### 資料邏輯分組說明

API 返回的欄位群組與資料表欄位的對應關係:

- basic: 基本資料群組
  - employeeNo (對應 employee_no)
  - name (對應 name)
  - nickName (對應 nickname)
  - sex (對應 sex)
  - birthday (對應 birthday)
  - isSuspended (對應 is_suspended)
- contact: 聯絡方式群組
  - email (對應 email)
  - mobile (對應 mobile)
  - telphone (對應 telphone)
  - extNum (對應 ext_num)
  - address (對應 address)
- department: 部門資訊群組
  - groupName (對應 group_name)
  - groupCode (對應 group_code)
- position: 職位資訊群組
  - titleName (對應 title_name)
  - userType (對應 user_type)
- employment: 雇用資訊群組
  - arriveDate (對應 arrive_date)
  - leaveDate (對應 leave_date)
  - lastSuspendedDate (對應 last_suspended_date)
  - domain (對應 domain)
  - account (對應 account)
  - lang (對應 lang)

## 資料過濾規則

為確保資料品質和安全，系統會自動套用以下規則：

1. **測試帳號過濾** - 所有名稱中包含 "test" 的員工資料會被自動排除
2. **性別標記** - 系統識別員工性別，M 表示男性，F 表示女性
3. **狀態區分** - 系統會區分在職 (active) 和離職/停用 (inactive) 員工

這些規則會自動套用於所有 HR 工具的查詢中，無需手動指定。
