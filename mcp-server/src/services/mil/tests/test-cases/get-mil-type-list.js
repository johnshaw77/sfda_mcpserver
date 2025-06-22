/**
 * getMILTypeList 功能測試案例
 */

import milService from "../../mil-service.js";

export async function testGetMILTypeList() {
  console.log("\n📋 測試: getMILTypeList - 獲取 MIL 類型列表");

  // 測試案例 1: 基本類型列表查詢
  console.log("\n--- 測試案例 1: 基本類型列表查詢 ---");
  try {
    const result1 = await milService.getMILTypeList();

    console.log("✅ 類型列表查詢成功");
    console.log(`📅 查詢時間: ${result1.timestamp}`);
    console.log(`📊 類型數量: ${result1.data.length}`);

    if (result1.data && result1.data.length > 0) {
      console.log("\n📋 MIL 類型列表:");
      console.log("=".repeat(40));
      result1.data.forEach((typeName, index) => {
        console.log(`${(index + 1).toString().padStart(2, " ")}. ${typeName}`);
      });
      console.log("=".repeat(40));

      // 檢查是否有重複項目
      const uniqueTypes = [...new Set(result1.data)];
      if (uniqueTypes.length === result1.data.length) {
        console.log("✅ 無重複類型");
      } else {
        console.log(
          `⚠️ 發現重複類型: 原有 ${result1.data.length} 個，去重後 ${uniqueTypes.length} 個`,
        );
      }
    } else {
      console.log("⚠️ 沒有找到任何類型資料");
    }
  } catch (error) {
    console.log("❌ 類型列表查詢失敗:", error.message);
  }

  // 測試案例 2: 資料結構驗證
  console.log("\n--- 測試案例 2: 資料結構驗證 ---");
  try {
    const result2 = await milService.getMILTypeList();

    console.log("🔍 驗證回傳資料結構");

    // 檢查頂層結構
    const requiredFields = ["timestamp", "data"];
    const missingFields = requiredFields.filter(field => !(field in result2));

    if (missingFields.length === 0) {
      console.log("✅ 頂層資料結構正確");
    } else {
      console.log("❌ 缺少欄位:", missingFields.join(", "));
    }

    // 檢查 data 是否為陣列
    if (Array.isArray(result2.data)) {
      console.log("✅ data 欄位是陣列");

      // 檢查陣列內容
      if (result2.data.length > 0) {
        const allStrings = result2.data.every(item => typeof item === "string");
        if (allStrings) {
          console.log("✅ 所有類型名稱都是字串");
        } else {
          console.log("❌ 發現非字串類型的項目");
          result2.data.forEach((item, index) => {
            if (typeof item !== "string") {
              console.log(`  項目 ${index}: ${typeof item} - ${item}`);
            }
          });
        }

        // 檢查是否有空值
        const emptyItems = result2.data.filter(
          item => !item || item.trim() === "",
        );
        if (emptyItems.length === 0) {
          console.log("✅ 沒有空的類型名稱");
        } else {
          console.log(`⚠️ 發現 ${emptyItems.length} 個空的類型名稱`);
        }
      }
    } else {
      console.log("❌ data 欄位不是陣列");
    }
  } catch (error) {
    console.log("❌ 資料結構驗證失敗:", error.message);
  }

  // 測試案例 3: 與 getMILList 的一致性檢查
  console.log("\n--- 測試案例 3: 與 getMILList 的一致性檢查 ---");
  try {
    const typeListResult = await milService.getMILTypeList();
    const milListResult = await milService.getMILList({}, 1, 1000); // 獲取大量資料

    console.log("🔍 檢查類型列表與 MIL 列表的一致性");

    if (typeListResult.data && milListResult.data) {
      // 從 MIL 列表中提取所有類型
      const typesFromMilList = [
        ...new Set(milListResult.data.map(item => item.TypeName)),
      ];
      const typesFromTypeList = typeListResult.data;

      console.log(`📊 類型列表API返回: ${typesFromTypeList.length} 個類型`);
      console.log(`📊 MIL列表中發現: ${typesFromMilList.length} 個類型`);

      // 檢查類型列表是否包含MIL列表中的所有類型
      const missingInTypeList = typesFromMilList.filter(
        type => !typesFromTypeList.includes(type),
      );
      const extraInTypeList = typesFromTypeList.filter(
        type => !typesFromMilList.includes(type),
      );

      if (missingInTypeList.length === 0 && extraInTypeList.length === 0) {
        console.log("✅ 類型列表與 MIL 列表完全一致");
      } else {
        if (missingInTypeList.length > 0) {
          console.log(
            `⚠️ 類型列表中缺少 ${missingInTypeList.length} 個類型:`,
            missingInTypeList,
          );
        }
        if (extraInTypeList.length > 0) {
          console.log(
            `⚠️ 類型列表中多出 ${extraInTypeList.length} 個類型:`,
            extraInTypeList,
          );
        }
      }
    }
  } catch (error) {
    console.log("❌ 一致性檢查失敗:", error.message);
  }

  // 測試案例 4: 效能測試
  console.log("\n--- 測試案例 4: 效能測試 ---");
  try {
    const iterations = 5;
    const executionTimes = [];

    console.log(`🔍 執行 ${iterations} 次類型列表查詢`);

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await milService.getMILTypeList();
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

    if (avgTime > 1000) {
      console.log("⚠️ 警告: 平均查詢時間超過 1 秒，建議優化");
    } else {
      console.log("✅ 查詢效能良好");
    }
  } catch (error) {
    console.log("❌ 效能測試失敗:", error.message);
  }

  // 測試案例 5: 類型名稱內容分析
  console.log("\n--- 測試案例 5: 類型名稱內容分析 ---");
  try {
    const result5 = await milService.getMILTypeList();

    if (result5.data && result5.data.length > 0) {
      console.log("🔍 分析類型名稱內容");

      // 統計字串長度
      const lengths = result5.data.map(type => type.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const maxLength = Math.max(...lengths);
      const minLength = Math.min(...lengths);

      console.log("\n📊 類型名稱長度統計:");
      console.log(`  平均長度: ${avgLength.toFixed(2)} 字元`);
      console.log(`  最長: ${maxLength} 字元`);
      console.log(`  最短: ${minLength} 字元`);

      // 找出最長和最短的類型名稱
      const longestType = result5.data.find(type => type.length === maxLength);
      const shortestType = result5.data.find(type => type.length === minLength);

      console.log(`  最長類型: "${longestType}"`);
      console.log(`  最短類型: "${shortestType}"`);

      // 檢查特殊字元
      const withSpecialChars = result5.data.filter(type =>
        /[^\u4e00-\u9fff\u3400-\u4dbf\w\s]/.test(type),
      );
      if (withSpecialChars.length > 0) {
        console.log(
          `\n⚠️  發現包含特殊字元的類型 (${withSpecialChars.length} 個):`,
        );
        withSpecialChars.forEach(type => console.log(`  - "${type}"`));
      } else {
        console.log("\n✅ 所有類型名稱都是正常字元");
      }

      // 檢查是否有數字開頭的類型
      const startWithNumber = result5.data.filter(type => /^\d/.test(type));
      if (startWithNumber.length > 0) {
        console.log(
          `\n📊 數字開頭的類型 (${startWithNumber.length} 個):`,
          startWithNumber,
        );
      }

      // 顯示按字母排序的前5個和後5個
      const sortedTypes = [...result5.data].sort();
      console.log("\n📋 按字母排序:");
      console.log("  前5個:", sortedTypes.slice(0, 5));
      console.log("  後5個:", sortedTypes.slice(-5));
    }
  } catch (error) {
    console.log("❌ 類型名稱內容分析失敗:", error.message);
  }

  console.log("\n🎯 getMILTypeList 測試總結:");
  console.log("- 基本查詢功能測試完成");
  console.log("- 資料結構驗證完成");
  console.log("- 與 MIL 列表一致性檢查完成");
  console.log("- 效能測試完成");
  console.log("- 類型名稱內容分析完成");
}
