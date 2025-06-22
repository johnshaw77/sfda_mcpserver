# 簡單的 MIL Service 測試指南

## 概述

這裡提供幾個簡單的測試腳本，讓您可以快速測試 MIL Service 的功能和 SQL 查詢。

## 測試腳本

### 1. 基本服務測試 (`simple-test.js`)

測試 MIL Service 的各種方法：

```bash
# 在 mcp-server 目錄下執行
node src/services/mil/tests/simple-test.js
```

這個腳本會：

- 初始化資料庫連線
- 測試 `getMILList()`
- 測試 `getMILDetails()`
- 測試 `getStatusReport()`
- 測試 `getCountBy()`
- 顯示查詢結果

### 2. 直接 SQL 測試 (`sql-test.js`)

直接執行 SQL 查詢並查看結果：

```bash
node src/services/mil/tests/sql-test.js
```

這個腳本會：

- 顯示實際的 SQL 查詢語句
- 執行各種 SQL 查詢
- 使用 `console.table()` 美化輸出
- 測試參數化查詢

### 3. 自訂 SQL 查詢 (`custom-sql-test.js`)

讓您自由修改和測試 SQL 查詢：

```bash
node src/services/mil/tests/custom-sql-test.js
```

這個腳本：

- 提供範例 SQL 查詢
- 您可以直接修改 SQL 語句
- 可以調整查詢參數
- 立即看到結果

## 使用方式

### 快速開始

1. 確保您在 `mcp-server` 目錄下
2. 確保資料庫連線設定正確
3. 執行任一測試腳本

```bash
# 測試服務功能
node src/services/mil/tests/simple-test.js

# 測試 SQL 查詢
node src/services/mil/tests/sql-test.js

# 自訂 SQL 測試
node src/services/mil/tests/custom-sql-test.js
```

### 修改查詢

要測試不同的查詢，只需：

1. 打開 `custom-sql-test.js`
2. 找到 `mySQL` 變數
3. 修改 SQL 查詢語句
4. 調整參數值
5. 執行腳本

範例：

```javascript
// 修改這個 SQL 查詢
const mySQL = `
  SELECT TOP 5
    SerialNumber,
    TypeName,
    Status
  FROM v_mil_kd 
  WHERE Status = 'Closed'  // 改為查詢已結案的記錄
  ORDER BY ActualFinishDate DESC
`;
```

## 常見用途

### 1. 驗證新功能

```bash
# 修改 mil-service.js 後測試
node src/services/mil/tests/simple-test.js
```

### 2. 調試 SQL 查詢

```bash
# 查看 SQL 查詢語句和結果
node src/services/mil/tests/sql-test.js
```

### 3. 測試特定查詢

```bash
# 修改 custom-sql-test.js 中的 SQL
node src/services/mil/tests/custom-sql-test.js
```

## 輸出範例

執行測試後，您會看到類似這樣的輸出：

```
🔧 MIL Service 簡單測試
==================================================
📡 檢查資料庫連線...
✅ 資料庫連線狀態: 已連線

==================================================
📋 測試 getMILList...
調用: milService.getMILList({}, 1, 5)

📊 查詢結果:
- 成功: true
- 記錄數量: 5
- 總記錄數: 150
- 狀態: OnGoing

📝 前3筆資料:
1. MIL000001 - 設備改善 (OnGoing)
2. MIL000002 - 品質改善 (OnGoing)
3. MIL000003 - 效率提升 (OnGoing)
```

## 疑難排解

### 資料庫連線問題

如果出現連線錯誤：

1. 檢查資料庫服務是否啟動
2. 確認連線字串設定
3. 檢查網路連線

### 查詢錯誤

如果 SQL 查詢失敗：

1. 檢查欄位名稱是否正確
2. 確認 SQL 語法
3. 檢查參數設定

### 模組載入錯誤

如果出現 import 錯誤：

1. 確認檔案路徑正確
2. 檢查 Node.js 版本
3. 確認相依性已安裝

## 總結

這些簡單的測試腳本讓您可以：

- ✅ 快速驗證功能
- ✅ 查看 SQL 查詢語句
- ✅ 即時看到查詢結果
- ✅ 輕鬆調試問題
- ✅ 測試不同的查詢條件

非常適合開發過程中的快速驗證和調試！
