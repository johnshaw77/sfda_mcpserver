# MIL Service 開發測試指南

## 概述

這個指南教導如何以最單純的方式測試 MIL Service 的各種功能，適合開發過程中快速驗證服務邏輯。

## 目錄結構

```
services/mil/tests/
├── README.md           # 本開發指南
├── test-runner.js      # 主要測試執行器
├── test-cases/         # 測試案例目錄
│   ├── get-mil-list.js
│   ├── get-mil-details.js
│   └── get-status-report.js
└── utils/
    ├── test-helper.js  # 測試輔助工具
    └── mock-data.js    # 模擬資料
```

## 快速開始

### 1. 執行單一測試

```bash
# 在 mcp-server 目錄下執行
node src/services/mil/tests/test-runner.js getMILList
```

### 2. 執行所有測試

```bash
node src/services/mil/tests/test-runner.js all
```

### 3. 執行特定測試案例

```bash
node src/services/mil/tests/test-runner.js getMILDetails
node src/services/mil/tests/test-runner.js getStatusReport
```

## 測試方法說明

### 基本測試模式

我們使用最簡單的 Node.js 原生方式進行測試，不依賴任何測試框架：

1. **直接函數調用** - 直接調用 service 的方法
2. **console.log 輸出** - 使用 console.log 查看結果
3. **try/catch 錯誤處理** - 簡單的錯誤捕獲和顯示
4. **手動驗證** - 開發者手動檢查輸出結果

### 測試案例結構

每個測試案例都包含：

- 測試描述
- 輸入參數
- 預期結果說明
- 實際執行
- 結果展示

## 如何新增測試案例

### 1. 創建新的測試文件

在 `test-cases/` 目錄下創建新文件：

```javascript
// test-cases/your-new-test.js
import milService from "../mil-service.js";

export async function testYourNewFunction() {
  console.log("\n=== 測試: YourNewFunction ===");

  try {
    // 設定測試參數
    const testParams = {
      // 你的參數
    };

    console.log("輸入參數:", testParams);

    // 執行測試
    const result = await milService.yourNewFunction(testParams);

    console.log("測試結果:");
    console.log(JSON.stringify(result, null, 2));

    // 簡單驗證
    if (result && result.success) {
      console.log("✅ 測試通過");
    } else {
      console.log("❌ 測試失敗");
    }
  } catch (error) {
    console.log("❌ 測試發生錯誤:");
    console.log("錯誤訊息:", error.message);
    console.log("錯誤堆疊:", error.stack);
  }
}
```

### 2. 在測試執行器中註冊

編輯 `test-runner.js`，新增你的測試：

```javascript
import { testYourNewFunction } from "./test-cases/your-new-test.js";

// 在 testCases 物件中新增
const testCases = {
  // ...existing tests...
  yourNewFunction: testYourNewFunction,
};
```

## 常見測試場景

### 1. 測試正常情況

```javascript
// 測試基本功能是否正常工作
const result = await milService.getMILList();
console.log("正常情況結果:", result);
```

### 2. 測試邊界條件

```javascript
// 測試空參數
const emptyResult = await milService.getMILList({});

// 測試極大/極小值
const largePageResult = await milService.getMILList({}, 999, 1000);
```

### 3. 測試錯誤處理

```javascript
// 測試不存在的資料
try {
  const result = await milService.getMILDetails("NOT_EXIST");
} catch (error) {
  console.log("預期的錯誤:", error.message);
}
```

### 4. 測試參數組合

```javascript
// 測試多種篩選條件組合
const complexFilters = {
  status: "OnGoing",
  typeName: "設備",
  importance: "高",
};
const result = await milService.getMILList(complexFilters);
```

## 除錯技巧

### 1. 詳細日誌

```javascript
console.log("=== 除錯資訊 ===");
console.log("輸入參數:", JSON.stringify(params, null, 2));
console.log("SQL 查詢:", sqlQuery);
console.log("資料庫回應:", JSON.stringify(dbResult, null, 2));
```

### 2. 分步驟驗證

```javascript
// 步驟 1: 檢查參數
console.log("步驟 1: 參數檢查", params);

// 步驟 2: 檢查資料庫連線
console.log("步驟 2: 資料庫狀態", dbPool.connected);

// 步驟 3: 檢查查詢結果
console.log("步驟 3: 查詢結果", result.recordset.length);
```

### 3. 性能測試

```javascript
const startTime = Date.now();
const result = await milService.getMILList(filters);
const endTime = Date.now();
console.log(`執行時間: ${endTime - startTime}ms`);
```

## 最佳實踐

### 1. 測試資料準備

- 使用真實但匿名化的測試資料
- 準備各種邊界條件的測試資料
- 確保測試資料不會影響生產環境

### 2. 測試輸出格式化

```javascript
// 使用表格格式展示結果
console.table(result.data.slice(0, 5)); // 只顯示前 5 筆

// 使用 JSON 格式展示詳細資料
console.log(JSON.stringify(result, null, 2));
```

### 3. 測試文件命名

- 使用描述性的檔案名稱
- 依功能分組組織測試檔案
- 保持檔案結構清晰

### 4. 錯誤處理

```javascript
try {
  const result = await service.method();
  // 驗證結果
} catch (error) {
  console.log("錯誤類型:", error.constructor.name);
  console.log("錯誤訊息:", error.message);
  if (error.originalError) {
    console.log("原始錯誤:", error.originalError);
  }
}
```

## 環境設定

### 1. 資料庫連線

確保測試環境可以連接到測試資料庫：

```javascript
// 在測試開始前檢查資料庫連線
import databaseService from "../../database.js";

async function checkDatabase() {
  try {
    const pool = databaseService.getPool("mil");
    console.log("資料庫連線狀態:", pool.connected ? "已連線" : "未連線");
  } catch (error) {
    console.log("資料庫連線錯誤:", error.message);
  }
}
```

### 2. 環境變數

```bash
# 設定測試環境變數
export NODE_ENV=development
export DB_HOST=localhost
export DB_NAME=test_mil_db
```

## 疑難排解

### 常見問題

1. **資料庫連線失敗**

   - 檢查資料庫服務是否啟動
   - 確認連線字串正確
   - 檢查網路連線

2. **模組載入錯誤**

   - 確認檔案路徑正確
   - 檢查 import/export 語法
   - 驗證相依性是否已安裝

3. **參數錯誤**
   - 檢查參數類型和格式
   - 確認必要參數是否提供
   - 驗證參數值的有效性

### 除錯工具

```javascript
// 開啟詳細除錯模式
process.env.DEBUG = "mil-service:*";

// 使用 Node.js 內建的 util.inspect
import util from "util";
console.log(util.inspect(complexObject, { depth: null, colors: true }));
```

## 總結

這個簡單的測試方法讓您可以：

1. **快速驗證** - 無需複雜設定即可測試功能
2. **即時回饋** - 立即看到執行結果和錯誤
3. **靈活調整** - 可以隨時修改測試參數和邏輯
4. **易於理解** - 使用最基本的 JavaScript 語法
5. **除錯友善** - 詳細的日誌輸出協助問題定位

適合在開發過程中頻繁使用，確保每個功能都能正確運作。
