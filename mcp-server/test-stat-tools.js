#!/usr/bin/env node
/**
 * 測試統計工具註冊腳本
 */

import logger from "./src/config/logger.js";
import { registerAllTools, getRegisteredTools } from "./src/tools/index.js";

async function testStatToolsRegistration() {
  try {
    console.log("🔄 初始化日誌系統...");
    await logger.init();

    console.log("🔄 註冊所有工具...");
    registerAllTools();

    console.log("✅ 工具註冊完成");

    const tools = getRegisteredTools();
    console.log(`📊 已註冊工具總數: ${tools.length}`);

    // 檢查統計工具
    const statTools = tools.filter(
      tool =>
        tool.name.includes("ttest") ||
        tool.name.includes("chisquare") ||
        tool.name.includes("anova") ||
        tool.name.includes("analyze_data"),
    );

    console.log(`📈 統計工具數量: ${statTools.length}`);
    console.log("📈 統計工具列表:");
    statTools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description || "無描述"}`);
    });

    if (statTools.length > 0) {
      console.log("✅ 統計工具註冊成功！");
    } else {
      console.log("❌ 未找到統計工具");
    }
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testStatToolsRegistration();
