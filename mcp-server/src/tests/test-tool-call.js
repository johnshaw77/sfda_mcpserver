/**
 * 測試 getMILTypeList 工具調用（無需真實資料庫）
 */

import { getToolManager, registerAllTools } from "../tools/index.js";

async function testToolCall() {
  console.log("🧪 測試 getMILTypeList 工具調用...\n");

  try {
    // 註冊所有工具
    registerAllTools();
    console.log("✅ 工具註冊成功");

    const toolManager = getToolManager();

    // 檢查工具存在性
    const targetTool = "get-mil-type-list";
    const hasTool = toolManager.hasTool(targetTool);
    console.log(
      `🎯 工具 ${targetTool} 存在性: ${hasTool ? "✅ 存在" : "❌ 不存在"}`,
    );

    if (!hasTool) {
      console.log("❌ 工具不存在，無法進行測試");
      return;
    }

    // 嘗試調用工具（這會失敗，但我們可以看到錯誤原因）
    console.log("\n🔧 嘗試調用工具...");
    try {
      const result = await toolManager.callTool(targetTool, {});
      console.log("✅ 工具調用成功！", result);
    } catch (toolError) {
      console.log("⚠️  工具調用失敗（預期中，因為沒有資料庫連接）:");
      console.log(`   錯誤類型: ${toolError.constructor.name}`);
      console.log(`   錯誤訊息: ${toolError.message}`);

      // 這表示工具本身是存在的，只是執行時缺少資料庫連接
      if (
        toolError.message.includes("資料庫") ||
        toolError.message.includes("connection") ||
        toolError.message.includes("database")
      ) {
        console.log("✅ 工具可正常調用，問題在於資料庫連接");
      }
    }
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
    console.error("錯誤詳情:", error);
  }
}

// 執行測試
testToolCall();
