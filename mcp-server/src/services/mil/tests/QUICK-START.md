# 快速測試使用指南

## 🚀 立即開始

現在您可以用這些簡單的測試腳本來驗證 MIL Service 功能：

### 1. 基本功能測試

```bash
cd /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server
node src/services/mil/tests/simple-test.js
```

**功能**：測試所有 MIL Service 方法
**看到**：服務調用結果、資料筆數、實際資料內容

### 2. SQL 查詢測試

```bash
node src/services/mil/tests/sql-test.js
```

**功能**：直接執行 SQL 查詢
**看到**：實際的 SQL 語句、查詢結果、美化的表格輸出

### 3. 自訂查詢測試

```bash
node src/services/mil/tests/custom-sql-test.js
```

**功能**：讓您自由修改 SQL 查詢
**看到**：自訂查詢的結果

## 📊 從測試結果我們看到

根據剛才的測試結果：

- 📈 **總記錄數**：55,177 筆

  - OnGoing（進行中）：1,095 筆
  - Closed（已結案）：54,082 筆

- 🏆 **最多的類型**：

  1. 兩廠資訊處：18,199 筆
  2. 會議管理：13,855 筆
  3. OQC/IPQC/LAB Issue：6,713 筆

- ⏰ **平均處理時間**：
  - Closed 平均：771 天
  - OnGoing 平均：291 天

## 🔧 如何修改查詢

### 修改狀態篩選

在 `simple-test.js` 中，修改這行：

```javascript
const listResult = await milService.getMILList(
  {},
  1,
  5,
  "RecordDate",
  "Closed",
);
```

### 自訂 SQL 查詢

在 `custom-sql-test.js` 中，找到 `mySQL` 變數並修改：

```javascript
const mySQL = `
  SELECT TOP 10
    SerialNumber,
    TypeName,
    Importance,
    DelayDay
  FROM v_mil_kd 
  WHERE Importance = 'H'  -- 查詢高重要度
    AND DelayDay > 100    -- 延遲超過100天
  ORDER BY DelayDay DESC
`;
```

## 💡 實用技巧

### 1. 查看不同狀態的資料

```bash
# 修改 simple-test.js 中的狀態參數
const listResult = await milService.getMILList({}, 1, 10, "RecordDate", "Closed");
```

### 2. 查看特定類型的統計

```bash
# 修改 custom-sql-test.js 中的查詢
WHERE TypeName = '兩廠資訊處'
```

### 3. 查看延遲超過某天數的記錄

```bash
# 在 SQL 查詢中加入條件
WHERE DelayDay > 365  -- 延遲超過一年
```

## 🎯 測試新功能

當您修改了 `mil-service.js` 後：

1. 儲存檔案
2. 執行測試腳本
3. 立即看到結果

```bash
# 快速驗證
node src/services/mil/tests/simple-test.js
```

這就是最簡單、最直接的測試方式！您可以：

- ✅ 立即看到 SQL 查詢語句
- ✅ 查看實際的查詢結果
- ✅ 快速驗證功能修改
- ✅ 輕鬆調試問題
