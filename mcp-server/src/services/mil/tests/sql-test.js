/**
 * !!主要用這支來方便測試 MIL 2025-06-22
 * 直接 SQL 測試腳本
 *
 * 使用方式: node sql-test.js
 *
 * 這個腳本會：
 * 1. 直接執行 SQL 查詢
 * 2. 顯示 SQL 命令
 * 3. 顯示查詢結果
 */

import databaseService from "../../database.js";

console.log("🔧 直接 SQL 測試");
console.log("=".repeat(50));

async function runSQLTest() {
  try {
    // 初始化資料庫服務
    console.log("📡 初始化資料庫服務...");
    await databaseService.initialize();
    console.log("✅ 資料庫服務初始化成功");

    // 獲取資料庫連線
    console.log("📡 獲取資料庫連線...");
    const pool = databaseService.getPool("mil");
    console.log("✅ 資料庫連線成功");

    // 測試 1: 基本查詢
    console.log("\n" + "=".repeat(50));
    console.log("📋 測試 1: 基本 MIL 列表查詢");

    const sql1 = `
      SELECT TOP 5
        SerialNumber, TypeName, Status, Importance, 
        DelayDay, ProposalFactory, Proposer_Name, RecordDate
      FROM v_mil_kd 
      WHERE Status = 'OnGoing'
      and DelayDay > 10
      ORDER BY RecordDate DESC
    `;

    console.log("🔍 執行 SQL:");
    console.log(sql1);

    const result1 = await pool.request().query(sql1);

    console.log(`\n📊 查詢結果: ${result1.recordset.length} 筆記錄`);
    if (result1.recordset.length > 0) {
      console.table(result1.recordset);
    }

    // 測試 2: 狀態統計查詢
    console.log("\n" + "=".repeat(50));
    console.log("📈 測試 2: 狀態統計查詢");

    const sql2 = `
      SELECT 
        Status, 
        COUNT(*) as Count,
        AVG(DATEDIFF(day, RecordDate, GETDATE())) as AvgDays
      FROM v_mil_kd 
      GROUP BY Status
      ORDER BY Count DESC
    `;

    console.log("🔍 執行 SQL:");
    console.log(sql2);

    const result2 = await pool.request().query(sql2);

    console.log(`\n📊 查詢結果: ${result2.recordset.length} 種狀態`);
    console.table(result2.recordset);

    // 測試 3: 類型統計查詢
    console.log("\n" + "=".repeat(50));
    console.log("📊 測試 3: 類型統計查詢");

    const sql3 = `
      SELECT TOP 10
        TypeName, 
        COUNT(*) as totalCount
      FROM v_mil_kd 
      GROUP BY TypeName
      ORDER BY totalCount DESC
    `;

    console.log("🔍 執行 SQL:");
    console.log(sql3);

    const result3 = await pool.request().query(sql3);

    console.log(`\n📊 查詢結果: 前10種類型`);
    console.table(result3.recordset);

    // 測試 4: 參數化查詢
    console.log("\n" + "=".repeat(50));
    console.log("🔍 測試 4: 參數化查詢（高重要度）");

    const sql4 = `
      SELECT 
        SerialNumber, TypeName, Status, Importance,
        Proposer_Name, DelayDay
      FROM v_mil_kd 
      WHERE Importance = @importance
      ORDER BY DelayDay DESC
    `;

    console.log("🔍 執行 SQL:");
    console.log(sql4);
    console.log("參數: @importance = '高'");

    const request4 = pool.request();
    request4.input("importance", "高");
    const result4 = await request4.query(sql4);

    console.log(`\n📊 查詢結果: ${result4.recordset.length} 筆高重要度記錄`);
    if (result4.recordset.length > 0) {
      result4.recordset.slice(0, 5).forEach((row, index) => {
        console.log(
          `${index + 1}. ${row.SerialNumber} - ${row.TypeName} (延遲${row.DelayDay}天)`,
        );
      });
    }

    // 測試 5: 複雜查詢（模擬分頁）
    console.log("\n" + "=".repeat(50));
    console.log("📄 測試 5: 分頁查詢");

    const sql5 = `
      SELECT 
        SerialNumber, TypeName, Status, RecordDate
      FROM v_mil_kd 
      WHERE Status = @status
      ORDER BY RecordDate DESC
      OFFSET @offset ROWS 
      FETCH NEXT @limit ROWS ONLY
    `;

    console.log("🔍 執行 SQL:");
    console.log(sql5);
    console.log("參數: @status = 'OnGoing', @offset = 0, @limit = 3");

    const request5 = pool.request();
    request5.input("status", "OnGoing");
    request5.input("offset", 0);
    request5.input("limit", 3);
    const result5 = await request5.query(sql5);

    console.log(
      `\n📊 查詢結果: ${result5.recordset.length} 筆記錄（第1頁，每頁3筆）`,
    );
    console.table(result5.recordset);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 SQL 測試完成！");
  } catch (error) {
    console.log("❌ SQL 測試發生錯誤:");
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
runSQLTest();
