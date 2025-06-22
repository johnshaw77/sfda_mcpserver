/**
 * 簡單的 MIL Service 測試腳本
 *
 * 使用方式: node simple-test.js
 *
 * 這個腳本會：
 * 1. 初始化資料庫連線
 * 2. 調用 MIL Service 的方法
 * 3. 顯示 SQL 查詢命令和結果
 */

import milService from "../mil-service.js";
import databaseService from "../../database.js";

console.log("🔧 MIL Service 簡單測試");
console.log("=".repeat(50));

async function testMILService() {
  try {
    // 1. 初始化資料庫服務
    console.log("📡 初始化資料庫服務...");
    await databaseService.initialize();
    console.log("✅ 資料庫服務初始化成功");

    // 2. 檢查資料庫連線
    console.log("📡 檢查資料庫連線...");
    const pool = databaseService.getPool("mil");
    console.log(`✅ 資料庫連線狀態: ${pool.connected ? "已連線" : "未連線"}`);

    console.log("\n" + "=".repeat(50));

    // 2. 測試 getMILList
    console.log("📋 測試 getMILList...");
    console.log("調用: milService.getMILList({}, 1, 5)");

    const listResult = await milService.getMILList({}, 1, 5);

    console.log("\n📊 查詢結果:");
    console.log(`- 成功: ${listResult.success}`);
    console.log(`- 記錄數量: ${listResult.count}`);
    console.log(`- 總記錄數: ${listResult.totalRecords}`);
    console.log(`- 狀態: ${listResult.status}`);

    if (listResult.data && listResult.data.length > 0) {
      console.log("\n📝 前3筆資料:");
      listResult.data.slice(0, 3).forEach((item, index) => {
        console.log(
          `${index + 1}. ${item.SerialNumber} - ${item.TypeName} (${item.Status})`,
        );
      });
    }

    console.log("\n" + "=".repeat(50));

    // 3. 測試 getMILDetails (使用第一筆資料的編號)
    if (listResult.data && listResult.data.length > 0) {
      const testSerial = listResult.data[0].SerialNumber;
      console.log(`🔍 測試 getMILDetails...`);
      console.log(`調用: milService.getMILDetails("${testSerial}")`);

      const detailResult = await milService.getMILDetails(testSerial);

      console.log("\n📊 詳情結果:");
      console.log(`- 編號: ${detailResult.data.SerialNumber}`);
      console.log(`- 類型: ${detailResult.data.TypeName}`);
      console.log(`- 狀態: ${detailResult.data.Status}`);
      console.log(`- 提出人: ${detailResult.data.Proposer_Name}`);
      console.log(`- 重要度: ${detailResult.data.Importance}`);
    }

    console.log("\n" + "=".repeat(50));

    // 4. 測試 getStatusReport
    console.log("📈 測試 getStatusReport...");
    console.log("調用: milService.getStatusReport()");

    const statusResult = await milService.getStatusReport();

    console.log("\n📊 狀態統計:");
    statusResult.data.forEach(item => {
      console.log(
        `- ${item.Status}: ${item.Count} 筆 (平均 ${Math.round(item.AvgDays || 0)} 天)`,
      );
    });

    console.log("\n" + "=".repeat(50));

    // 5. 測試 getCountBy
    console.log("📊 測試 getCountBy...");
    console.log("調用: milService.getCountBy('Status')");

    const countResult = await milService.getCountBy("Status");

    console.log("\n📊 狀態計數:");
    countResult.data.forEach(item => {
      console.log(`- ${item.Status}: ${item.totalCount} 筆`);
    });

    console.log("\n" + "=".repeat(50));
    console.log("🎉 測試完成！");
  } catch (error) {
    console.log("❌ 測試發生錯誤:");
    console.log("錯誤訊息:", error.message);
    console.log("錯誤堆疊:", error.stack);
  } finally {
    // 關閉資料庫連線
    try {
      await databaseService.close();
      console.log("📡 資料庫連線已關閉");
    } catch (error) {
      console.log("⚠️ 關閉資料庫連線時發生錯誤:", error.message);
    }
  }
}

// 執行測試
testMILService();
