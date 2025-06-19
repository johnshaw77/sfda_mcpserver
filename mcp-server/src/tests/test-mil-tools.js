/**
 * MIL 工具測試腳本
 *
 * 測試 MIL 模組下的各個工具功能
 */

import databaseService from "../services/database.js";
import { toolManager } from "../tools/tool-manager.js";

async function testMILTools() {
  console.log("🔧 測試 MIL 工具功能...\n");

  try {
    // 初始化資料庫
    await databaseService.initialize();
    console.log("✅ 資料庫初始化成功");

    // 載入工具清單
    console.log("📋 取得所有工具...");
    const allTools = toolManager.getToolsList();

    // 篩選出 MIL 工具
    const milTools = allTools.filter(tool => tool.module === "mil");

    if (milTools.length === 0) {
      console.log("❌ 找不到任何 MIL 工具，請確認工具已正確註冊");
      return;
    }

    console.log(`✅ 找到 ${milTools.length} 個 MIL 工具`);

    // 列出所有 MIL 工具
    console.log("\n📝 MIL 工具清單:");
    milTools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} - ${tool.description}`);
    });

    // 測試每個 MIL 工具
    console.log("\n🧪 開始測試各個 MIL 工具...");

    for (const tool of milTools) {
      console.log(`\n📌 測試工具: ${tool.name}`);
      console.log(`   描述: ${tool.description}`);

      try {
        // 準備測試參數
        let testParams;

        switch (tool.name) {
          case "get-mil-list":
            testParams = {
              limit: 5,
            };
            break;

          case "get-mil-details":
            // 先取得一個有效的 MIL 編號
            const listResult = await toolManager.callTool("get-mil-list", {
              limit: 1,
            });
            if (
              listResult &&
              listResult.milList &&
              listResult.milList.length > 0
            ) {
              testParams = {
                serialNumber: listResult.milList[0].SerialNumber,
              };
            } else {
              console.log("⚠️  無法取得有效的 MIL 編號進行詳情測試");
              continue;
            }
            break;

          case "get-status-report":
            testParams = {};
            break;

          default:
            testParams = {};
        }

        console.log(`   測試參數: ${JSON.stringify(testParams)}`);

        // 執行工具
        const result = await toolManager.callTool(tool.name, testParams);

        console.log("✅ 工具執行成功!");

        // 顯示結果摘要
        if (result) {
          console.log("📝 結果摘要:");

          if (tool.name === "get-mil-list" && result.milList) {
            console.log(`   取得 ${result.milList.length} 筆 MIL 記錄`);
            if (result.milList.length > 0) {
              console.log(
                `   第一筆: ${result.milList[0].SerialNumber} - ${result.milList[0].Proposer_Name || "N/A"}`,
              );
            }
          } else if (tool.name === "get-mil-details" && result.data) {
            console.log(`   SerialNumber: ${result.data.SerialNumber}`);
            console.log(`   Status: ${result.data.Status || "N/A"}`);
            console.log(
              `   Proposer_Name: ${result.data.Proposer_Name || "N/A"}`,
            );
          } else if (tool.name === "get-status-report" && result.data) {
            console.log(`   狀態報告包含 ${result.data.length} 種狀態`);
          }
        }
      } catch (error) {
        console.log(`❌ 工具 ${tool.name} 執行失敗:`, error.message);
      }
    }

    console.log("\n🎉 MIL 工具測試完成！");
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
  } finally {
    await databaseService.close();
    console.log("🔒 資料庫連接已關閉");
  }
}

// 執行測試
testMILTools().catch(console.error);
