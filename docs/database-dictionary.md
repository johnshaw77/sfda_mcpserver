# SFDA Nexus 資料字典

## 概述

此文件記錄了 SFDA Nexus 系統中各個 MCP 工具使用的資料表欄位含義，幫助 AI 更準確地理解和解釋查詢結果。

---

## MIL (Mission in List) 相關欄位

### 主要標識欄位

| 欄位名稱     | 類型    | 說明                     | 範例                                              |
| ------------ | ------- | ------------------------ | ------------------------------------------------- |
| SerialNumber | varchar | MIL 序號，系統唯一識別碼 | G250619001                                        |
| TypeName     | varchar | MIL 類別名稱             | 廠內 Issue, 品質 ISSUE 管理, CEO/COO 追蹤待辦事項 |
| MidTypeName  | varchar | 中層分類                 | -                                                 |

### 狀態與重要度欄位

| 欄位名稱   | 類型    | 說明         | 可能值                                             |
| ---------- | ------- | ------------ | -------------------------------------------------- |
| Status     | varchar | 處理狀態     | OnGoing=進行中, Completed=已完成, Cancelled=已取消 |
| Importance | varchar | 重要度等級   | H=高, M=中, L=低                                   |
| DelayDay   | int     | 延遲天數計算 | 負數=提前完成, 0=準時, 正數=延遲                   |

### 提案者資訊欄位

| 欄位名稱               | 類型    | 說明                |
| ---------------------- | ------- | ------------------- |
| Proposer_EmpNo         | varchar | 提案者員工編號      |
| Proposer_Name          | varchar | 提案者姓名          |
| Proposer_Dept          | varchar | 提案者部門          |
| Proposer_Superior_Dept | varchar | 提案者上級部門      |
| ProposalFactory        | varchar | 提案廠別 (JK/KH/KS) |

### DRI (Directly Responsible Individual) 欄位

| 欄位名稱          | 類型    | 說明               |
| ----------------- | ------- | ------------------ |
| DRI_EmpNo         | varchar | DRI 負責人員工編號 |
| DRI_EmpName       | varchar | DRI 負責人姓名     |
| DRI_Dept          | varchar | DRI 負責部門       |
| DRI_Superior_Dept | varchar | DRI 負責人上級部門 |

### 問題描述與解決方案欄位

| 欄位名稱         | 類型    | 說明         |
| ---------------- | ------- | ------------ |
| IssueDiscription | text    | 問題詳細描述 |
| Location         | varchar | 問題發生地點 |
| Solution         | text    | 解決方案內容 |
| Remark           | text    | 備註說明     |

### 時程管理欄位

| 欄位名稱         | 類型     | 說明                         |
| ---------------- | -------- | ---------------------------- |
| RecordDate       | datetime | 記錄建立日期                 |
| PlanFinishDate   | datetime | 計劃完成日期                 |
| ChangeFinishDate | datetime | 變更後完成日期               |
| ActualFinishDate | datetime | 實際完成日期 (null=尚未完成) |

### 其他欄位

| 欄位名稱 | 類型    | 說明         |
| -------- | ------- | ------------ |
| naqi_num | varchar | NAQI 編號    |
| is_APPLY | bit     | 是否申請標記 |

---

## HR (Human Resources) 員工資訊欄位

### 基本資料欄位

| 欄位名稱    | 類型         | 說明                     | 範例           |
| ----------- | ------------ | ------------------------ | -------------- |
| employee_no | varchar(50)  | 員工編號，系統唯一識別碼 | A116592        |
| name        | varchar(100) | 員工中文姓名             | 張小明         |
| eng_name    | varchar(100) | 員工英文姓名             | John Zhang     |
| sex         | char(1)      | 性別                     | M=男性, F=女性 |
| birthday    | date         | 出生日期                 | 1990-01-15     |
| id_card     | varchar(20)  | 身份證字號               | A123456789     |

### 組織架構欄位

| 欄位名稱   | 類型         | 說明       | 範例                       |
| ---------- | ------------ | ---------- | -------------------------- |
| group_code | varchar(20)  | 部門代碼   | IT, HR, QA, RD             |
| group_name | varchar(100) | 部門名稱   | 資訊部, 人力資源部, 品保部 |
| title_code | varchar(20)  | 職位代碼   | ENG01, MGR02               |
| title_name | varchar(100) | 職位名稱   | 軟體工程師, 部門經理, 主管 |
| user_type  | varchar(20)  | 使用者類型 | -                          |

### 聯絡方式欄位

| 欄位名稱 | 類型         | 說明         |
| -------- | ------------ | ------------ |
| email    | varchar(100) | 公司電子郵件 |
| mobile   | varchar(20)  | 手機號碼     |
| telphone | varchar(20)  | 聯絡電話     |
| ext_num  | varchar(10)  | 分機號碼     |
| address  | varchar(200) | 聯絡地址     |

### 雇用狀態欄位

| 欄位名稱            | 類型 | 說明         | 可能值                   |
| ------------------- | ---- | ------------ | ------------------------ |
| is_suspended        | bit  | 停用狀態     | 0=正常/在職, 1=停用/離職 |
| arrive_date         | date | 到職日期     | -                        |
| leave_date          | date | 離職日期     | null=在職中              |
| last_suspended_date | date | 最後停用日期 | -                        |

### 系統帳號欄位

| 欄位名稱 | 類型        | 說明     |
| -------- | ----------- | -------- |
| domain   | varchar(50) | 網域帳號 |
| account  | varchar(50) | 系統帳號 |
| lang     | varchar(10) | 語言設定 |

### 其他欄位

| 欄位名稱    | 類型        | 說明           |
| ----------- | ----------- | -------------- |
| alias       | varchar(50) | 員工別名或昵稱 |
| remark      | text        | 備註說明       |
| create_date | datetime    | 建檔日期       |
| update_date | datetime    | 最後更新日期   |

---

## 常見業務邏輯說明

### MIL 延遲天數計算

```sql
DelayDay = DATEDIFF(day, PlanFinishDate, GETDATE())
```

- **負數**：提前完成 (實際完成日期早於計劃日期)
- **0**：準時完成
- **正數**：延遲完成 (實際完成日期晚於計劃日期)

### 員工狀態判斷

```sql
-- 在職員工：is_suspended = 0 AND (leave_date IS NULL OR leave_date > GETDATE())
-- 離職員工：is_suspended = 1 OR leave_date <= GETDATE()
```

### 廠別代碼說明

- **JK**：JK 廠區
- **KH**：KH 廠區
- **KS**：KS 廠區

---

## 工具使用建議

### 查詢最佳實踐

1. **MIL 查詢**：優先使用 `get-mil-list` 進行列表查詢，再用 `get-mil-details` 查看詳情
2. **員工查詢**：使用 `search_employees` 模糊搜尋，用 `get_employee` 取得完整資訊
3. **統計分析**：使用專門的統計工具如 `get-status-report`、`get_employee_count`

### 參數使用技巧

- **分頁查詢**：建議 limit 設為 20-50，避免一次取得過多資料
- **欄位選擇**：在 HR 查詢中使用 `includeDetails` 參數控制敏感資訊
- **狀態篩選**：善用 status 參數篩選有效資料

---

_此文件會隨著系統擴展持續更新，請定期檢查最新版本。_
