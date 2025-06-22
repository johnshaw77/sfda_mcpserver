# MIL Service 測試範例

這個文件提供一些簡單的範例，展示如何快速測試 MIL Service 的各種功能。

## 快速開始

### 1. 測試單一功能

```bash
# 在 mcp-server 目錄下執行
node src/services/mil/tests/test-runner.js getMILList
```

### 2. 使用執行腳本

```bash
# 給予執行權限（只需要執行一次）
chmod +x src/services/mil/tests/run-tests.sh

# 執行測試
./src/services/mil/tests/run-tests.sh getMILList
```

## 測試範例

### 範例 1: 基本功能測試

```javascript
// 這是一個簡單的測試範例
import milService from "../mil-service.js";

async function testBasicFunction() {
  try {
    console.log("開始測試 getMILList...");

    const result = await milService.getMILList();

    console.log("測試結果:");
    console.log(`- 查詢成功: ${result.success}`);
    console.log(`- 記錄數量: ${result.count}`);
    console.log(`- 總記錄數: ${result.totalRecords}`);

    if (result.data && result.data.length > 0) {
      console.log("前3筆資料:");
      result.data.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.SerialNumber} - ${item.TypeName}`);
      });
    }

    console.log("✅ 測試通過");
  } catch (error) {
    console.log("❌ 測試失敗:", error.message);
  }
}

// 執行測試
testBasicFunction();
```

### 範例 2: 參數測試

```javascript
import milService from "../mil-service.js";

async function testWithParameters() {
  try {
    console.log("測試帶參數的查詢...");

    // 測試不同的狀態
    const ongoingResult = await milService.getMILList(
      {},
      1,
      5,
      "RecordDate",
      "OnGoing",
    );
    console.log(`OnGoing 狀態記錄: ${ongoingResult.count} 筆`);

    const closedResult = await milService.getMILList(
      {},
      1,
      5,
      "RecordDate",
      "Closed",
    );
    console.log(`Closed 狀態記錄: ${closedResult.count} 筆`);

    // 測試複合篩選
    const filters = { importance: "高" };
    const filteredResult = await milService.getMILList(filters, 1, 5);
    console.log(`高重要度記錄: ${filteredResult.count} 筆`);

    console.log("✅ 參數測試通過");
  } catch (error) {
    console.log("❌ 參數測試失敗:", error.message);
  }
}

// 執行測試
testWithParameters();
```

### 範例 3: 錯誤處理測試

```javascript
import milService from "../mil-service.js";

async function testErrorHandling() {
  try {
    console.log("測試錯誤處理...");

    // 測試無效的編號
    try {
      await milService.getMILDetails("INVALID_ID");
      console.log("⚠️ 應該要拋出錯誤，但沒有");
    } catch (error) {
      console.log("✅ 正確處理無效編號:", error.message);
    }

    // 測試無效的欄位名稱
    try {
      await milService.getCountBy("INVALID_COLUMN");
      console.log("⚠️ 應該要拋出錯誤，但沒有");
    } catch (error) {
      console.log("✅ 正確處理無效欄位:", error.message);
    }

    console.log("✅ 錯誤處理測試通過");
  } catch (error) {
    console.log("❌ 錯誤處理測試失敗:", error.message);
  }
}

// 執行測試
testErrorHandling();
```

## 自訂測試

### 建立自己的測試檔案

1. 在 `tests/test-cases/` 目錄下建立新檔案
2. 使用以下模板：

```javascript
// my-custom-test.js
import milService from "../../mil-service.js";

export async function testMyCustomFunction() {
  console.log("\n🧪 我的自訂測試");

  try {
    // 你的測試邏輯
    const result = await milService.someMethod();

    console.log("測試結果:", result);
    console.log("✅ 測試通過");
  } catch (error) {
    console.log("❌ 測試失敗:", error.message);
  }
}
```

3. 在 `test-runner.js` 中註冊你的測試：

```javascript
import { testMyCustomFunction } from "./test-cases/my-custom-test.js";

const testCases = {
  // ...existing tests...
  myCustomTest: testMyCustomFunction,
};
```

### 輔助工具使用

```javascript
import {
  performanceTest,
  validateDataStructure,
} from "../utils/test-helper.js";

// 效能測試
const stats = await performanceTest(
  () => milService.getMILList(),
  5,
  "getMILList",
);

// 資料結構驗證
const schema = {
  required: ["timestamp", "data"],
  fields: {
    timestamp: "string",
    data: "array",
  },
};

const validation = validateDataStructure(result, schema);
if (!validation.isValid) {
  console.log("驗證失敗:", validation.errors);
}
```

## 常見問題

### Q: 如何只測試特定功能？

A: 使用測試名稱作為參數：

```bash
node src/services/mil/tests/test-runner.js getMILList
```

### Q: 如何查看詳細的錯誤資訊？

A: 測試會自動顯示錯誤訊息和堆疊資訊，如需更多資訊可以修改測試檔案加入更多 console.log。

### Q: 如何測試資料庫連線？

A: 測試會自動嘗試連接資料庫，如果連線失敗會顯示錯誤訊息。

### Q: 如何測試新增的功能？

A: 參考現有的測試案例，建立新的測試檔案並註冊到 test-runner.js 中。

## 測試最佳實踐

1. **先測試基本功能** - 確保基本的查詢能正常工作
2. **測試邊界條件** - 空參數、極大值、極小值
3. **測試錯誤處理** - 無效輸入、資料庫錯誤
4. **檢查回傳格式** - 確保資料結構符合預期
5. **效能測試** - 確保查詢時間在可接受範圍內

## 除錯技巧

```javascript
// 1. 詳細日誌
console.log("輸入參數:", JSON.stringify(params, null, 2));
console.log("查詢結果:", JSON.stringify(result, null, 2));

// 2. 逐步驗證
console.log("步驟 1: 檢查參數");
console.log("步驟 2: 執行查詢");
console.log("步驟 3: 處理結果");

// 3. 性能監控
const startTime = Date.now();
const result = await milService.someMethod();
console.log(`執行時間: ${Date.now() - startTime}ms`);
```

記住：測試的目的是確保程式碼的正確性和穩定性，不要害怕測試失敗，失敗往往能幫助我們發現問題！
