#!/usr/bin/env node
/**
 * 檢查工具模組屬性測試腳本
 */

import logger from "./src/config/logger.js";
import { registerAllTools, getRegisteredTools } from "./src/tools/index.js";

async function checkToolModules() {
  try {
    console.log("🔄 初始化並註冊工具...");
    await logger.init();
    registerAllTools();

    const tools = getRegisteredTools();
    console.log(`📊 總工具數: ${tools.length}\n`);

    // 按模組分組顯示
    const moduleMap = {};
    tools.forEach(tool => {
      const moduleName = tool.module || "other";
      if (!moduleMap[moduleName]) {
        moduleMap[moduleName] = [];
      }
      moduleMap[moduleName].push(tool);
    });

    console.log("📋 按模組分組的工具:");
    Object.keys(moduleMap).forEach(moduleName => {
      console.log(
        `\n📦 ${moduleName} 模組 (${moduleMap[moduleName].length} 個工具):`,
      );
      moduleMap[moduleName].forEach(tool => {
        console.log(`  - ${tool.name}`);
        console.log(`    模組: ${tool.module || "未設定"}`);
        console.log(`    描述: ${tool.description}`);
      });
    });
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
  } finally {
    try {
      await logger.close();
    } catch (error) {
      console.error("關閉日誌系統失敗:", error);
    }
  }
}

checkToolModules();
