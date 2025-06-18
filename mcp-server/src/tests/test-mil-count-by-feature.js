/**
 * 測試 MIL getCountBy 功能的專用測試腳本
 * 測試依指定欄位統計 MIL 記錄數量的功能
 */

import databaseService from "../services/database.js";
import milService from "../services/mil/mil-service.js";
import { getToolManager, registerAllTools } from "../tools/index.js";

async function testMILCountByFeature() {
  console.log("🧪 測試 MIL getCountBy 統計功能...\n");

  try {
    // 註冊所有工具
    registerAllTools();
    console.log("✅ 工具註冊成功");

    // 初始化資料庫
    await databaseService.initialize();
    console.log("✅ 資料庫初始化成功");

    // 定義測試欄位組
    const testFieldGroups = [
      {
        name: "狀態相關欄位",
        fields: ["Status", "Importance"]
      },
      {
        name: "組織相關欄位", 
        fields: ["ProposalFactory", "Proposer_Dept"]
      },
      {
        name: "責任相關欄位",
        fields: ["DRI_Dept", "Location"]
      }
    ];

    let totalTests = 0;
    let successTests = 0;

    for (const group of testFieldGroups) {
      console.log(`\n📊 測試組別: ${group.name}`);
      console.log(`${"=".repeat(50)}`);

      for (const columnName of group.fields) {
        totalTests++;
        
        try {
          console.log(`\n📋 測試欄位: ${columnName}`);
          
          // 1. 測試 MIL Service 方法
          console.log(`   🔧 執行 MIL Service - getCountBy(${columnName})...`);
          const serviceResult = await milService.getCountBy(columnName);
          
          console.log(`   ✅ Service 執行成功`);
          console.log(`   📊 統計結果: ${serviceResult.data.length} 個不同值`);
          
          // 顯示統計結果摘要
          const totalRecords = serviceResult.data.reduce((sum, item) => sum + item.totalCount, 0);
          console.log(`   📈 總記錄數: ${totalRecords.toLocaleString()} 筆`);
          
          // 顯示前3項結果
          if (serviceResult.data.length > 0) {
            console.log(`   🔝 前3項結果:`);
            serviceResult.data.slice(0, 3).forEach((item, index) => {
              const value = item[columnName] === null ? 'null' : item[columnName];
              console.log(`      ${index + 1}. ${value}: ${item.totalCount.toLocaleString()} 筆`);
            });
          }

          // 2. 測試 Tool Manager
          console.log(`   🔧 執行 Tool Manager - get-count-by...`);
          const toolManager = getToolManager();
          const toolResult = await toolManager.callTool("get-count-by", { columnName });

          if (toolResult && toolResult.success && toolResult.data) {
            console.log(`   ✅ Tool 執行成功`);
            console.log(`   📊 ${toolResult.data.summary}`);

            // 3. 驗證結果一致性
            const serviceCount = serviceResult.data.length;
            const toolCount = toolResult.data.data.length;
            const isConsistent = serviceCount === toolCount;
            
            console.log(`   🔍 結果一致性: ${isConsistent ? "✅ 一致" : "❌ 不一致"}`);
            
            if (isConsistent) {
              successTests++;
              console.log(`   🎯 測試通過`);
            } else {
              console.log(`   ⚠️  警告: Service(${serviceCount}) vs Tool(${toolCount})`);
            }
          } else {
            console.log(`   ❌ Tool 執行失敗`);
          }

        } catch (fieldError) {
          console.log(`   ❌ 測試失敗: ${fieldError.message}`);
        }
      }
    }

    // 測試摘要
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎉 測試完成摘要:`);
    console.log(`   總測試數: ${totalTests}`);
    console.log(`   成功測試: ${successTests}`);
    console.log(`   失敗測試: ${totalTests - successTests}`);
    console.log(`   成功率: ${((successTests / totalTests) * 100).toFixed(1)}%`);

    if (successTests === totalTests) {
      console.log(`\n🎊 所有測試通過！getCountBy 功能運作正常！`);
    } else {
      console.log(`\n⚠️  部分測試失敗，請檢查相關功能`);
    }

  } catch (error) {
    console.error("❌ 測試執行失敗:", error.message);
    console.error("錯誤詳情:", error);
  } finally {
    // 關閉資料庫連接
    try {
      if (databaseService.close) {
        await databaseService.close();
      }
      console.log("\n🔒 資料庫連接已關閉");
    } catch (closeError) {
      console.error("關閉資料庫時發生錯誤:", closeError.message);
    }
  }
}

// 執行測試
testMILCountByFeature().catch(console.error);
