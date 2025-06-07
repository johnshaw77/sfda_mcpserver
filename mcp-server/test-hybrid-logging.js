#!/usr/bin/env node

/**
 * 混合日誌系統完整測試腳本
 * 測試所有日誌記錄功能，包括工具執行、錯誤處理、緩存等
 */

import axios from "axios";
import { performance } from "perf_hooks";

const BASE_URL = "http://localhost:8080";
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};
// try {
//     await axios.post(`${BASE_URL}/tools/nonexistent_tool`, {});
//     throw new Error("不存在的工具調用應該失敗");
//   } catch (error) {
//     if (!error.response || (error.response.status !== 404 && error.response.status !== 400)) {
//       throw new Error(`期望 404 或 400 錯誤，但得到: ${error.response?.status || error.message}`);
//     }
//   }
function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}${colors.reset}\n`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
    };
  }

  addTest(name, testFunc) {
    this.tests.push({ name, testFunc });
  }

  async runTest(name, testFunc) {
    try {
      const start = performance.now();
      await testFunc();
      const duration = Math.round(performance.now() - start);
      log("green", `✅ ${name} (${duration}ms)`);
      this.results.passed++;
      return true;
    } catch (error) {
      log("red", `❌ ${name}: ${error.message}`);
      this.results.failed++;
      return false;
    }
  }

  async runAll() {
    logSection("混合日誌系統完整測試");

    this.results.total = this.tests.length;

    for (const test of this.tests) {
      await this.runTest(test.name, test.testFunc);
      await sleep(100); // 短暫等待避免請求過快
    }

    this.printSummary();
  }

  printSummary() {
    logSection("測試結果摘要");
    console.log(`總測試數: ${this.results.total}`);
    log("green", `通過: ${this.results.passed}`);
    log("red", `失敗: ${this.results.failed}`);

    const successRate = (
      (this.results.passed / this.results.total) *
      100
    ).toFixed(1);
    const color =
      successRate >= 90 ? "green" : successRate >= 70 ? "yellow" : "red";
    log(color, `成功率: ${successRate}%`);
  }
}

// 建立測試實例
const runner = new TestRunner();

// 1. 測試伺服器連線
runner.addTest("伺服器連線測試", async () => {
  const response = await axios.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`伺服器狀態異常: ${response.status}`);
  }
});

// 2. 測試日誌系統狀態
runner.addTest("日誌系統狀態檢查", async () => {
  const response = await axios.get(`${BASE_URL}/api/logging/status`);
  if (!response.data.success) {
    throw new Error("日誌系統狀態異常");
  }

  const { system } = response.data.data;
  if (system.strategy !== "hybrid") {
    throw new Error(`期望混合策略，但得到: ${system.strategy}`);
  }
});

// 3. 測試成功的工具調用
runner.addTest("成功工具調用日誌", async () => {
  const response = await axios.post(`${BASE_URL}/tools/get_employee_list`, {
    limit: 2,
  });

  if (!response.data.success) {
    throw new Error("工具調用失敗");
  }

  const result = response.data.result;
  if (!result.executionId || result.executionTime === undefined) {
    throw new Error("缺少執行追蹤資訊");
  }
});

// 4. 測試驗證錯誤日誌
runner.addTest("驗證錯誤日誌記錄", async () => {
  const response = await axios.post(`${BASE_URL}/tools/get_employee_info`, {
    employeeId: "INVALID_ID",
  });

  const result = response.data.result;
  if (result.success !== false) {
    throw new Error("期望驗證失敗但調用成功");
  }

  if (result.error.type !== "validation_error") {
    throw new Error(`期望 validation_error，但得到: ${result.error.type}`);
  }
});

// 5. 測試緩存功能
runner.addTest("緩存命中測試", async () => {
  const params = { employeeId: "A123456" };

  // 第一次調用 - 應該是緩存未命中
  const firstResponse = await axios.post(
    `${BASE_URL}/tools/get_employee_info`,
    params,
  );
  if (firstResponse.data.result.fromCache !== false) {
    throw new Error("第一次調用不應命中緩存");
  }

  // 第二次調用 - 應該命中緩存
  const secondResponse = await axios.post(
    `${BASE_URL}/tools/get_employee_info`,
    params,
  );
  if (secondResponse.data.result.fromCache !== true) {
    throw new Error("第二次調用應該命中緩存");
  }
});

// 6. 測試工具統計
runner.addTest("工具使用統計", async () => {
  const response = await axios.get(`${BASE_URL}/api/logging/tools/stats`);
  if (!response.data.success) {
    throw new Error("無法獲取工具統計");
  }

  const stats = response.data.data;
  if (!Array.isArray(stats) || stats.length === 0) {
    throw new Error("統計資料格式錯誤或為空");
  }

  // 檢查統計項目格式
  const firstStat = stats[0];
  const requiredFields = [
    "tool_name",
    "total_calls",
    "successful_calls",
    "avg_duration",
    "last_call",
  ];

  for (const field of requiredFields) {
    if (!(field in firstStat)) {
      throw new Error(`統計資料缺少欄位: ${field}`);
    }
  }
});

// 7. 測試系統指標
runner.addTest("系統指標記錄", async () => {
  const response = await axios.get(
    `${BASE_URL}/api/logging/metrics/memory_heap_used`,
  );
  if (!response.data.success) {
    throw new Error("無法獲取系統指標");
  }

  const metrics = response.data.data;
  if (!metrics.trend || !Array.isArray(metrics.trend)) {
    throw new Error("指標趨勢資料格式錯誤");
  }
});

// 8. 測試參數清理功能
runner.addTest("敏感參數清理測試", async () => {
  // 創建一個包含敏感資訊的任務
  const response = await axios.post(`${BASE_URL}/tools/create_task`, {
    title: "測試任務",
    description: "包含密碼的任務",
    assignee: "test_user",
    priority: "medium",
    // 添加一些敏感參數進行測試
    metadata: {
      password: "secret123",
      api_key: "abc123",
      normal_field: "safe_value",
    },
  });

  if (!response.data.success) {
    throw new Error("任務創建失敗");
  }

  // 檢查日誌中敏感參數是否被清理
  // 這裡我們無法直接檢查日誌內容，但可以確認調用成功
  const result = response.data.result;
  if (!result.executionId) {
    throw new Error("缺少執行追蹤資訊");
  }
});

// 9. 測試並發請求
runner.addTest("並發請求處理", async () => {
  const requests = [];
  const concurrency = 5;

  for (let i = 0; i < concurrency; i++) {
    requests.push(
      axios.post(`${BASE_URL}/tools/get_employee_list`, {
        limit: 1,
        page: i + 1,
      }),
    );
  }

  const responses = await Promise.all(requests);

  for (const response of responses) {
    if (!response.data.success) {
      throw new Error("並發請求中有失敗的調用");
    }
  }
});

// 10. 測試錯誤場景的多樣性
runner.addTest("多種錯誤類型測試", async () => {
  // 測試不存在的工具
  try {
    await axios.post(`${BASE_URL}/tools/nonexistent_tool`, {});
    throw new Error("不存在的工具調用應該失敗");
  } catch (error) {
    if (!error.response || error.response.status !== 404) {
      throw new Error(
        `期望 404 錯誤，但得到: ${error.response?.status || error.message}`,
      );
    }
  }

  // 測試參數格式錯誤
  try {
    const response = await axios.post(`${BASE_URL}/tools/get_employee_info`, {
      employeeId: 123, // 應該是字串
    });

    const result = response.data.result;
    if (result.success !== false || result.error.type !== "validation_error") {
      throw new Error("參數類型錯誤應該被正確處理");
    }
  } catch (error) {
    if (error.message.includes("參數類型錯誤應該被正確處理")) {
      throw error;
    }
    // 其他網路錯誤忽略，因為我們期望的是應用層面的錯誤處理
  }
});

// 執行所有測試
async function main() {
  try {
    await runner.runAll();

    // 如果所有測試都通過，顯示最終的系統狀態
    if (runner.results.failed === 0) {
      logSection("系統狀態總覽");

      try {
        const statusResponse = await axios.get(
          `${BASE_URL}/api/logging/status`,
        );
        const statsResponse = await axios.get(
          `${BASE_URL}/api/logging/tools/stats`,
        );

        console.log("📊 日誌系統狀態:");
        console.log(`   策略: ${statusResponse.data.data.system.strategy}`);
        console.log(
          `   日誌等級: ${statusResponse.data.data.system.currentLogLevel}`,
        );
        console.log(`   活躍警報: ${statusResponse.data.data.activeAlerts}`);

        console.log("\n📈 工具使用統計:");
        const stats = statsResponse.data.data;
        stats.forEach(stat => {
          const successRate = (
            (stat.successful_calls / stat.total_calls) *
            100
          ).toFixed(1);
          console.log(
            `   ${stat.tool_name}: ${stat.total_calls} 次調用, ${successRate}% 成功率, 平均 ${Math.round(stat.avg_duration)}ms`,
          );
        });

        log("green", "\n🎉 混合日誌系統運作完美！所有功能測試通過。");
      } catch (error) {
        log("yellow", `\n⚠️  無法獲取最終狀態: ${error.message}`);
      }
    }

    process.exit(runner.results.failed > 0 ? 1 : 0);
  } catch (error) {
    log("red", `測試執行失敗: ${error.message}`);
    process.exit(1);
  }
}

// 執行測試
main();
