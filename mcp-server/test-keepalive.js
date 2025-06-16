/**
 * VPN 保持連線定時器測試腳本
 * 測試定時器邏輯和資料庫查詢
 */

import databaseService from "./src/services/database.js";
import logger from "./src/config/logger.js";

// 初始化日誌系統
await logger.init();

// VPN 保持連線定時器
let keepAliveTimer = null;

console.log("🚀 開始測試 VPN 保持連線功能...");

// 初始化資料庫服務
try {
  await databaseService.initialize();
  console.log("✅ 資料庫服務初始化成功");
} catch (error) {
  console.error("❌ 資料庫服務初始化失敗:", error.message);
  process.exit(1);
}

// 設置定時器 (測試用較短間隔：30秒)
console.log("⏰ 設置 VPN 保持連線定時器 (30秒間隔)");
keepAliveTimer = setInterval(async () => {
  try {
    const startTime = Date.now();
    await databaseService.query("qms", "SELECT id FROM flexium_okr LIMIT 1");
    const endTime = Date.now();
    console.log(`✅ VPN keep-alive 查詢成功 - 耗時: ${endTime - startTime}ms`);
  } catch (error) {
    console.warn("⚠️ VPN keep-alive 查詢失敗:", {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}, 30 * 1000); // 30秒測試間隔

// 立即執行一次測試
console.log("🔍 執行初始測試查詢...");
try {
  const startTime = Date.now();
  const result = await databaseService.query(
    "qms",
    "SELECT id FROM flexium_okr LIMIT 1",
  );
  const endTime = Date.now();
  console.log(`✅ 初始查詢成功 - 耗時: ${endTime - startTime}ms`, result);
} catch (error) {
  console.error("❌ 初始查詢失敗:", error.message);
}

// 優雅關閉處理
process.on("SIGINT", async () => {
  console.log("\n🛑 收到停止信號，正在優雅關閉...");

  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    console.log("✅ 定時器已清理");
  }

  try {
    await databaseService.close();
    console.log("✅ 資料庫連接已關閉");
  } catch (error) {
    console.error("❌ 關閉資料庫連接時發生錯誤:", error.message);
  }

  console.log("👋 測試結束");
  process.exit(0);
});

console.log("✨ 測試運行中... 按 Ctrl+C 停止");
