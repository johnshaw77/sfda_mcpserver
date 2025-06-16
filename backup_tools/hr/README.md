# 人資 (HR) 工具使用說明

本文檔說明如何使用 HR 相關工具查詢員工資訊、部門結構等資料。

## 工具列表

### 員工資訊查詢 (`get_employee_info`)

通過員工編號查詢員工詳細資訊。

**參數:**

- `employeeId`: 員工編號 (必填)
- `includeDetails`: 是否包含詳細資訊 (選填，預設 true)
- `fields`: 指定返回的欄位類別 (選填，可選: basic, contact, department, position, employment)

**範例:**

```json
{
  "employeeId": "A116592",
  "includeDetails": true,
  "fields": ["basic", "department", "position"]
}
```

**返回資料:**

```json
{
  "employeeId": "A116592",
  "timestamp": "2023-08-01T08:30:15.123Z",
  "data": {
    "basic": {
      "employeeNo": "A116592",
      "name": "張三",
      "nickName": "Zhang San",
      "sex": "M",
      "birthday": "1980-01-01",
      "isSuspended": false
    },
    "department": {
      "groupName": "研發部",
      "groupCode": "RD001"
    },
    "position": {
      "titleName": "資深工程師",
      "userType": "employee"
    }
  },
  "fields": ["basic", "department", "position"]
}
```

### 員工列表查詢 (`get_employee_list`)

查詢符合條件的員工列表。

**參數:**

- `department`: 部門代碼或名稱 (選填)
- `titleName`: 職位名稱 (選填)
- `status`: 員工狀態 (選填，預設 "active")
- `page`: 頁碼 (選填，預設 1)
- `limit`: 每頁筆數 (選填，預設 20)
- `includeDetails`: 是否包含詳細資訊 (選填，預設 false)

**範例:**

```json
{
  "department": "研發部",
  "status": "active",
  "page": 1,
  "limit": 10
}
```

### 員工工號查詢 (`get_employee_id`)

通過姓名或部門資訊查詢員工工號。

**參數:**

- `name`: 員工姓名 (與 department 至少需要提供一項)
- `department`: 部門名稱或代碼 (與 name 至少需要提供一項)
- `limit`: 最多返回幾筆結果 (選填，預設 5)
- `onlyActive`: 是否只查詢在職員工 (選填，預設 true)

**範例:**

```json
{
  "name": "張",
  "department": "研發",
  "limit": 5,
  "onlyActive": true
}
```

**返回資料:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "employeeNo": "A116592",
      "name": "張三",
      "groupName": "研發部",
      "titleName": "資深工程師"
    },
    {
      "employeeNo": "A223344",
      "name": "張小明",
      "groupName": "研發部",
      "titleName": "工程師"
    },
    {
      "employeeNo": "A334455",
      "name": "張大為",
      "groupName": "研發部",
      "titleName": "主管"
    }
  ]
}
```

## 資料表欄位說明

HR 工具使用 `org_employee` 資料表，主要欄位說明：

| 欄位名稱            | 說明        | 對應 API 欄位     |
| ------------------- | ----------- | ----------------- |
| employee_no         | 員工編號    | employeeNo        |
| name                | 姓名        | name              |
| nickname            | 英文名/別名 | nickName          |
| group_name          | 部門名稱    | groupName         |
| group_code          | 部門代碼    | groupCode         |
| title_name          | 職位名稱    | titleName         |
| user_type           | 用戶類型    | userType          |
| is_suspended        | 是否停用    | isSuspended       |
| sex                 | 性別        | sex               |
| birthday            | 生日        | birthday          |
| email               | 電子郵件    | email             |
| telphone            | 公司電話    | telphone          |
| ext_num             | 分機號碼    | extNum            |
| mobile              | 手機號碼    | mobile            |
| address             | 住址        | address           |
| arrive_date         | 到職日期    | arriveDate        |
| leave_date          | 離職日期    | leaveDate         |
| last_suspended_date | 停用日期    | lastSuspendedDate |
| domain              | AD Domain   | domain            |
| account             | AD 帳號     | account           |
| lang                | 語系        | lang              |

## 錯誤處理

工具可能返回以下錯誤：

1. **驗證錯誤** - 當提供的參數不符合要求時
2. **資源不存在** - 當查詢的員工或部門不存在時
3. **API 錯誤** - 當資料庫查詢出現問題時

錯誤範例:

```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "找不到員工資料：員工編號 A999999 不存在於系統中。請確認員工編號是否正確。",
    "details": {
      "employeeId": "A999999",
      "message": "員工不存在",
      "suggestedAction": "請檢查員工編號格式是否正確，或聯絡人資部門確認員工資料"
    }
  }
}
```
