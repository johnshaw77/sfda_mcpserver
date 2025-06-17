/**
 * 簡單測試 getMILTypeList 工具名稱
 */

import { getToolManager, registerAllTools } from "../tools/index.js";

async function simpleTest() {
  console.log("🔍 簡單測試工具名稱...\n");

  try {
    // 註冊所有工具
    registerAllTools();
    console.log("✅ 工具註冊成功");

    const toolManager = getToolManager();

    // 列出所有工具
    const tools = toolManager.getToolsList();
    console.log(`📋 共有 ${tools.length} 個工具:`);
    tools.forEach(tool => {
      console.log(`   • ${tool.name} (${tool.module || "未分模組"})`);
    });

    // 檢查特定工具
    const targetTool = "get-mil-type-list";
    console.log(`\n🎯 檢查工具: ${targetTool}`);

    const hasTool = toolManager.hasTool(targetTool);
    console.log(`   存在性: ${hasTool ? "✅ 存在" : "❌ 不存在"}`);

    if (hasTool) {
      const tool = toolManager.getTool(targetTool);
      console.log(
        `   工具資訊: ${tool.getInfo().name} - ${tool.getInfo().description}`,
      );
    }
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
  }
}

// 執行測試
simpleTest();
