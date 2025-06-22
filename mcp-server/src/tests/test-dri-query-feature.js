/**
 * 測試負責人查詢功能
 */

import databaseService from "../services/database.js";
import milService from "../services/mil/mil-service.js";
import { getToolManager, registerAllTools } from "../tools/index.js";

async function testDRIQueryFeature() {
  console.log("🧪 測試負責人查詢功能...\n");

  try {
    // 註冊所有工具
    registerAllTools();
    console.log("✅ 工具註冊成功");

    // 初始化資料庫
    await databaseService.initialize();
    console.log("✅ 資料庫初始化成功");

    // 測試場景
    const testCases = [
      {
        description: "按負責人姓名查詢",
        params: { driName: "陳", limit: 3 },
        type: "driName",
      },
      {
        description: "按負責人工號查詢",
        params: { driEmpNo: "U0700034", limit: 3 },
        type: "driEmpNo",
      },
      {
        description: "按負責部門查詢",
        params: { driDept: "品保處", limit: 5 },
        type: "driDept",
      },
      {
        description: "組合查詢：品保處的延遲案件",
        params: {
          driDept: "品保處",
          delayDayMin: 1,
          importance: "H",
          limit: 3,
        },
        type: "combination",
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 測試場景: ${testCase.description}`);
      console.log("=".repeat(50));
      console.log(`   查詢參數: ${JSON.stringify(testCase.params)}`);

      try {
        // 1. 測試 MIL Service 方法
        console.log("\n🔧 執行 MIL Service - getMILList...");
        const serviceResult = await milService.getMILList(
          testCase.params,
          1,
          testCase.params.limit,
        );

        console.log("✅ Service 執行成功");
        console.log(`   找到 ${serviceResult.count} 筆記錄`);
        console.log(`   總計 ${serviceResult.totalRecords} 筆符合條件`);

        // 顯示結果摘要
        if (serviceResult.data.length > 0) {
          console.log("\n   查詢結果摘要:");
          for (let i = 0; i < Math.min(3, serviceResult.data.length); i++) {
            const item = serviceResult.data[i];
            console.log(`   ${i + 1}. ${item.SerialNumber}`);
            console.log(
              `      負責人: ${item.DRI_EmpName || "N/A"} (${item.DRI_EmpNo || "N/A"})`,
            );
            console.log(`      部門: ${item.DRI_Dept || "N/A"}`);
            console.log(
              `      狀態: ${item.Status || "N/A"} | 優先級: ${item.Importance || "N/A"} | 延遲: ${item.DelayDay || 0} 天`,
            );
          }
        } else {
          console.log("   沒有找到符合條件的記錄");
        }

        // 2. 測試 Tool Manager
        console.log(`\n🔧 執行 Tool Manager - get-mil-list...`);
        const toolManager = getToolManager();
        const toolResult = await toolManager.callTool(
          "get-mil-list",
          testCase.params,
        );

        if (toolResult && toolResult.success && toolResult.result) {
          console.log("✅ Tool Manager 執行成功");
          console.log(
            `   工具回傳狀態: ${toolResult.result.success ? "成功" : "失敗"}`,
          );

          if (toolResult.result.success && toolResult.result.data) {
            console.log(`   工具找到 ${toolResult.result.data.count} 筆記錄`);
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
        console.error(
          `❌ 測試案例失敗 (${testCase.description}):`,
          error.message,
        );
      }
    }

    console.log("\n🎉 負責人查詢功能測試完成！");
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
testDRIQueryFeature().catch(console.error);
