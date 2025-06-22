/**
 * getCountBy 功能測試案例
 */

import milService from "../../mil-service.js";

export async function testGetCountBy() {
  console.log("\n📊 測試: getCountBy - 統計功能");

  // 測試案例 1: 按狀態統計
  console.log("\n--- 測試案例 1: 按狀態統計 ---");
  try {
    const result1 = await milService.getCountBy("Status");

    console.log("✅ 按狀態統計成功");
    console.log(`📅 查詢時間: ${result1.timestamp}`);
    console.log(`📊 狀態類別數量: ${result1.data.length}`);

    if (result1.data && result1.data.length > 0) {
      console.log("\n📋 狀態統計結果:");
      console.log("=".repeat(40));
      console.table(
        result1.data.map(item => ({
          狀態: item.Status,
          數量: item.totalCount,
        })),
      );
      console.log("=".repeat(40));

      const totalCount = result1.data.reduce(
        (sum, item) => sum + item.totalCount,
        0,
      );
      console.log(`📈 總計: ${totalCount} 筆記錄`);
    }
  } catch (error) {
    console.log("❌ 按狀態統計失敗:", error.message);
  }

  // 測試案例 2: 按類型統計
  console.log("\n--- 測試案例 2: 按類型統計 ---");
  try {
    const result2 = await milService.getCountBy("TypeName");

    console.log("✅ 按類型統計成功");
    console.log(`📊 類型數量: ${result2.data.length}`);

    if (result2.data && result2.data.length > 0) {
      // 只顯示前10個結果，避免輸出過多
      const topResults = result2.data
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 10);

      console.log("\n📋 類型統計結果 (前10名):");
      console.log("=".repeat(50));
      console.table(
        topResults.map(item => ({
          類型: item.TypeName,
          數量: item.totalCount,
        })),
      );
      console.log("=".repeat(50));

      const totalCount = result2.data.reduce(
        (sum, item) => sum + item.totalCount,
        0,
      );
      console.log(`📈 總計: ${totalCount} 筆記錄`);

      // 顯示最多和最少的類型
      const maxType = result2.data.reduce((max, item) =>
        item.totalCount > max.totalCount ? item : max,
      );
      const minType = result2.data.reduce((min, item) =>
        item.totalCount < min.totalCount ? item : min,
      );

      console.log(
        `🔝 最多的類型: ${maxType.TypeName} (${maxType.totalCount} 筆)`,
      );
      console.log(
        `🔻 最少的類型: ${minType.TypeName} (${minType.totalCount} 筆)`,
      );
    }
  } catch (error) {
    console.log("❌ 按類型統計失敗:", error.message);
  }

  // 測試案例 3: 按重要度統計
  console.log("\n--- 測試案例 3: 按重要度統計 ---");
  try {
    const result3 = await milService.getCountBy("Importance");

    console.log("✅ 按重要度統計成功");
    console.log(`📊 重要度類別數量: ${result3.data.length}`);

    if (result3.data && result3.data.length > 0) {
      console.log("\n📋 重要度統計結果:");
      console.log("=".repeat(40));
      console.table(
        result3.data.map(item => ({
          重要度: item.Importance || "未設定",
          數量: item.totalCount,
        })),
      );
      console.log("=".repeat(40));
    }
  } catch (error) {
    console.log("❌ 按重要度統計失敗:", error.message);
  }

  // 測試案例 4: 按廠別統計
  console.log("\n--- 測試案例 4: 按廠別統計 ---");
  try {
    const result4 = await milService.getCountBy("ProposalFactory");

    console.log("✅ 按廠別統計成功");
    console.log(`📊 廠別數量: ${result4.data.length}`);

    if (result4.data && result4.data.length > 0) {
      // 只顯示前8個結果
      const topFactories = result4.data
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 8);

      console.log("\n📋 廠別統計結果 (前8名):");
      console.log("=".repeat(50));
      console.table(
        topFactories.map(item => ({
          廠別: item.ProposalFactory || "未設定",
          數量: item.totalCount,
        })),
      );
      console.log("=".repeat(50));
    }
  } catch (error) {
    console.log("❌ 按廠別統計失敗:", error.message);
  }

  // 測試案例 5: 無效欄位測試
  console.log("\n--- 測試案例 5: 無效欄位測試 ---");

  const invalidColumns = [
    "InvalidColumn",
    "NonExistentField",
    "",
    null,
    undefined,
    "DROP TABLE", // SQL injection 測試
    "'; DROP TABLE v_mil_kd; --",
  ];

  for (const invalidColumn of invalidColumns) {
    try {
      console.log(`\n🔍 測試無效欄位: ${invalidColumn || "空值"}`);

      const result5 = await milService.getCountBy(invalidColumn);

      // 如果沒有拋出錯誤，檢查結果
      console.log(
        `⚠️ 無效欄位查詢竟然成功了，結果數量: ${result5.data ? result5.data.length : 0}`,
      );
    } catch (error) {
      console.log(`✅ 正確處理無效欄位: ${error.message}`);
    }
  }

  // 測試案例 6: 效能測試
  console.log("\n--- 測試案例 6: 效能測試 ---");
  try {
    const testColumns = ["Status", "TypeName", "Importance"];

    console.log(`🔍 測試 ${testColumns.length} 個不同欄位的查詢效能`);

    for (const column of testColumns) {
      const startTime = Date.now();
      const result = await milService.getCountBy(column);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.log(
        `  ${column}: ${executionTime}ms (${result.data.length} 個類別)`,
      );

      if (executionTime > 2000) {
        console.log(`    ⚠️ ${column} 查詢時間過長`);
      }
    }
  } catch (error) {
    console.log("❌ 效能測試失敗:", error.message);
  }

  // 測試案例 7: 資料結構驗證
  console.log("\n--- 測試案例 7: 資料結構驗證 ---");
  try {
    const result7 = await milService.getCountBy("Status");

    console.log("🔍 驗證回傳資料結構");

    // 檢查頂層結構
    const requiredTopFields = ["timestamp", "data"];
    const missingTopFields = requiredTopFields.filter(
      field => !(field in result7),
    );

    if (missingTopFields.length === 0) {
      console.log("✅ 頂層資料結構正確");
    } else {
      console.log("❌ 缺少頂層欄位:", missingTopFields.join(", "));
    }

    // 檢查資料陣列結構
    if (
      result7.data &&
      Array.isArray(result7.data) &&
      result7.data.length > 0
    ) {
      const sampleItem = result7.data[0];

      // Status 欄位應該存在
      if ("Status" in sampleItem) {
        console.log("✅ Status 欄位存在");
      } else {
        console.log("❌ 缺少 Status 欄位");
      }

      // totalCount 欄位應該存在且為數字
      if (
        "totalCount" in sampleItem &&
        typeof sampleItem.totalCount === "number"
      ) {
        console.log("✅ totalCount 欄位正確");
      } else {
        console.log("❌ totalCount 欄位錯誤或不存在");
      }

      // 檢查所有項目的結構一致性
      const allItemsValid = result7.data.every(
        item =>
          "Status" in item &&
          "totalCount" in item &&
          typeof item.totalCount === "number",
      );

      if (allItemsValid) {
        console.log("✅ 所有資料項目結構一致");
      } else {
        console.log("❌ 發現結構不一致的資料項目");
      }
    }
  } catch (error) {
    console.log("❌ 資料結構驗證失敗:", error.message);
  }

  // 測試案例 8: 與其他 API 的一致性檢查
  console.log("\n--- 測試案例 8: 與其他 API 的一致性檢查 ---");
  try {
    const countByStatus = await milService.getCountBy("Status");
    const statusReport = await milService.getStatusReport();

    console.log("🔍 比較 getCountBy 和 getStatusReport 的結果");

    if (countByStatus.data && statusReport.data) {
      // 比較狀態數量
      const countByTotal = countByStatus.data.reduce(
        (sum, item) => sum + item.totalCount,
        0,
      );
      const reportTotal = statusReport.data.reduce(
        (sum, item) => sum + item.Count,
        0,
      );

      console.log(`📊 getCountBy 總數: ${countByTotal}`);
      console.log(`📊 getStatusReport 總數: ${reportTotal}`);

      if (Math.abs(countByTotal - reportTotal) <= 1) {
        // 允許小誤差
        console.log("✅ 兩個 API 的統計結果一致");
      } else {
        console.log("⚠️ 兩個 API 的統計結果有差異");
      }

      // 比較狀態類別
      const countByStatuses = new Set(
        countByStatus.data.map(item => item.Status),
      );
      const reportStatuses = new Set(
        statusReport.data.map(item => item.Status),
      );

      const missingInCountBy = [...reportStatuses].filter(
        status => !countByStatuses.has(status),
      );
      const missingInReport = [...countByStatuses].filter(
        status => !reportStatuses.has(status),
      );

      if (missingInCountBy.length === 0 && missingInReport.length === 0) {
        console.log("✅ 兩個 API 的狀態類別一致");
      } else {
        if (missingInCountBy.length > 0) {
          console.log("⚠️ getCountBy 中缺少狀態:", missingInCountBy);
        }
        if (missingInReport.length > 0) {
          console.log("⚠️ getStatusReport 中缺少狀態:", missingInReport);
        }
      }
    }
  } catch (error) {
    console.log("❌ 一致性檢查失敗:", error.message);
  }

  console.log("\n🎯 getCountBy 測試總結:");
  console.log("- 各種欄位統計功能測試完成");
  console.log("- 無效輸入處理測試完成");
  console.log("- 效能測試完成");
  console.log("- 資料結構驗證完成");
  console.log("- API 一致性檢查完成");
}
