/**
 * 測試新增的 getMILTypeList 功能
 */

import databaseService from "../services/database.js";
import milService from "../services/mil/mil-service.js";
import { getToolManager, registerAllTools } from "../tools/index.js";

async function testGetMILTypeList() {
  console.log("🧪 測試 getMILTypeList 功能...\n");

  try {
    // 註冊所有工具
    registerAllTools();
    console.log("✅ 工具註冊成功");

    // 初始化資料庫
    await databaseService.initialize();
    console.log("✅ 資料庫初始化成功");

    // 1. 測試 MIL Service 方法
    console.log("\n📋 測試 MIL Service - getMILTypeList...");
    const serviceResult = await milService.getMILTypeList();

    console.log("✅ MIL Service 測試成功！");
    console.log(`   取得 ${serviceResult.data.length} 種 MIL 類型`);
    console.log("   MIL 類型列表:");
    serviceResult.data.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type}`);
    });

    // 2. 測試 Tool Manager
    console.log("\n🔧 測試 Tool Manager - get-mil-type-list...");
    const toolManager = getToolManager();
    const toolResult = await toolManager.callTool("get-mil-type-list", {});

    console.log("✅ Tool Manager 測試成功！");
    console.log("   工具回傳結構:", JSON.stringify(toolResult, null, 2));

    // 檢查 toolResult 的結構
    if (toolResult && toolResult.result) {
      console.log(
        `   工具回傳狀態: ${toolResult.result.success ? "成功" : "失敗"}`,
      );
      if (
        toolResult.result.success &&
        toolResult.result.data &&
        toolResult.result.data.data
      ) {
        console.log(`   類型數量: ${toolResult.result.data.data.length}`);
      }
    } else {
      console.log("   警告: 工具回傳結構不符合預期");
    }

    // 3. 驗證結果一致性（只有在兩邊都成功時才進行比較）
    console.log("\n🔍 驗證結果一致性...");
    if (
      serviceResult &&
      serviceResult.data &&
      toolResult &&
      toolResult.result &&
      toolResult.result.success &&
      toolResult.result.data &&
      toolResult.result.data.data
    ) {
      const serviceTypes = serviceResult.data.sort();
      const toolTypes = toolResult.result.data.data.sort();

      const isConsistent =
        JSON.stringify(serviceTypes) === JSON.stringify(toolTypes);
      console.log(`   結果一致性: ${isConsistent ? "✅ 一致" : "❌ 不一致"}`);

      if (!isConsistent) {
        console.log("\n   Service 結果:", serviceTypes);
        console.log("   Tool 結果:", toolTypes);
      }
    } else {
      console.log("   無法比較結果，因為其中一個測試失敗");
    }

    console.log("\n🎉 getMILTypeList 功能測試完成！");
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
testGetMILTypeList().catch(console.error);
