/**
 * getStatusReport 功能測試案例
 */

import milService from "../../mil-service.js";

export async function testGetStatusReport() {
  console.log("\n📊 測試: getStatusReport - 獲取狀態報告");

  // 測試案例 1: 基本狀態報告查詢
  console.log("\n--- 測試案例 1: 基本狀態報告查詢 ---");
  try {
    const result1 = await milService.getStatusReport();

    console.log("✅ 狀態報告查詢成功");
    console.log(`📅 查詢時間: ${result1.timestamp}`);
    console.log(`📊 狀態類別數量: ${result1.data.length}`);

    if (result1.data && result1.data.length > 0) {
      console.log("\n📋 狀態統計報告:");
      console.log("=".repeat(60));
      console.table(
        result1.data.map(item => ({
          狀態: item.Status,
          數量: item.Count,
          平均天數: item.AvgDays ? Math.round(item.AvgDays * 100) / 100 : "N/A",
        })),
      );
      console.log("=".repeat(60));

      // 計算總數
      const totalCount = result1.data.reduce(
        (sum, item) => sum + item.Count,
        0,
      );
      console.log(`📈 總計: ${totalCount} 筆記錄`);

      // 找出最多和最少的狀態
      const maxStatus = result1.data.reduce((max, item) =>
        item.Count > max.Count ? item : max,
      );
      const minStatus = result1.data.reduce((min, item) =>
        item.Count < min.Count ? item : min,
      );

      console.log(`🔝 最多的狀態: ${maxStatus.Status} (${maxStatus.Count} 筆)`);
      console.log(`🔻 最少的狀態: ${minStatus.Status} (${minStatus.Count} 筆)`);
    }
  } catch (error) {
    console.log("❌ 狀態報告查詢失敗:", error.message);
  }

  // 測試案例 2: 資料一致性檢查
  console.log("\n--- 測試案例 2: 資料一致性檢查 ---");
  try {
    const statusReport = await milService.getStatusReport();
    const listResult = await milService.getMILList({}, 1, 1000); // 獲取大量資料

    console.log("🔍 檢查狀態報告與列表資料的一致性");

    if (statusReport.data && listResult.data) {
      const reportTotal = statusReport.data.reduce(
        (sum, item) => sum + item.Count,
        0,
      );
      const listTotal = listResult.totalRecords;

      console.log(`📊 狀態報告總數: ${reportTotal}`);
      console.log(`📊 列表總記錄數: ${listTotal}`);

      if (Math.abs(reportTotal - listTotal) <= 1) {
        // 允許小誤差
        console.log("✅ 資料一致性檢查通過");
      } else {
        console.log("⚠️ 資料一致性檢查有差異，可能需要檢查");
      }
    }
  } catch (error) {
    console.log("❌ 資料一致性檢查失敗:", error.message);
  }

  // 測試案例 3: 效能測試
  console.log("\n--- 測試案例 3: 效能測試 ---");
  try {
    const iterations = 3;
    const executionTimes = [];

    console.log(`🔍 執行 ${iterations} 次狀態報告查詢`);

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await milService.getStatusReport();
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      executionTimes.push(executionTime);
      console.log(`  第 ${i + 1} 次: ${executionTime}ms`);
    }

    const avgTime =
      executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxTime = Math.max(...executionTimes);
    const minTime = Math.min(...executionTimes);

    console.log("\n📊 效能統計:");
    console.log(`  平均時間: ${avgTime.toFixed(2)}ms`);
    console.log(`  最長時間: ${maxTime}ms`);
    console.log(`  最短時間: ${minTime}ms`);

    if (avgTime > 2000) {
      console.log("⚠️ 警告: 平均查詢時間超過 2 秒，建議優化");
    } else {
      console.log("✅ 查詢效能良好");
    }
  } catch (error) {
    console.log("❌ 效能測試失敗:", error.message);
  }

  // 測試案例 4: 資料結構驗證
  console.log("\n--- 測試案例 4: 資料結構驗證 ---");
  try {
    const result4 = await milService.getStatusReport();

    console.log("🔍 驗證回傳資料結構");

    // 檢查頂層結構
    const requiredTopFields = ["timestamp", "data"];
    const missingTopFields = requiredTopFields.filter(
      field => !(field in result4),
    );

    if (missingTopFields.length === 0) {
      console.log("✅ 頂層資料結構正確");
    } else {
      console.log("❌ 缺少頂層欄位:", missingTopFields.join(", "));
    }

    // 檢查資料陣列結構
    if (
      result4.data &&
      Array.isArray(result4.data) &&
      result4.data.length > 0
    ) {
      const sampleItem = result4.data[0];
      const requiredDataFields = ["Status", "Count", "AvgDays"];
      const missingDataFields = requiredDataFields.filter(
        field => !(field in sampleItem),
      );

      if (missingDataFields.length === 0) {
        console.log("✅ 資料項目結構正確");
      } else {
        console.log("❌ 缺少資料欄位:", missingDataFields.join(", "));
      }

      // 檢查資料類型
      console.log("\n📋 資料類型檢查:");
      result4.data.forEach((item, index) => {
        const statusType = typeof item.Status;
        const countType = typeof item.Count;
        const avgDaysType = typeof item.AvgDays;

        console.log(
          `  項目 ${index + 1}: Status(${statusType}), Count(${countType}), AvgDays(${avgDaysType})`,
        );

        if (statusType !== "string") {
          console.log(`    ⚠️ Status 應該是 string，但是 ${statusType}`);
        }
        if (countType !== "number") {
          console.log(`    ⚠️ Count 應該是 number，但是 ${countType}`);
        }
        if (avgDaysType !== "number" && item.AvgDays !== null) {
          console.log(
            `    ⚠️ AvgDays 應該是 number 或 null，但是 ${avgDaysType}`,
          );
        }
      });
    }
  } catch (error) {
    console.log("❌ 資料結構驗證失敗:", error.message);
  }

  // 測試案例 5: 業務邏輯驗證
  console.log("\n--- 測試案例 5: 業務邏輯驗證 ---");
  try {
    const result5 = await milService.getStatusReport();

    console.log("🔍 驗證業務邏輯");

    if (result5.data && result5.data.length > 0) {
      let logicErrors = [];

      result5.data.forEach(item => {
        // 檢查數量是否為正數
        if (item.Count <= 0) {
          logicErrors.push(`${item.Status} 的數量不應該是 ${item.Count}`);
        }

        // 檢查平均天數是否合理（不應該是負數）
        if (item.AvgDays !== null && item.AvgDays < 0) {
          logicErrors.push(
            `${item.Status} 的平均天數不應該是負數 ${item.AvgDays}`,
          );
        }

        // 檢查狀態名稱是否為空
        if (!item.Status || item.Status.trim() === "") {
          logicErrors.push("發現空的狀態名稱");
        }
      });

      if (logicErrors.length === 0) {
        console.log("✅ 業務邏輯驗證通過");
      } else {
        console.log("❌ 發現業務邏輯問題:");
        logicErrors.forEach(error => console.log(`  - ${error}`));
      }

      // 顯示一些統計資訊
      console.log("\n📈 統計摘要:");
      const totalStatuses = result5.data.length;
      const totalRecords = result5.data.reduce(
        (sum, item) => sum + item.Count,
        0,
      );
      const avgRecordsPerStatus = totalRecords / totalStatuses;

      console.log(`  狀態類別總數: ${totalStatuses}`);
      console.log(`  記錄總數: ${totalRecords}`);
      console.log(`  平均每種狀態記錄數: ${avgRecordsPerStatus.toFixed(2)}`);
    }
  } catch (error) {
    console.log("❌ 業務邏輯驗證失敗:", error.message);
  }

  console.log("\n🎯 getStatusReport 測試總結:");
  console.log("- 基本查詢功能測試完成");
  console.log("- 資料一致性檢查完成");
  console.log("- 效能測試完成");
  console.log("- 資料結構驗證完成");
  console.log("- 業務邏輯驗證完成");
}
