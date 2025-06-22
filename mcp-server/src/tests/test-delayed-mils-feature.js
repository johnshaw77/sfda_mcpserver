/**
 * 測試延遲案件查詢功能
 */

import databaseService from "../services/database.js";
import milService from "../services/mil/mil-service.js";
import { getToolManager, registerAllTools } from "../tools/index.js";

async function testDelayedMILsFeature() {
  console.log("🧪 測試延遲案件查詢功能...\n");

  try {
    // 註冊所有工具
    registerAllTools();
    console.log("✅ 工具註冊成功");

    // 初始化資料庫
    await databaseService.initialize();
    console.log("✅ 資料庫初始化成功");

    // 測試不同的延遲天數閾值
    const testCases = [
      { days: 0, description: "所有延遲案件" },
      { days: 5, description: "延遲超過 5 天" },
      { days: 10, description: "延遲超過 10 天" },
      { days: 30, description: "延遲超過 30 天" },
    ];

    for (const testCase of testCases) {
      console.log(
        `\n📋 測試場景: ${testCase.description} (${testCase.days} 天)`,
      );
      console.log("=".repeat(50));

      try {
        // 1. 測試 MIL Service 方法
        console.log(
          `\n🔧 執行 MIL Service - getDelayedMILs(${testCase.days})...`,
        );
        const serviceResult = await milService.getDelayedMILs(
          testCase.days,
          1,
          5,
        );

        console.log("✅ Service 執行成功");
        console.log(`   找到 ${serviceResult.count} 筆延遲案件`);
        console.log(`   總計 ${serviceResult.totalRecords} 筆記錄`);

        // 顯示前幾筆結果摘要
        if (serviceResult.data.length > 0) {
          console.log("\n   延遲案件摘要 (前 3 筆):");
          for (let i = 0; i < Math.min(3, serviceResult.data.length); i++) {
            const item = serviceResult.data[i];
            console.log(
              `   ${i + 1}. ${item.SerialNumber} - 延遲 ${item.DelayDay} 天`,
            );
            console.log(
              `      負責人: ${item.DRI_EmpName || "N/A"} (${item.DRI_Dept || "N/A"})`,
            );
            console.log(
              `      狀態: ${item.Status || "N/A"} | 優先級: ${item.Importance || "N/A"}`,
            );
          }
        } else {
          console.log("   沒有找到符合條件的延遲案件");
        }

        // 2. 測試 Tool Manager
        console.log(`\n🔧 執行 Tool Manager - get-delayed-mils...`);
        const toolManager = getToolManager();
        const toolResult = await toolManager.callTool("get-delayed-mils", {
          days: testCase.days,
          limit: 5,
        });

        if (toolResult && toolResult.success && toolResult.result) {
          console.log("✅ Tool Manager 執行成功");
          console.log(
            `   工具回傳狀態: ${toolResult.result.success ? "成功" : "失敗"}`,
          );

          if (toolResult.result.success && toolResult.result.data) {
            console.log(
              `   工具找到 ${toolResult.result.data.count} 筆延遲案件`,
            );
          }
        } else {
          console.log("❌ Tool Manager 執行失敗");
          console.log("   工具回傳:", JSON.stringify(toolResult, null, 2));
        }

        // 3. 驗證結果一致性
        if (
          serviceResult &&
          toolResult &&
          toolResult.result &&
          toolResult.result.success
        ) {
          const serviceCount = serviceResult.count;
          const toolCount = toolResult.result.data.count;
          const isConsistent = serviceCount === toolCount;

          console.log(
            `\n🔍 結果一致性: ${isConsistent ? "✅ 一致" : "❌ 不一致"}`,
          );
          console.log(`   Service 結果: ${serviceCount} 筆`);
          console.log(`   Tool 結果: ${toolCount} 筆`);
        }
      } catch (error) {
        console.error(`❌ 測試案例失敗 (${testCase.days} 天):`, error.message);
      }
    }

    console.log("\n🎉 延遲案件查詢功能測試完成！");
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
    console.error("錯誤詳情:", error);
  } finally {
    // 關閉資料庫連接
    try {
      if (databaseService.close) {
        await databaseService.close();
        console.log("\n🔒 資料庫連接已關閉");
      }
    } catch (closeError) {
      console.error("❌ 關閉資料庫連接失敗:", closeError.message);
    }
  }
}

// 執行測試
testDelayedMILsFeature().catch(console.error);
