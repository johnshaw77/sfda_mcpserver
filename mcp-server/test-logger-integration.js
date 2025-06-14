/**
 * 日誌系統整合測試腳本
 *
 * 執行此腳本來測試日誌系統的各種功能
 * 用法: node test-logger-integration.js
 */

import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 動態導入日誌模組
const loggerPath = path.join(__dirname, "src/config/logger.js");
const loggerModule = await import(loggerPath);
const logger = loggerModule.default;

async function testLoggerIntegration() {
  console.log("開始測試日誌系統整合...");

  // 1. 初始化日誌系統
  console.log("1. 測試日誌系統初始化...");
  await logger.init();
  console.log("   ✅ 日誌系統初始化成功");

  // 測試重複初始化
  console.log("   測試重複初始化保護...");
  await logger.init();
  console.log("   ✅ 重複初始化保護機制正常");

  // 2. 測試各種日誌等級
  console.log("\n2. 測試各種日誌等級...");
  await logger.error("這是一個錯誤日誌測試", { source: "test-script" });
  await logger.warn("這是一個警告日誌測試", { source: "test-script" });
  await logger.info("這是一個信息日誌測試", { source: "test-script" });
  await logger.debug("這是一個調試日誌測試", { source: "test-script" });
  await logger.trace("這是一個追踪日誌測試", { source: "test-script" });

  // 測試向後兼容的 verbose 方法
  await logger.verbose("這是使用 verbose 方法的日誌測試", {
    source: "test-script",
  });
  console.log("   ✅ 所有日誌等級測試完成");

  // 3. 測試特殊日誌方法
  console.log("\n3. 測試特殊日誌方法...");
  await logger.toolCall(
    "test-tool",
    { param1: "value1", password: "secret" },
    { result: "success" },
    100,
    "test-client",
  );
  console.log("   ✅ 工具調用日誌測試完成");

  await logger.systemEvent("test-event", { details: "test event details" });
  console.log("   ✅ 系統事件日誌測試完成");

  // 4. 測試日誌等級設定
  console.log("\n4. 測試日誌等級設定...");
  const originalLevel = logger.logLevel;
  logger.setLogLevel("debug");
  console.log(`   日誌等級已從 ${originalLevel} 更改為 ${logger.logLevel}`);
  logger.setLogLevel(originalLevel);
  console.log(`   已還原日誌等級為 ${logger.logLevel}`);
  console.log("   ✅ 日誌等級設定測試完成");

  // 5. 測試日誌統計
  console.log("\n5. 測試日誌統計...");
  const stats = await logger.getStats();
  console.log(
    "   日誌統計信息:",
    JSON.stringify(stats, null, 2).substring(0, 150) + "...",
  );
  console.log("   ✅ 日誌統計測試完成");

  // 等待所有日誌寫入完成
  await waitForLogs();

  // 6. 測試日誌查詢 (如果啟用了資料庫)
  if (logger.useDatabase) {
    console.log("\n6. 測試日誌查詢...");
    try {
      const logs = await logger.queryLogs({ limit: 5 });
      console.log(`   查詢到 ${logs.length} 條日誌記錄`);
      console.log("   ✅ 日誌查詢測試完成");
    } catch (error) {
      console.error("   ❌ 日誌查詢失敗:", error);
    }
  } else {
    console.log("\n6. 跳過日誌查詢測試 (資料庫未啟用)");
  }

  console.log("\n✅ 日誌系統整合測試完成");

  // 關閉日誌系統
  await logger.close();
  console.log("已關閉日誌系統");
}

// 等待所有日誌寫入完成的輔助函數
async function waitForLogs(ms = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 執行測試
testLoggerIntegration().catch(error => {
  console.error("測試過程中發生錯誤:", error);
  process.exit(1);
});
