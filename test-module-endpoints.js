#!/usr/bin/env node
/**
 * 測試模組化工具列表端點
 * 測試新增的 GET /api/{module}/tools 端點功能
 */

import http from "http";

const BASE_URL = "http://localhost:8080";

// 顏色輸出函數
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP GET 請求函數
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ ok: res.statusCode === 200, json: () => jsonData });
          } catch (error) {
            reject(new Error("Invalid JSON response"));
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

// 測試單一端點
async function testEndpoint(url, description) {
  try {
    const response = await httpGet(url);
    const data = response.json();

    if (response.ok && data.tools && Array.isArray(data.tools)) {
      log("green", `✅ ${description}`);
      console.log(`   模組: ${data.module}`);
      console.log(`   工具數量: ${data.count}`);
      console.log(`   工具列表: ${data.tools.map((t) => t.name).join(", ")}`);
      return true;
    } else {
      log("red", `❌ ${description}`);
      console.log(`   錯誤: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    log("red", `❌ ${description}`);
    console.log(`   網路錯誤: ${error.message}`);
    return false;
  }
}

// 主要測試函數
async function runTests() {
  log("blue", "\n🧪 測試模組化工具列表端點...\n");

  const tests = [
    {
      url: `${BASE_URL}/api/hr/tools`,
      description: "HR 模組工具列表",
    },
    {
      url: `${BASE_URL}/api/finance/tools`,
      description: "Finance 模組工具列表",
    },
    {
      url: `${BASE_URL}/api/tasks/tools`,
      description: "Tasks 模組工具列表",
    },
  ];

  let successCount = 0;

  for (const test of tests) {
    const success = await testEndpoint(test.url, test.description);
    if (success) successCount++;
    console.log(); // 空行分隔
  }

  // 總結
  log("blue", "📊 測試結果總結:");
  console.log(`   成功: ${successCount}/${tests.length}`);

  if (successCount === tests.length) {
    log("green", "🎉 所有測試通過！");
  } else {
    log("red", "⚠️  部分測試失敗");
    process.exit(1);
  }

  // 額外驗證：檢查工具總數
  log("blue", "\n🔍 驗證工具總數...");
  try {
    const [hrResponse, financeResponse, tasksResponse, allToolsResponse] =
      await Promise.all([
        httpGet(`${BASE_URL}/api/hr/tools`),
        httpGet(`${BASE_URL}/api/finance/tools`),
        httpGet(`${BASE_URL}/api/tasks/tools`),
        httpGet(`${BASE_URL}/tools`),
      ]);

    const hrData = hrResponse.json();
    const financeData = financeResponse.json();
    const tasksData = tasksResponse.json();
    const allToolsData = allToolsResponse.json();

    const moduleToolsCount = hrData.count + financeData.count + tasksData.count;
    const totalToolsCount = allToolsData.count;

    console.log(`   HR 工具: ${hrData.count}`);
    console.log(`   Finance 工具: ${financeData.count}`);
    console.log(`   Tasks 工具: ${tasksData.count}`);
    console.log(`   模組工具總計: ${moduleToolsCount}`);
    console.log(`   全部工具總計: ${totalToolsCount}`);

    if (moduleToolsCount === totalToolsCount) {
      log("green", "✅ 工具數量驗證通過！");
    } else {
      log("red", "❌ 工具數量不匹配！");
      process.exit(1);
    }
  } catch (error) {
    log("red", `❌ 工具數量驗證失敗: ${error.message}`);
    process.exit(1);
  }
}

// 檢查服務器是否運行
async function checkServer() {
  try {
    const response = await httpGet(`${BASE_URL}/health`);
    if (response.ok) {
      log("green", "✅ MCP 服務器運行中");
      return true;
    }
  } catch (error) {
    log("red", "❌ MCP 服務器未運行，請先啟動服務器");
    log("yellow", "   啟動命令: npm start");
    return false;
  }
}

// 執行測試
async function main() {
  log("blue", "🚀 開始測試模組化端點...");

  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await runTests();
  log("green", "\n🎯 測試完成！");
}

main().catch((error) => {
  log("red", `❌ 測試過程發生錯誤: ${error.message}`);
  process.exit(1);
});
