#!/usr/bin/env node

/**
 * MCP Server 手動測試腳本
 *
 * 這個腳本會測試 MCP 服務器的各項功能，包括：
 * - 健康狀態檢查
 * - MCP 協議初始化
 * - 工具列表查詢
 * - SSE 連接測試
 */

import fetch from "node-fetch";

const SERVER_URL = "http://localhost:8080";

// 測試配色
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log("blue", "\n📋 測試健康狀態檢查...");
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json();

    if (response.ok) {
      log("green", "✅ 健康狀態檢查通過");
      console.log("   狀態:", data.status);
      console.log("   時間戳:", data.timestamp);
      console.log("   MCP 協議狀態:", data.mcp);
      return true;
    } else {
      log("red", "❌ 健康狀態檢查失敗");
      return false;
    }
  } catch (error) {
    log("red", `❌ 健康狀態檢查錯誤: ${error.message}`);
    return false;
  }
}

async function testMcpInitialize() {
  log("blue", "\n🔄 測試 MCP 協議初始化...");
  try {
    const response = await fetch(`${SERVER_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {
            roots: { listChanged: true },
            sampling: {},
          },
          clientInfo: {
            name: "test-client",
            version: "1.0.0",
          },
        },
        id: 1,
      }),
    });

    const data = await response.json();

    if (response.ok && data.result) {
      log("green", "✅ MCP 協議初始化成功");
      console.log("   協議版本:", data.result.protocolVersion);
      console.log("   服務器資訊:", data.result.serverInfo);
      console.log(
        "   伺服器功能:",
        JSON.stringify(data.result.capabilities, null, 2),
      );
      return true;
    } else {
      log("red", "❌ MCP 協議初始化失敗");
      console.log("   回應:", data);
      return false;
    }
  } catch (error) {
    log("red", `❌ MCP 協議初始化錯誤: ${error.message}`);
    return false;
  }
}

async function testToolsList() {
  log("blue", "\n🛠️  測試工具列表查詢...");
  try {
    const response = await fetch(`${SERVER_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        params: {},
        id: 2,
      }),
    });

    const data = await response.json();

    if (response.ok && data.result) {
      log("green", "✅ 工具列表查詢成功");
      console.log("   可用工具數量:", data.result.tools.length);
      data.result.tools.forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name}: ${tool.description}`);
      });
      return true;
    } else {
      log("red", "❌ 工具列表查詢失敗");
      console.log("   回應:", data);
      return false;
    }
  } catch (error) {
    log("red", `❌ 工具列表查詢錯誤: ${error.message}`);
    return false;
  }
}

async function testToolsEndpoint() {
  log("blue", "\n🔧 測試工具端點...");
  try {
    const response = await fetch(`${SERVER_URL}/tools`);
    const data = await response.json();

    if (response.ok) {
      log("green", "✅ 工具端點測試成功");
      console.log("   可用工具:", data.tools.length, "個");
      return true;
    } else {
      log("red", "❌ 工具端點測試失敗");
      return false;
    }
  } catch (error) {
    log("red", `❌ 工具端點測試錯誤: ${error.message}`);
    return false;
  }
}

async function testResourcesList() {
  log("blue", "\n📁 測試資源列表查詢...");
  try {
    const response = await fetch(`${SERVER_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "resources/list",
        params: {},
        id: 3,
      }),
    });

    const data = await response.json();

    if (response.ok && data.result) {
      log("green", "✅ 資源列表查詢成功");
      console.log("   可用資源數量:", data.result.resources.length);
      return true;
    } else {
      log("red", "❌ 資源列表查詢失敗");
      console.log("   回應:", data);
      return false;
    }
  } catch (error) {
    log("red", `❌ 資源列表查詢錯誤: ${error.message}`);
    return false;
  }
}

async function testSseConnection() {
  log("blue", "\n📡 測試 SSE 連接...");
  try {
    const response = await fetch(`${SERVER_URL}/sse/stats`);
    const data = await response.json();

    if (response.ok) {
      log("green", "✅ SSE 統計端點測試成功");
      console.log("   活躍連接數:", data.activeConnections);
      console.log("   總連接數:", data.totalConnections);
      return true;
    } else {
      log("red", "❌ SSE 統計端點測試失敗");
      return false;
    }
  } catch (error) {
    log("red", `❌ SSE 統計端點測試錯誤: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log("yellow", "🚀 開始執行 MCP Server 功能測試");
  log("yellow", "=".repeat(50));

  const tests = [
    testHealthCheck,
    testMcpInitialize,
    testToolsList,
    testToolsEndpoint,
    testResourcesList,
    testSseConnection,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }

    // 等待一秒再執行下一個測試
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  log("yellow", "=".repeat(50));
  log("yellow", "📊 測試結果總結:");
  log("green", `✅ 通過: ${passed} 個測試`);

  if (failed > 0) {
    log("red", `❌ 失敗: ${failed} 個測試`);
  } else {
    log("green", "🎉 所有測試都通過了！");
  }

  log("yellow", "\n💡 提示: 確保 MCP Server 正在 http://localhost:8080 運行");
}

// 執行測試
runAllTests().catch(error => {
  log("red", `💥 測試執行時發生錯誤: ${error.message}`);
  process.exit(1);
});
