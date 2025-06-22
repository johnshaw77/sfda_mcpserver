/**
 * getMILDetails 功能測試案例
 */

import milService from "../../mil-service.js";

export async function testGetMILDetails() {
  console.log("\n🔍 測試: getMILDetails - 獲取 MIL 詳情");

  // 首先獲取一些有效的 SerialNumber 來測試
  let validSerialNumbers = [];

  try {
    console.log("\n--- 準備測試資料 ---");
    const listResult = await milService.getMILList({}, 1, 5);

    if (listResult.data && listResult.data.length > 0) {
      validSerialNumbers = listResult.data.map(item => item.SerialNumber);
      console.log(`✅ 獲得 ${validSerialNumbers.length} 個有效的編號進行測試`);
      console.log("測試編號:", validSerialNumbers);
    } else {
      console.log("⚠️ 無法獲得測試資料，將跳過部分測試");
    }
  } catch (error) {
    console.log("❌ 準備測試資料失敗:", error.message);
  }

  // 測試案例 1: 正常查詢
  if (validSerialNumbers.length > 0) {
    console.log("\n--- 測試案例 1: 正常查詢 ---");
    try {
      const testSerialNumber = validSerialNumbers[0];
      console.log(`🔍 查詢編號: ${testSerialNumber}`);

      const result1 = await milService.getMILDetails(testSerialNumber);

      console.log("✅ 正常查詢成功");
      console.log(`📅 查詢時間: ${result1.timestamp}`);

      // 顯示詳細資料
      if (result1.data) {
        console.log("\n📋 MIL 詳細資料:");
        console.log("=".repeat(40));
        console.log(`編號: ${result1.data.SerialNumber}`);
        console.log(`類型: ${result1.data.TypeName}`);
        console.log(`中類型: ${result1.data.MidTypeName || "無"}`);
        console.log(`狀態: ${result1.data.Status}`);
        console.log(`重要度: ${result1.data.Importance}`);
        console.log(`延遲天數: ${result1.data.DelayDay}`);
        console.log(`提案廠別: ${result1.data.ProposalFactory}`);
        console.log(
          `提出人: ${result1.data.Proposer_Name} (${result1.data.Proposer_EmpNo})`,
        );
        console.log(`提出部門: ${result1.data.Proposer_Dept}`);
        console.log(
          `DRI: ${result1.data.DRI_EmpName || "未指定"} (${result1.data.DRI_EmpNo || "無"})`,
        );
        console.log(`DRI 部門: ${result1.data.DRI_Dept || "無"}`);
        console.log(`記錄日期: ${result1.data.RecordDate}`);
        console.log(`計劃完成日期: ${result1.data.PlanFinishDate || "無"}`);
        console.log(
          `實際完成日期: ${result1.data.ActualFinishDate || "未完成"}`,
        );
        console.log(`問題描述: ${result1.data.IssueDiscription || "無"}`);
        console.log(`解決方案: ${result1.data.Solution || "無"}`);
        console.log(`備註: ${result1.data.Remark || "無"}`);
        console.log("=".repeat(40));
      }
    } catch (error) {
      console.log("❌ 正常查詢失敗:", error.message);
    }
  }

  // 測試案例 2: 查詢多個不同的記錄
  if (validSerialNumbers.length > 1) {
    console.log("\n--- 測試案例 2: 查詢多個記錄 ---");

    const testCount = Math.min(3, validSerialNumbers.length);
    console.log(`🔍 將測試 ${testCount} 個不同的記錄`);

    for (let i = 0; i < testCount; i++) {
      try {
        const testSerialNumber = validSerialNumbers[i];
        console.log(`\n測試 ${i + 1}/${testCount}: ${testSerialNumber}`);

        const result = await milService.getMILDetails(testSerialNumber);

        console.log(
          `✅ 查詢成功 - ${result.data.TypeName} (${result.data.Status})`,
        );

        // 簡要顯示關鍵資訊
        console.log(
          `  └─ 提出人: ${result.data.Proposer_Name}, 重要度: ${result.data.Importance}`,
        );
      } catch (error) {
        console.log(`❌ 測試 ${i + 1} 失敗:`, error.message);
      }
    }
  }

  // 測試案例 3: 無效編號測試
  console.log("\n--- 測試案例 3: 無效編號測試 ---");

  const invalidSerialNumbers = [
    "INVALID_001",
    "NOT_EXIST_123",
    "",
    null,
    undefined,
  ];

  for (const invalidSerial of invalidSerialNumbers) {
    try {
      console.log(`\n🔍 測試無效編號: ${invalidSerial || "空值"}`);

      const result3 = await milService.getMILDetails(invalidSerial);

      // 如果沒有拋出錯誤，表示有問題
      console.log("⚠️ 警告: 無效編號應該要拋出錯誤，但卻成功了");
    } catch (error) {
      console.log(`✅ 正確處理無效編號: ${error.message}`);
    }
  }

  // 測試案例 4: 效能測試
  if (validSerialNumbers.length > 0) {
    console.log("\n--- 測試案例 4: 效能測試 ---");

    const testSerialNumber = validSerialNumbers[0];
    const iterations = 5;
    const executionTimes = [];

    console.log(`🔍 對編號 ${testSerialNumber} 執行 ${iterations} 次查詢`);

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = Date.now();
        await milService.getMILDetails(testSerialNumber);
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        executionTimes.push(executionTime);
        console.log(`  第 ${i + 1} 次: ${executionTime}ms`);
      } catch (error) {
        console.log(`❌ 第 ${i + 1} 次查詢失敗:`, error.message);
      }
    }

    if (executionTimes.length > 0) {
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
    }
  }

  // 測試案例 5: 資料完整性驗證
  if (validSerialNumbers.length > 0) {
    console.log("\n--- 測試案例 5: 資料完整性驗證 ---");

    try {
      const testSerialNumber = validSerialNumbers[0];
      const result5 = await milService.getMILDetails(testSerialNumber);

      console.log(`🔍 驗證編號 ${testSerialNumber} 的資料完整性`);

      const data = result5.data;
      const requiredFields = [
        "SerialNumber",
        "TypeName",
        "Status",
        "RecordDate",
        "Proposer_Name",
        "Proposer_EmpNo",
      ];

      const missingFields = [];
      const emptyFields = [];

      requiredFields.forEach(field => {
        if (!(field in data)) {
          missingFields.push(field);
        } else if (!data[field] || data[field] === "") {
          emptyFields.push(field);
        }
      });

      if (missingFields.length === 0 && emptyFields.length === 0) {
        console.log("✅ 必要欄位完整性檢查通過");
      } else {
        if (missingFields.length > 0) {
          console.log("❌ 缺少欄位:", missingFields.join(", "));
        }
        if (emptyFields.length > 0) {
          console.log("⚠️ 空值欄位:", emptyFields.join(", "));
        }
      }

      // 檢查資料類型
      console.log("\n📋 資料類型檢查:");
      console.log(`  SerialNumber: ${typeof data.SerialNumber} ✅`);
      console.log(
        `  DelayDay: ${typeof data.DelayDay} ${typeof data.DelayDay === "number" ? "✅" : "⚠️"}`,
      );
      console.log(`  RecordDate: ${typeof data.RecordDate} ✅`);
    } catch (error) {
      console.log("❌ 資料完整性驗證失敗:", error.message);
    }
  }

  console.log("\n🎯 getMILDetails 測試總結:");
  console.log("- 正常查詢功能測試完成");
  console.log("- 多記錄查詢測試完成");
  console.log("- 錯誤處理測試完成");
  console.log("- 效能測試完成");
  console.log("- 資料完整性驗證完成");
}
