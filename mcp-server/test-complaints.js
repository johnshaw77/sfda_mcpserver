/**
 * 客訴管理工具測試腳本
 *
 * 測試客訴管理相關的工具功能
 */

import databaseService from "./src/services/database.js";
import complaintsService from "./src/services/complaints/complaints-service.js";
import { GetComplaintsListTool } from "./src/tools/complaints/get-complaints-list.js";
import { GetComplaintDetailTool } from "./src/tools/complaints/get-complaint-detail.js";
import { GetComplaintsStatisticsTool } from "./src/tools/complaints/get-complaints-statistics.js";
import config from "./src/config/config.js";

class ComplaintsTestRunner {
  constructor() {
    this.tools = {
      list: new GetComplaintsListTool(),
      detail: new GetComplaintDetailTool(),
      statistics: new GetComplaintsStatisticsTool(),
    };
  }

  async init() {
    console.log("📊 客訴管理工具測試開始\n");

    console.log("🔗 初始化資料庫連接...");
    // 設定資料庫連接資訊
    databaseService.setConfig({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
    });
    console.log("   連接資訊:", {
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      database: config.dbName,
    });
    try {
      // 初始化資料庫連接
      await databaseService.initialize();
      console.log("✅ 資料庫連接成功");
    } catch (error) {
      console.error("❌ 資料庫連接失敗:", error.message);
      throw error;
    }
  }

  async testDatabaseConnection() {
    console.log("\n🔧 測試資料庫連接...");

    try {
      const testQuery = "SELECT COUNT(*) as total FROM qms_voc_detail LIMIT 1";
      const result = await databaseService.query("qms", testQuery);
      console.log("✅ 資料庫查詢成功");
      console.log(`   資料表存在且可正常查詢`);
      return true;
    } catch (error) {
      console.error("❌ 資料庫連接測試失敗:", error.message);
      return false;
    }
  }

  async testComplaintsService() {
    console.log("\n🔧 測試客訴服務層...");

    try {
      // 測試客訴列表查詢
      console.log("   測試客訴列表查詢...");
      const complaints = await complaintsService.getComplaintsList({
        limit: 5,
      });
      console.log(`   ✅ 取得 ${complaints.length} 筆客訴記錄`);

      if (complaints.length > 0) {
        // 測試客訴詳情查詢
        console.log("   測試客訴詳情查詢...");
        const firstComplaint = complaints[0];
        const detail = await complaintsService.getComplaintById(
          firstComplaint.id,
        );
        console.log(`   ✅ 取得客訴詳情: ${detail.voc_no}`);

        // 測試根據編號查詢
        console.log("   測試根據編號查詢...");
        const detailByVocNo = await complaintsService.getComplaintByVocNo(
          detail.voc_no,
        );
        console.log(`   ✅ 根據編號查詢成功: ${detailByVocNo.customer_name}`);
      }

      // 測試統計查詢
      console.log("   測試統計查詢...");
      const statistics = await complaintsService.getComplaintsStatistics();
      console.log(`   ✅ 統計查詢成功:`);
      console.log(`      狀態分佈: ${statistics.byStatus.length} 種`);
      console.log(`      優先級分佈: ${statistics.byPriority.length} 種`);
      console.log(`      類型分佈: ${statistics.byType.length} 種`);

      return true;
    } catch (error) {
      console.error("❌ 客訴服務層測試失敗:", error.message);
      return false;
    }
  }

  async testTools() {
    console.log("\n🔧 測試 MCP 工具...");

    try {
      // 測試客訴列表工具
      console.log("   測試客訴列表工具...");
      const listResult = await this.tools.list._execute({ limit: 3 });
      console.log("   ✅ 客訴列表工具測試成功");
      console.log(`      回應長度: ${listResult.content[0].text.length} 字元`);

      // 測試統計工具
      console.log("   測試統計工具...");
      const statsResult = await this.tools.statistics._execute({});
      console.log("   ✅ 統計工具測試成功");
      console.log(`      回應長度: ${statsResult.content[0].text.length} 字元`);

      // 測試詳情工具（如果有資料的話）
      const complaints = await complaintsService.getComplaintsList({
        limit: 1,
      });
      if (complaints.length > 0) {
        console.log("   測試客訴詳情工具...");
        const detailResult = await this.tools.detail._execute({
          id: complaints[0].id.toString(),
        });
        console.log("   ✅ 客訴詳情工具測試成功");
        console.log(
          `      回應長度: ${detailResult.content[0].text.length} 字元`,
        );
      }

      return true;
    } catch (error) {
      console.error("❌ MCP 工具測試失敗:", error.message);
      return false;
    }
  }

  async testErrorHandling() {
    console.log("\n🔧 測試錯誤處理...");

    try {
      // 測試無效 ID
      console.log("   測試無效客訴 ID...");
      try {
        await this.tools.detail._execute({ id: "999999" });
        console.log("   ❌ 應該拋出錯誤但沒有");
        return false;
      } catch (error) {
        console.log("   ✅ 正確處理無效 ID 錯誤");
      }

      // 測試無效日期格式
      console.log("   測試無效日期格式...");
      try {
        await this.tools.list._execute({ startDate: "invalid-date" });
        console.log("   ❌ 應該拋出錯誤但沒有");
        return false;
      } catch (error) {
        console.log("   ✅ 正確處理無效日期格式錯誤");
      }

      return true;
    } catch (error) {
      console.error("❌ 錯誤處理測試失敗:", error.message);
      return false;
    }
  }

  async runAllTests() {
    await this.init();

    const tests = [
      { name: "資料庫連接", fn: () => this.testDatabaseConnection() },
      { name: "客訴服務層", fn: () => this.testComplaintsService() },
      { name: "MCP 工具", fn: () => this.testTools() },
      { name: "錯誤處理", fn: () => this.testErrorHandling() },
    ];

    const results = [];

    for (const test of tests) {
      try {
        const success = await test.fn();
        results.push({ name: test.name, success });
      } catch (error) {
        console.error(`❌ ${test.name} 測試異常:`, error.message);
        results.push({ name: test.name, success: false, error: error.message });
      }
    }

    // 顯示測試總結
    console.log("\n" + "=".repeat(50));
    console.log("📊 測試結果總結");
    console.log("=".repeat(50));

    let passCount = 0;
    results.forEach(result => {
      const status = result.success ? "✅ 通過" : "❌ 失敗";
      console.log(`${status} ${result.name}`);
      if (result.error) {
        console.log(`       錯誤: ${result.error}`);
      }
      if (result.success) passCount++;
    });

    console.log("=".repeat(50));
    console.log(`總計: ${passCount}/${results.length} 個測試通過`);

    if (passCount === results.length) {
      console.log("🎉 所有測試通過！客訴管理工具準備就緒。");
    } else {
      console.log("⚠️  部分測試失敗，請檢查相關設定。");
    }

    // 關閉資料庫連接
    await databaseService.close();
  }
}

// 執行測試
const testRunner = new ComplaintsTestRunner();
testRunner.runAllTests().catch(console.error);
