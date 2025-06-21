#!/usr/bin/env node

/**
 * 容錯機制測試腳本
 *
 * 測試當資料庫連接失敗時，系統是否能正確處理並繼續運行
 */

import logger from "../src/config/logger.js";
import databaseService from "../src/services/database.js";
import { getRegisteredTools, registerAllTools } from "../src/tools/index.js";

async function testFaultTolerance() {
  console.log("=== MCP 服務容錯機制測試 ===\n");

  try {
    // 確保日誌系統已初始化
    await logger.init();
    console.log("✅ 日誌系統初始化成功");

    // 註冊所有工具
    try {
      registerAllTools();
      console.log("✅ 工具註冊完成");
    } catch (error) {
      console.log("❌ 工具註冊失敗:", error.message);
      process.exit(1);
    }

    // 測試資料庫初始化
    console.log("\n--- 測試資料庫服務初始化 ---");
    let databaseInitResults = {};

    try {
      databaseInitResults = await databaseService.initialize();
      console.log("✅ 資料庫服務初始化完成", databaseInitResults);
    } catch (error) {
      console.log("⚠️  資料庫服務初始化失敗，但系統將繼續:", error.message);
      databaseInitResults = { error: error.message };
    }

    // 檢查各個資料庫狀態
    console.log("\n--- 檢查資料庫可用性 ---");
    const dbServices = ["qms", "mil"];

    for (const dbName of dbServices) {
      const isAvailable = databaseService.isDatabaseAvailable
        ? databaseService.isDatabaseAvailable(dbName)
        : false;

      if (isAvailable) {
        console.log(`✅ ${dbName} 資料庫可用`);
      } else {
        console.log(`❌ ${dbName} 資料庫不可用`);
      }
    }

    // 檢查工具可用性
    console.log("\n--- 檢查工具可用性 ---");
    const tools = getRegisteredTools();
    console.log(`📊 已註冊工具總數: ${tools.length}`);

    const toolsByModule = {};
    const availableTools = [];
    const unavailableTools = [];

    for (const tool of tools) {
      const moduleName = tool.module || "other";
      if (!toolsByModule[moduleName]) {
        toolsByModule[moduleName] = [];
      }
      toolsByModule[moduleName].push(tool.name);

      // 檢查工具的資料庫依賴
      if (
        tool.requiredDatabases &&
        Array.isArray(tool.requiredDatabases) &&
        tool.requiredDatabases.length > 0
      ) {
        const unavailableDbs = [];

        for (const dbName of tool.requiredDatabases) {
          const isAvailable = databaseService.isDatabaseAvailable
            ? databaseService.isDatabaseAvailable(dbName)
            : false;

          if (!isAvailable) {
            unavailableDbs.push(dbName);
          }
        }

        if (unavailableDbs.length > 0) {
          unavailableTools.push({
            name: tool.name,
            module: moduleName,
            unavailableDatabases: unavailableDbs,
            requiredDatabases: tool.requiredDatabases,
          });
        } else {
          availableTools.push({
            name: tool.name,
            module: moduleName,
          });
        }
      } else {
        availableTools.push({
          name: tool.name,
          module: moduleName,
        });
      }
    }

    console.log(`✅ 可用工具數: ${availableTools.length}`);
    console.log(`❌ 不可用工具數: ${unavailableTools.length}`);

    // 按模組顯示工具狀態
    console.log("\n--- 按模組顯示工具狀態 ---");
    Object.keys(toolsByModule).forEach(moduleName => {
      const moduleTools = toolsByModule[moduleName];
      const availableInModule = availableTools.filter(
        t => t.module === moduleName,
      ).length;
      const unavailableInModule = unavailableTools.filter(
        t => t.module === moduleName,
      ).length;

      console.log(`📁 ${moduleName} 模組:`);
      console.log(`   總工具數: ${moduleTools.length}`);
      console.log(
        `   可用: ${availableInModule}, 不可用: ${unavailableInModule}`,
      );

      if (unavailableInModule > 0) {
        const unavailableInThisModule = unavailableTools.filter(
          t => t.module === moduleName,
        );
        unavailableInThisModule.forEach(tool => {
          console.log(
            `   ❌ ${tool.name} (需要資料庫: ${tool.requiredDatabases.join(", ")})`,
          );
        });
      }
    });

    // 測試結果摘要
    console.log("\n=== 測試結果摘要 ===");
    const hasAnyDatabase = dbServices.some(
      dbName =>
        databaseService.isDatabaseAvailable &&
        databaseService.isDatabaseAvailable(dbName),
    );

    console.log(`📊 資料庫狀態: ${hasAnyDatabase ? "部分可用" : "全部不可用"}`);
    console.log(`📊 工具狀態: ${availableTools.length}/${tools.length} 可用`);

    if (availableTools.length > 0) {
      console.log(
        "🎉 系統容錯機制正常工作！即使部分資料庫不可用，系統仍然可以提供服務。",
      );
    } else {
      console.log("⚠️  所有工具都不可用，請檢查資料庫配置。");
    }

    // 關閉資料庫連接
    try {
      await databaseService.close();
      console.log("✅ 資料庫連接已關閉");
    } catch (error) {
      console.log("⚠️  關閉資料庫連接時發生錯誤:", error.message);
    }
  } catch (error) {
    console.error("❌ 測試過程中發生未預期的錯誤:", error);
    process.exit(1);
  }
}

// 執行測試
testFaultTolerance()
  .then(() => {
    console.log("\n🏁 測試完成");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ 測試失敗:", error);
    process.exit(1);
  });
