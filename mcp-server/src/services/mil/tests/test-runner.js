#!/usr/bin/env node

/**
 * MIL Service 測試執行器
 *
 * 使用方式:
 * node test-runner.js [測試名稱]
 *
 * 範例:
 * node test-runner.js getMILList
 * node test-runner.js all
 */

import { testGetMILList } from "./test-cases/get-mil-list.js";
import { testGetMILDetails } from "./test-cases/get-mil-details.js";
import { testGetStatusReport } from "./test-cases/get-status-report.js";
import { testGetMILTypeList } from "./test-cases/get-mil-type-list.js";
import { testGetCountBy } from "./test-cases/get-count-by.js";

// 測試案例註冊表
const testCases = {
  getMILList: testGetMILList,
  getMILDetails: testGetMILDetails,
  getStatusReport: testGetStatusReport,
  getMILTypeList: testGetMILTypeList,
  getCountBy: testGetCountBy,
};

/**
 * 主要測試執行函數
 */
async function runTests() {
  const args = process.argv.slice(2);
  const testName = args[0] || "all";

  console.log("🧪 MIL Service 測試執行器");
  console.log("=".repeat(50));
  console.log(`執行時間: ${new Date().toLocaleString()}`);
  console.log(`測試模式: ${testName}`);
  console.log("=".repeat(50));

  try {
    if (testName === "all") {
      // 執行所有測試
      console.log("🔄 執行所有測試案例...\n");

      for (const [name, testFunction] of Object.entries(testCases)) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`🧪 開始測試: ${name}`);
        console.log(`${"=".repeat(60)}`);

        try {
          await testFunction();
          console.log(`✅ ${name} 測試完成`);
        } catch (error) {
          console.log(`❌ ${name} 測試失敗:`, error.message);
        }

        // 延遲一下，避免資料庫連線過快
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else if (testCases[testName]) {
      // 執行指定測試
      console.log(`🔄 執行測試: ${testName}\n`);
      await testCases[testName]();
      console.log(`\n✅ ${testName} 測試完成`);
    } else {
      // 顯示可用的測試
      console.log("❌ 找不到指定的測試案例");
      console.log("\n可用的測試案例:");
      Object.keys(testCases).forEach(name => {
        console.log(`  - ${name}`);
      });
      console.log("  - all (執行所有測試)");
      process.exit(1);
    }
  } catch (error) {
    console.log("\n❌ 測試執行發生錯誤:");
    console.log("錯誤訊息:", error.message);
    console.log("錯誤堆疊:", error.stack);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎉 測試執行完成!");
  console.log("=".repeat(50));
}

/**
 * 顯示使用說明
 */
function showHelp() {
  console.log(`
MIL Service 測試執行器使用說明

用法:
  node test-runner.js [選項]

選項:
  all                    執行所有測試案例
  getMILList            測試獲取 MIL 列表功能
  getMILDetails         測試獲取 MIL 詳情功能
  getStatusReport       測試獲取狀態報告功能
  getMILTypeList        測試獲取 MIL 類型列表功能
  getCountBy            測試統計功能
  help, -h, --help      顯示此說明

範例:
  node test-runner.js all
  node test-runner.js getMILList
  node test-runner.js getMILDetails

注意:
  - 請確保資料庫連線正常
  - 測試會使用真實的資料庫連線
  - 建議在開發環境中執行測試
`);
}

// 主程式入口
if (
  process.argv.length > 2 &&
  ["help", "-h", "--help"].includes(process.argv[2])
) {
  showHelp();
} else {
  runTests().catch(error => {
    console.error("未預期的錯誤:", error);
    process.exit(1);
  });
}
