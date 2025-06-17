/**
 * MIL 資料庫連接與服務測試腳本
 *
 * 測試 MIL 資料庫連接和 MIL 服務功能
 */

import sql from "mssql";
import config from "../config/config.js";
import databaseService from "../services/database.js";
import milService from "../services/mil/mil-service.js";

async function testMILDatabaseConnection() {
  console.log("🔧 測試 MIL 資料庫連接...");
  console.log("連接資訊:", {
    host: config.dbConfig.mil.host,
    port: config.dbConfig.mil.port,
    user: config.dbConfig.mil.user,
    database: config.dbConfig.mil.database,
  });

  try {
    // 嘗試建立直接連接
    const pool = new sql.ConnectionPool({
      server: config.dbConfig.mil.host,
      user: config.dbConfig.mil.user,
      password: config.dbConfig.mil.password,
      database: config.dbConfig.mil.database,
      port: config.dbConfig.mil.port,
      options: config.dbConfig.mil.options,
    });

    await pool.connect();
    console.log("✅ 直接連接成功！");

    // 測試簡單查詢
    try {
      const result = await pool.request().query("SELECT 1 as test");
      console.log("✅ 查詢測試成功！");
    } catch (queryError) {
      console.log("⚠️  連接成功但查詢失敗:", queryError.message);
    }

    // 測試 v_mil_kd 視圖存在性
    try {
      const result = await pool.request().query("SELECT TOP 1 * FROM v_mil_kd");
      if (result.recordset && result.recordset.length > 0) {
        console.log("✅ v_mil_kd 視圖存在並可查詢");
        console.log(
          "樣本記錄:",
          JSON.stringify(result.recordset[0], null, 2).substring(0, 200) +
            "...",
        );
      } else {
        console.log("⚠️  v_mil_kd 視圖存在但無數據");
      }
    } catch (tableError) {
      console.log("❌ v_mil_kd 視圖檢查失敗:", tableError.message);
    }

    await pool.close();
    console.log("👍 直接連接測試完成並已關閉\n");
  } catch (error) {
    console.log("❌ 直接連接失敗:", error.message);

    // 提供診斷建議
    if (error.message.includes("Login failed")) {
      console.log("\n💡 診斷建議:");
      console.log("   1. 檢查用戶名和密碼是否正確");
      console.log("   2. 確認用戶是否有存取該資料庫的權限");
    } else if (
      error.message.includes("connect ETIMEDOUT") ||
      error.message.includes("Failed to connect")
    ) {
      console.log("\n💡 診斷建議:");
      console.log("   1. 檢查資料庫服務是否運行");
      console.log("   2. 確認主機地址和端口是否正確");
      console.log("   3. 檢查網路連接和防火牆設定");
    } else if (
      error.message.includes("database") &&
      error.message.includes("not exist")
    ) {
      console.log("\n💡 診斷建議:");
      console.log("   1. 確認資料庫名稱是否正確");
      console.log("   2. 檢查資料庫是否存在");
    }
  }
}

async function testDatabaseService() {
  console.log("🔧 測試 DatabaseService...");

  try {
    // 初始化資料庫服務
    await databaseService.initialize();
    console.log("✅ 資料庫服務初始化成功");

    // 測試 MIL 連接池
    try {
      const pool = databaseService.getPool("mil");
      console.log("✅ 取得 MIL 連接池成功");

      // 測試查詢
      const sql = "SELECT TOP 10 * FROM v_mil_kd";
      const result = await databaseService.query("mil", sql);

      console.log(`✅ 查詢成功！取得 ${result.length} 筆記錄`);

      if (result.length > 0) {
        console.log("📝 MIL 記錄範例 (第一筆):");
        const sample = result[0];
        console.log(`   SerialNumber: ${sample.SerialNumber || "N/A"}`);
        console.log(`   Status: ${sample.Status || "N/A"}`);
        console.log(`   Proposer_Name: ${sample.Proposer_Name || "N/A"}`);
        console.log(
          `   RecordDate: ${sample.RecordDate ? new Date(sample.RecordDate).toLocaleString() : "N/A"}`,
        );
        console.log("");
      }
    } catch (error) {
      console.log("❌ DatabaseService MIL 測試失敗:", error.message);
    }
  } catch (error) {
    console.log("❌ DatabaseService 初始化失敗:", error.message);
  } finally {
    await databaseService.close();
    console.log("🔒 資料庫連接已關閉\n");
  }
}

async function testMILService() {
  console.log("🔧 測試 MIL 服務...");

  try {
    // 初始化資料庫服務
    await databaseService.initialize();
    console.log("✅ 資料庫服務初始化成功");

    // 測試 getMILList
    try {
      console.log("📋 測試 getMILList...");
      const result = await milService.getMILList({}, 10);
      console.log(`✅ getMILList 成功！取得 ${result.count} 筆記錄`);

      // 顯示記錄樣本
      if (result.milList && result.milList.length > 0) {
        console.log("📝 MIL 列表範例 (前 3 筆):");
        for (let i = 0; i < Math.min(3, result.milList.length); i++) {
          const item = result.milList[i];
          console.log(
            `${i + 1}. ${item.SerialNumber || "N/A"} - ${item.Proposer_Name || "N/A"}`,
          );
          console.log(`   狀態: ${item.Status || "N/A"}`);
          console.log(
            `   記錄日期: ${item.RecordDate ? new Date(item.RecordDate).toLocaleString() : "N/A"}`,
          );
          console.log("");
        }

        // 保存第一個記錄的 SerialNumber 用於下一個測試
        const firstSerialNumber = result.milList[0].SerialNumber;

        // 測試 getMILDetails
        if (firstSerialNumber) {
          console.log(`📋 測試 getMILDetails (${firstSerialNumber})...`);
          try {
            const detailsResult =
              await milService.getMILDetails(firstSerialNumber);
            console.log("✅ getMILDetails 成功！");
            console.log("📝 MIL 詳情摘要:");
            const details = detailsResult.details;
            console.log(`   SerialNumber: ${details.SerialNumber || "N/A"}`);
            console.log(`   Status: ${details.Status || "N/A"}`);
            console.log(`   Proposer_Name: ${details.Proposer_Name || "N/A"}`);
            console.log(
              `   RecordDate: ${details.RecordDate ? new Date(details.RecordDate).toLocaleString() : "N/A"}`,
            );
            console.log("");
          } catch (error) {
            console.log("❌ getMILDetails 失敗:", error.message);
          }
        }
      }

      // 測試 getStatusReport
      console.log("📋 測試 getStatusReport...");
      try {
        const reportResult = await milService.getStatusReport();
        console.log("✅ getStatusReport 成功！");

        if (reportResult.statusReport && reportResult.statusReport.length > 0) {
          console.log("📝 狀態報告摘要:");
          reportResult.statusReport.forEach((status, index) => {
            console.log(`   ${index + 1}. 狀態: ${status.Status || "N/A"}`);
            console.log(`      數量: ${status.Count || "0"}`);
            console.log(
              `      平均天數: ${status.AvgDays ? status.AvgDays.toFixed(1) : "N/A"}`,
            );
            console.log("");
          });
        } else {
          console.log("⚠️  狀態報告無數據");
        }
      } catch (error) {
        console.log("❌ getStatusReport 失敗:", error.message);
      }
    } catch (error) {
      console.log("❌ getMILList 失敗:", error.message);
    }
  } catch (error) {
    console.log("❌ MIL 服務測試初始化失敗:", error.message);
  } finally {
    await databaseService.close();
    console.log("🔒 資料庫連接已關閉");
  }
}

async function runTests() {
  console.log("🔍 開始 MIL 連接與服務測試...\n");

  try {
    // 測試直接資料庫連接
    await testMILDatabaseConnection();

    // 測試資料庫服務
    await testDatabaseService();

    // 測試 MIL 服務
    await testMILService();

    console.log("\n🎉 MIL 測試完成！");
  } catch (error) {
    console.error("\n❌ 測試過程中發生未捕獲錯誤:", error);
  }
}

// 執行測試
runTests().catch(console.error);
