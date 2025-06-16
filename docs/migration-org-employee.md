# org_employee 表遷移記錄

## 遷移概述

本文件記錄 `org_employee` 表從模擬資料到實際資料庫的遷移過程，包括關鍵決策、遇到的問題及解決方案。

## 表結構

```
資料表名稱：org_employee
主鍵：employee_no
資料庫：qmslocal
欄位列表：
- employee_no：VARCHAR(50)，員工編號
- name：VARCHAR(100)，姓名
- nickname：VARCHAR(100)，別名（英文名）
- group_name：VARCHAR(100)，部門名稱
- group_code：VARCHAR(50)，部門代碼
- email：VARCHAR(100)，電子郵件
- is_suspended：BOOLEAN，是否停用
- last_suspended_date：DATETIME，停用時間
- user_type：VARCHAR(50)，用戶類型
- domain：VARCHAR(50)，AD Domain
- account：VARCHAR(100)，AD 帳號
- lang：VARCHAR(20)，語系
- address：VARCHAR(200)，住址
- arrive_date：DATE，到職日期
- leave_date：DATE，離職日期
- birthday：DATE，生日
- sex：VARCHAR(10)，性別
- telphone：VARCHAR(50)，公司電話
- ext_num：VARCHAR(20)，公司桌機
- mobile：VARCHAR(50)，手機
- title_name：VARCHAR(100)，職位名稱
```

## 欄位映射關係

| 舊欄位名稱（模擬資料） | 新欄位名稱（資料庫）  | 說明           |
| ---------------------- | --------------------- | -------------- |
| employeeId             | employeeNo            | 員工編號       |
| jobTitle               | titleName             | 職位名稱       |
| department             | group_name/group_code | 部門名稱或代碼 |
| isActive               | is_suspended (反向)   | 員工狀態       |
| phone                  | telphone              | 公司電話       |
| extension              | ext_num               | 分機號碼       |

## 遷移步驟記錄

### 1. 服務層實現

- [x] 建立 `/services/hr/employee-service.js`
- [x] 實現 `getEmployeeById` 方法
- [x] 實現 `getEmployeeList` 方法
- [x] 實現 `findEmployeesByNameOrDepartment` 方法
- [x] 加入欄位映射和格式化邏輯
- [x] 完成錯誤處理和日誌記錄

### 2. 工具層修改

- [x] 修改 `get-employee-info.js`

  - [x] 參數名稱從 `employeeId` 改為 `employeeNo`
  - [x] 更新參數描述
  - [x] 修改實現邏輯，使用服務層方法
  - [x] 更新驗證邏輯

- [x] 修改 `get-employee-list.js`

  - [x] 參數名稱從 `jobTitle` 改為 `titleName`
  - [x] 更新參數描述
  - [x] 修改實現邏輯，使用服務層方法

- [x] 修改 `get-employee-id.js`

  - [x] 確保參數名稱與資料庫一致
  - [x] 更新參數描述
  - [x] 修改實現邏輯，使用服務層方法

- [x] 修改 `get-attendance-record.js`

  - [x] 參數名稱從 `employeeId` 改為 `employeeNo`
  - [x] 更新參數描述
  - [x] 修改相關方法名稱

- [x] 修改 `get-salary-info.js`
  - [x] 參數名稱從 `employeeId` 改為 `employeeNo`
  - [x] 更新參數描述
  - [x] 修改相關方法名稱

### 3. 支援服務修改

- [x] 建立相容性導入 `/services/employee-service.js`
- [ ] 更新資料庫連接服務（如需要）
- [ ] 修改日誌處理邏輯（如需要）

### 4. 測試情況

- [ ] 單元測試服務層
- [ ] 整合測試工具層
- [ ] 針對邊界情況的測試
- [ ] 性能測試（如需要）

## 遇到的問題與解決方案

### 1. 欄位命名差異

**問題**：模擬資料使用 `employeeId`，而資料庫使用 `employee_no`。

**解決方案**：統一使用 `employeeNo` 作為 JavaScript 變數名稱，保持與資料庫欄位含義一致。在服務層完成映射轉換。

### 2. 參數不一致

**問題**：不同工具使用不同的參數名稱指代相同概念（如 `jobTitle` vs `titleName`）。

**解決方案**：統一使用 `titleName` 以保持與資料庫欄位含義一致。在服務層添加支援，同時接受兩種參數名稱，確保向後相容。

### 3. 模擬資料與實際資料結構差異

**問題**：模擬資料可能包含實際資料庫中不存在的欄位或結構。

**解決方案**：以資料庫結構為準，調整返回的資料結構。在需要的情況下，可以在服務層進行資料轉換，確保輸出格式一致。

## 下一步計劃

- [ ] 完成所有 HR 相關工具的遷移
- [ ] 建立完整的單元測試套件
- [ ] 更新 API 文檔
- [ ] 規劃下一個要遷移的表

## 參考資料

- [系統架構文檔](../docs/architecture.md)
- [API 規範](../docs/api-spec.md)
- [資料庫結構文檔](../docs/database-schema.md)

## 遷移負責人

- 主導：[您的名字]
- 審核：[審核人員]
- 測試：[測試人員]

## 更新歷史

| 日期       | 版本 | 更新內容                   | 更新人     |
| ---------- | ---- | -------------------------- | ---------- |
| 2025-06-15 | 0.1  | 初始文件建立               | [您的名字] |
| 2025-06-15 | 0.2  | 完成服務層和工具層修改記錄 | [您的名字] |
