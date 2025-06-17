/**
 * 檢查已註冊的工具
 */

import { getToolManager, registerAllTools } from "../tools/index.js";

async function listRegisteredTools() {
  console.log("🔍 檢查已註冊的工具...\n");

  try {
    // 先註冊所有工具
    registerAllTools();

    const toolManager = getToolManager();
    const tools = toolManager.getToolsList();

    console.log(`📋 共有 ${tools.length} 個已註冊的工具:\n`);

    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} (${tool.module || "未分模組"})`);
      console.log(`   描述: ${tool.description}`);
      console.log("");
    });

    // 檢查特定工具
    const milTools = tools.filter(tool => tool.module === "mil");
    console.log(`\n🎯 MIL 模組工具 (${milTools.length} 個):`);
    milTools.forEach(tool => {
      console.log(`   • ${tool.name}`);
    });
  } catch (error) {
    console.error("❌ 檢查失敗:", error.message);
  }
}

listRegisteredTools();
