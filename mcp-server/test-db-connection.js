/**
 * 簡單的資料庫連接測試
 */

import mysql from "mysql2/promise";
import config from "./src/config/config.js";

async function testConnection() {
  console.log("🔧 測試資料庫連接...");
  console.log("連接資訊:", {
    host: config.database.qms.host,
    port: config.database.qms.port,
    user: config.database.qms.user,
    database: config.database.qms.database,
  });

  try {
    // 嘗試建立連接
    const connection = await mysql.createConnection({
      host: config.database.qms.host,
      port: config.database.qms.port,
      user: config.database.qms.user,
      password: config.database.qms.password,
      database: config.database.qms.database,
      charset: "utf8mb4",
    });

    console.log("✅ 連接成功！");

    // 測試簡單查詢
    try {
      const [rows] = await connection.execute("SELECT 1 as test");
      console.log("✅ 查詢測試成功！");
    } catch (queryError) {
      console.log("⚠️  連接成功但查詢失敗:", queryError.message);
    }

    // 測試資料表存在性
    try {
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'qms_voc_detail'",
      );
      if (tables.length > 0) {
        console.log("✅ qms_voc_detail 資料表存在");

        // 測試查詢資料表
        const [count] = await connection.execute(
          "SELECT COUNT(*) as total FROM qms_voc_detail",
        );
        console.log(`✅ 資料表查詢成功，共有 ${count[0].total} 筆記錄`);
      } else {
        console.log("❌ qms_voc_detail 資料表不存在");
      }
    } catch (tableError) {
      console.log("❌ 資料表檢查失敗:", tableError.message);
    }

    await connection.end();
  } catch (error) {
    console.log("❌ 連接失敗:", error.message);

    // 提供診斷建議
    if (error.code === "ER_DBACCESS_DENIED_ERROR") {
      console.log("\n💡 診斷建議:");
      console.log("   1. 檢查用戶名和密碼是否正確");
      console.log("   2. 確認用戶是否有存取該資料庫的權限");
      console.log("   3. 檢查資料庫名稱是否正確");
      console.log("   4. 聯絡資料庫管理員確認權限設定");
    } else if (error.code === "ECONNREFUSED") {
      console.log("\n💡 診斷建議:");
      console.log("   1. 檢查資料庫服務是否運行");
      console.log("   2. 確認主機地址和端口是否正確");
      console.log("   3. 檢查防火牆設定");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("\n💡 診斷建議:");
      console.log("   1. 確認資料庫名稱是否正確");
      console.log("   2. 檢查資料庫是否存在");
    }
  }
}

// 執行測試
testConnection().catch(console.error);
