/**
 * getMILList 功能測試案例
 */

import milService from "../../mil-service.js";

export async function testGetMILList() {
  console.log("\n📋 測試: getMILList - 獲取 MIL 列表");

  // 測試案例 1: 基本查詢 (預設 OnGoing 狀態)
  console.log("\n--- 測試案例 1: 基本查詢 (預設狀態) ---");
  try {
    const result1 = await milService.getMILList();

    console.log("✅ 基本查詢成功");
    console.log(`📊 查詢結果: ${result1.count} 筆記錄`);
    console.log(`📄 總頁數: ${result1.totalPages}`);
    console.log(`🔄 狀態: ${result1.status}`);

    // 顯示前 3 筆資料
    if (result1.data && result1.data.length > 0) {
      console.log("\n前 3 筆資料:");
      console.table(
        result1.data.slice(0, 3).map(item => ({
          編號: item.SerialNumber,
          類型: item.TypeName,
          狀態: item.Status,
          重要度: item.Importance,
          延遲天數: item.DelayDay,
        })),
      );
    }
  } catch (error) {
    console.log("❌ 基本查詢失敗:", error.message);
  }

  // 測試案例 2: 指定 OnGoing 狀態
  console.log("\n--- 測試案例 2: 指定 OnGoing 狀態 ---");
  try {
    const result2 = await milService.getMILList(
      {},
      1,
      10,
      "RecordDate",
      "OnGoing",
    );

    console.log("✅ OnGoing 狀態查詢成功");
    console.log(`📊 查詢結果: ${result2.count} 筆記錄`);
    console.log(`🔄 狀態篩選: ${result2.status}`);
  } catch (error) {
    console.log("❌ OnGoing 狀態查詢失敗:", error.message);
  }

  // 測試案例 3: 指定 Closed 狀態
  console.log("\n--- 測試案例 3: 指定 Closed 狀態 ---");
  try {
    const result3 = await milService.getMILList(
      {},
      1,
      10,
      "RecordDate",
      "Closed",
    );

    console.log("✅ Closed 狀態查詢成功");
    console.log(`📊 查詢結果: ${result3.count} 筆記錄`);
    console.log(`🔄 狀態篩選: ${result3.status}`);
  } catch (error) {
    console.log("❌ Closed 狀態查詢失敗:", error.message);
  }

  // 測試案例 4: 複合條件查詢
  console.log("\n--- 測試案例 4: 複合條件查詢 ---");
  try {
    const complexFilters = {
      importance: "高",
      // 可以添加更多篩選條件
    };

    const result4 = await milService.getMILList(
      complexFilters,
      1,
      5,
      "RecordDate",
      "OnGoing",
    );

    console.log("✅ 複合條件查詢成功");
    console.log(`📊 查詢結果: ${result4.count} 筆記錄`);
    console.log(`🔍 篩選條件:`, complexFilters);
    console.log(`🔄 狀態篩選: ${result4.status}`);

    if (result4.data && result4.data.length > 0) {
      console.log("\n符合條件的資料:");
      result4.data.forEach((item, index) => {
        console.log(
          `${index + 1}. ${item.SerialNumber} - ${item.TypeName} (重要度: ${item.Importance})`,
        );
      });
    }
  } catch (error) {
    console.log("❌ 複合條件查詢失敗:", error.message);
  }

  // 測試案例 5: 分頁測試
  console.log("\n--- 測試案例 5: 分頁測試 ---");
  try {
    const result5 = await milService.getMILList({}, 2, 3); // 第2頁，每頁3筆

    console.log("✅ 分頁查詢成功");
    console.log(`📊 查詢結果: ${result5.count} 筆記錄`);
    console.log(`📄 當前頁數: ${result5.currentPage}`);
    console.log(`📄 總頁數: ${result5.totalPages}`);
    console.log(`📄 每頁筆數: ${result5.limit}`);
  } catch (error) {
    console.log("❌ 分頁查詢失敗:", error.message);
  }

  // 測試案例 6: 邊界條件測試
  console.log("\n--- 測試案例 6: 邊界條件測試 ---");
  try {
    // 空的篩選條件
    const result6a = await milService.getMILList({});
    console.log(`✅ 空篩選條件: ${result6a.count} 筆記錄`);

    // 大頁數測試
    const result6b = await milService.getMILList({}, 1, 100);
    console.log(`✅ 大頁數測試: ${result6b.count} 筆記錄`);

    // 小頁數測試
    const result6c = await milService.getMILList({}, 1, 1);
    console.log(`✅ 小頁數測試: ${result6c.count} 筆記錄`);
  } catch (error) {
    console.log("❌ 邊界條件測試失敗:", error.message);
  }

  // 測試案例 7: 效能測試
  console.log("\n--- 測試案例 7: 效能測試 ---");
  try {
    const startTime = Date.now();
    const result7 = await milService.getMILList({}, 1, 50);
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log("✅ 效能測試完成");
    console.log(`⏱️ 執行時間: ${executionTime}ms`);
    console.log(`📊 查詢結果: ${result7.count} 筆記錄`);

    if (executionTime > 2000) {
      console.log("⚠️ 警告: 查詢時間超過 2 秒，可能需要優化");
    } else {
      console.log("✅ 查詢效能良好");
    }
  } catch (error) {
    console.log("❌ 效能測試失敗:", error.message);
  }

  console.log("\n🎯 getMILList 測試總結:");
  console.log("- 基本功能測試完成");
  console.log("- 狀態篩選功能測試完成");
  console.log("- 分頁功能測試完成");
  console.log("- 邊界條件測試完成");
  console.log("- 效能測試完成");
}
