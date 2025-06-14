/**
 * 簡單的客訴工具測試
 */

import databaseService from "../services/database.js";

async function testDatabaseQuery() {
  console.log("🔧 測試客訴資料庫查詢...\n");

  try {
    // 初始化資料庫
    await databaseService.initialize();
    console.log("✅ 資料庫初始化成功");

    // 測試簡單查詢
    console.log("📋 測試查詢 qms_voc_detail 資料表...");

    const testQuery = "SELECT COUNT(*) as total FROM qms_voc_detail";
    const result = await databaseService.query("qms", testQuery);

    console.log(`✅ 查詢成功！總共有 ${result[0].total} 筆客訴記錄`);

    // 測試取得一些範例資料
    if (result[0].total > 0) {
      console.log("📝 取得前 3 筆客訴記錄範例...");

      const sampleQuery = `
        SELECT id, voc_no, customer_name, complaint_subject, status, priority_level 
        FROM qms_voc_detail 
        ORDER BY created_date DESC 
        LIMIT 3
      `;

      const samples = await databaseService.query("qms", sampleQuery);

      samples.forEach((complaint, index) => {
        console.log(
          `${index + 1}. ${complaint.voc_no || complaint.id} - ${complaint.customer_name}`,
        );
        console.log(`   主旨: ${complaint.complaint_subject || "N/A"}`);
        console.log(`   狀態: ${complaint.status || "N/A"}`);
        console.log(`   優先級: ${complaint.priority_level || "N/A"}`);
        console.log("");
      });
    }

    console.log("🎉 客訴工具已準備就緒！");
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);

    if (
      error.message.includes("Table") &&
      error.message.includes("doesn't exist")
    ) {
      console.log("\n💡 建議：");
      console.log("1. 確認資料表名稱是否為 'qms_voc_detail'");
      console.log("2. 確認您有存取該資料表的權限");
      console.log("3. 聯絡 MIS 確認資料表結構");
    }
  } finally {
    await databaseService.close();
    console.log("🔒 資料庫連接已關閉");
  }
}

testDatabaseQuery();
