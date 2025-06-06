**`mcp-tools.md`** 通常是用來記錄「MCP Server 目前有哪些工具（tools）、每個工具的用途、參數、回傳格式」的文件。這份文件是給**AI 主系統的 Prompt 設計者、工具開發者、產品經理**等人看的，讓大家知道 MCP Server 目前可以做哪些事，以及如何用這些工具。

---

# `mcp-tools.md` 內容範例

````markdown
# MCP Server 工具總覽（mcp-tools.md）

本文件列出 MCP Server 目前支援的所有工具（tools），包含工具名稱、用途、參數說明、回傳格式範例等。

---

## 1. get_employee_info

- **用途**：查詢員工基本資訊
- **參數**：
  | 參數名稱 | 型態 | 必填 | 說明 |
  |-------------|--------|------|--------------|
  | employeeId | string | 是 | 員工編號 |
- **回傳格式**：
  ```json
  {
    "employeeId": "A123456",
    "name": "王小明",
    "department": "人資部",
    "title": "專員"
  }
  ```

---

## 2. get_department_list

- **用途**：取得所有部門清單
- **參數**：無
- **回傳格式**：
  ```json
  [
    { "departmentId": "D01", "name": "人資部" },
    { "departmentId": "D02", "name": "財務部" }
  ]
  ```

---

## 3. get_budget_status

- **用途**：查詢部門年度預算執行狀況
- **參數**：
  | 參數名稱 | 型態 | 必填 | 說明 |
  |-------------|--------|------|----------|
  | department | string | 是 | 部門名稱 |
  | year | number | 是 | 年度 |
- **回傳格式**：
  ```json
  {
    "department": "財務部",
    "year": 2024,
    "budget": 1000000,
    "used": 600000,
    "remaining": 400000
  }
  ```

---

## 4. submit_leave_request

- **用途**：員工請假申請
- **參數**：
  | 參數名稱 | 型態 | 必填 | 說明 |
  |-------------|--------|------|--------------|
  | employeeId | string | 是 | 員工編號 |
  | startDate | string | 是 | 請假開始日期 (YYYY-MM-DD) |
  | endDate | string | 是 | 請假結束日期 (YYYY-MM-DD) |
  | reason | string | 否 | 請假原因 |
- **回傳格式**：
  ```json
  {
    "success": true,
    "requestId": "LR20240606001"
  }
  ```

---

## 5. get_leave_status

- **用途**：查詢請假申請進度
- **參數**：
  | 參數名稱 | 型態 | 必填 | 說明 |
  |-------------|--------|------|--------------|
  | requestId | string | 是 | 請假申請單號 |
- **回傳格式**：
  ```json
  {
    "requestId": "LR20240606001",
    "status": "審核中",
    "approver": "張經理"
  }
  ```

---

# 備註

- 所有工具皆透過 `/tools/{toolName}` 呼叫，參數以 JSON 傳遞。
- 回傳格式若有 `success: false` 則會帶有 `error` 欄位，詳見 api-spec.md。

---

# 版本資訊

- 最後更新：2024-06-06
````

---

## 小結

- `mcp-tools.md` 是**MCP Server 支援工具的白皮書**，讓 Prompt 工程師、產品經理、開發者都能一目了然目前有哪些工具可用、怎麼用、會回什麼資料。
- 通常會和 `api-spec.md` 一起維護，但 `mcp-tools.md` 會更聚焦在「工具的功能、參數、回傳」而非 API 的細節。
