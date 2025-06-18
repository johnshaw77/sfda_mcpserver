/**
 * 測試新增的 getCountBy 功能
 */

import databaseService from "../services/database.js";
import milService from "../services/mil/mil-service.js";
import { getToolManager, registerAllTools } from "../tools/index.js";

async function testGetCountBy() {
  console.log("🧪 測試 getCountBy 功能...\n");

  try {
    // 註冊所有工具
    registerAllTools();
    console.log("✅ 工具註冊成功");

    // 初始化資料庫
    await databaseService.initialize();
    console.log("✅ 資料庫初始化成功");

    // 測試不同的欄位（使用實際可用的欄位）
    const testColumns = ["Status", "ProposalFactory", "Importance"];

    for (const columnName of testColumns) {
      console.log(`\n📋 測試 MIL Service - getCountBy(${columnName})...`);

      // 1. 測試 MIL Service 方法
      const serviceResult = await milService.getCountBy(columnName);
      console.log(`✅ MIL Service 測試成功！`);
      console.log(`   統計欄位: ${columnName}`);
      console.log(`   統計結果數量: ${serviceResult.data.length}`);
      console.log("   統計結果範例 (前 3 項):");
      serviceResult.data.slice(0, 3).forEach((item, index) => {
        console.log(
          `   ${index + 1}. ${item[columnName]}: ${item.totalCount} 筆`,
        );
      });

      // 2. 測試 Tool Manager
      console.log(`\n🔧 測試 Tool Manager - get-count-by (${columnName})...`);
      const toolManager = getToolManager();
      const toolResult = await toolManager.callTool("get-count-by", {
        columnName,
      });

      console.log("✅ Tool Manager 測試成功！");
      console.log("   工具回傳結構:", JSON.stringify(toolResult, null, 2));

      // 檢查 toolResult 的結構並適配
      let success = false;
      let data = null;
      
      if (toolResult && toolResult.result) {
        success = toolResult.result.success;
        data = toolResult.result.data;
      } else if (toolResult && toolResult.success !== undefined) {
        success = toolResult.success;
        data = toolResult.data;
      }

      console.log(`   工具回傳狀態: ${success ? "成功" : "失敗"}`);

      if (success && data && data.data) {
        console.log(`   統計結果數量: ${data.data.length}`);
        console.log(`   摘要: ${data.summary}`);
      }

      // 3. 驗證結果一致性
      console.log(`\n🔍 驗證結果一致性 (${columnName})...`);
      if (serviceResult && serviceResult.data && success && data && data.data) {
        const serviceCount = serviceResult.data.length;
        const toolCount = data.data.length;

        const isConsistent = serviceCount === toolCount;
        console.log(`   結果一致性: ${isConsistent ? "✅ 一致" : "❌ 不一致"}`);
        console.log(`   Service 結果數量: ${serviceCount}`);
        console.log(`   Tool 結果數量: ${toolCount}`);

        if (!isConsistent) {
          console.log("   警告: 結果數量不一致，需要檢查！");
        }
      } else {
        console.log("   無法比較結果，因為其中一個測試失敗");
      }

      console.log(`\n${"=".repeat(60)}`);
    }

    console.log("\n🎉 getCountBy 功能測試完成！");
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
    console.error("錯誤詳情:", error);
  } finally {
    // 關閉資料庫連接
    try {
      if (databaseService.close) {
        await databaseService.close();
      }
      console.log("🔒 資料庫連接已關閉");
    } catch (closeError) {
      console.error("關閉資料庫時發生錯誤:", closeError.message);
    }
  }
}

// 執行測試
testGetCountBy().catch(console.error);
