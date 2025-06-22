/**
 * 自訂 SQL 查詢測試腳本
 *
 * 使用方式: node custom-sql-test.js
 *
 * 在這個腳本中，您可以：
 * 1. 修改 SQL 查詢語句
 * 2. 調整參數
 * 3. 立即看到結果
 */

import databaseService from "../../database.js";

console.log("🔧 自訂 SQL 查詢測試");
console.log("=".repeat(50));

async function customSQLTest() {
  try {
    // 初始化資料庫服務
    console.log("📡 初始化資料庫服務...");
    await databaseService.initialize();
    console.log("✅ 資料庫服務初始化成功");

    // 獲取資料庫連線
    console.log("📡 獲取資料庫連線...");
    const pool = databaseService.getPool("mil");
    console.log("✅ 資料庫連線成功");

    // ================================
    // 在這裡修改您的 SQL 查詢
    // ================================

    console.log("\n🔍 執行自訂查詢...");

    // 範例 1: 簡單查詢
    const mySQL = `
      SELECT TOP 10
        SerialNumber,
        TypeName,
        Status,
        Importance,
        DelayDay,
        Proposer_Name,
        RecordDate
      FROM v_mil_kd 
      WHERE Status = 'OnGoing'
        AND Importance = '高'
      ORDER BY DelayDay DESC
    `;

    console.log("📝 SQL 查詢:");
    console.log(mySQL);

    const result = await pool.request().query(mySQL);

    console.log(`\n📊 查詢結果: ${result.recordset.length} 筆記錄`);

    if (result.recordset.length > 0) {
      console.log("\n📋 查詢結果:");
      console.table(result.recordset);

      // 顯示一些統計資訊
      const avgDelayDay =
        result.recordset.reduce((sum, row) => sum + (row.DelayDay || 0), 0) /
        result.recordset.length;
      console.log(`\n📈 統計資訊:`);
      console.log(`- 平均延遲天數: ${Math.round(avgDelayDay)} 天`);
      console.log(
        `- 最大延遲天數: ${Math.max(...result.recordset.map(row => row.DelayDay || 0))} 天`,
      );
      console.log(
        `- 最小延遲天數: ${Math.min(...result.recordset.map(row => row.DelayDay || 0))} 天`,
      );
    } else {
      console.log("⚠️ 沒有找到符合條件的記錄");
    }

    // ================================
    // 範例 2: 參數化查詢
    // ================================

    console.log("\n" + "=".repeat(50));
    console.log("🔍 執行參數化查詢...");

    const paramSQL = `
      SELECT 
        TypeName,
        COUNT(*) as Count,
        AVG(DelayDay) as AvgDelayDay
      FROM v_mil_kd 
      WHERE ProposalFactory = @factory
        AND Status = @status
      GROUP BY TypeName
      ORDER BY Count DESC
    `;

    // 設定參數值 - 您可以在這裡修改參數
    const parameters = {
      factory: "A廠", // 修改這裡來測試不同的廠別
      status: "OnGoing", // 修改這裡來測試不同的狀態
    };

    console.log("📝 SQL 查詢:");
    console.log(paramSQL);
    console.log("📝 參數:");
    console.log(parameters);

    const request = pool.request();
    request.input("factory", parameters.factory);
    request.input("status", parameters.status);

    const paramResult = await request.query(paramSQL);

    console.log(`\n📊 查詢結果: ${paramResult.recordset.length} 種類型`);

    if (paramResult.recordset.length > 0) {
      console.table(paramResult.recordset);
    } else {
      console.log("⚠️ 沒有找到符合條件的記錄");
    }

    // ================================
    // 範例 3: 自訂統計查詢
    // ================================

    console.log("\n" + "=".repeat(50));
    console.log("📊 執行統計查詢...");

    const statsSQL = `
      SELECT 
        Status,
        COUNT(*) as Total,
        COUNT(CASE WHEN Importance = '高' THEN 1 END) as High,
        COUNT(CASE WHEN Importance = '中' THEN 1 END) as Medium,
        COUNT(CASE WHEN Importance = '低' THEN 1 END) as Low,
        AVG(DelayDay) as AvgDelay,
        MAX(DelayDay) as MaxDelay
      FROM v_mil_kd 
      GROUP BY Status
      ORDER BY Total DESC
    `;

    console.log("📝 SQL 查詢:");
    console.log(statsSQL);

    const statsResult = await pool.request().query(statsSQL);

    console.log(`\n📊 統計結果:`);
    console.table(statsResult.recordset);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 自訂查詢測試完成！");
    console.log("\n💡 提示:");
    console.log("- 修改上面的 SQL 查詢來測試不同的場景");
    console.log("- 調整參數值來查看不同的結果");
    console.log("- 使用 console.table() 來美化表格輸出");
  } catch (error) {
    console.log("❌ 查詢測試發生錯誤:");
    console.log("錯誤訊息:", error.message);
    console.log("錯誤堆疊:", error.stack);

    // 顯示一些常見的錯誤處理建議
    console.log("\n💡 常見錯誤處理建議:");
    if (error.message.includes("Invalid column name")) {
      console.log("- 檢查欄位名稱是否正確");
      console.log("- 確認 v_mil_kd 視圖中是否包含該欄位");
    }
    if (error.message.includes("Incorrect syntax")) {
      console.log("- 檢查 SQL 語法是否正確");
      console.log("- 確認括號、引號是否配對");
    }
    if (error.message.includes("connection")) {
      console.log("- 檢查資料庫連線設定");
      console.log("- 確認資料庫服務是否正常運行");
    }
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
customSQLTest();
