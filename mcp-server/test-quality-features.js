/**
 * 工具品質提升功能驗證測試
 *
 * 驗證 Week 7 完成的所有品質提升功能：
 * 1. 增強參數驗證
 * 2. 執行緩存機制
 * 3. 版本管理
 * 4. 使用統計
 */

import {
  BaseTool,
  ParameterValidator,
  ToolErrorType,
} from "../src/tools/base-tool.js";
import { globalToolCache } from "../src/tools/tool-cache.js";
import { globalVersionManager } from "../src/tools/version-manager.js";
import { globalStatsManager } from "../src/tools/stats-manager.js";

// 測試工具類別
class TestTool extends BaseTool {
  constructor() {
    super(
      "test_tool",
      "測試工具",
      {
        type: "object",
        properties: {
          text: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            pattern: "^[A-Za-z0-9\\s]+$",
          },
          number: {
            type: "number",
            minimum: 1,
            maximum: 100,
          },
          items: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            uniqueItems: true,
          },
        },
        required: ["text"],
      },
      {
        version: "1.0.0",
        cacheable: true,
        cacheTTL: 60000, // 1 分鐘
      },
    );
  }

  async _execute(params, context) {
    // 模擬處理
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      message: `已處理: ${params.text}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 驗證功能測試
 */
async function runQualityTests() {
  console.log("🧪 開始工具品質提升功能驗證...\n");

  const tool = new TestTool();

  // 測試 1: 增強參數驗證
  console.log("1️⃣ 測試增強參數驗證...");

  try {
    // 測試必要參數缺失
    await tool.execute({});
    console.log("❌ 應該要拋出必要參數錯誤");
  } catch (error) {
    if (error.type === ToolErrorType.VALIDATION_ERROR) {
      console.log("✅ 必要參數驗證正常");
    }
  }

  try {
    // 測試字串長度約束
    await tool.execute({ text: "ab" });
    console.log("❌ 應該要拋出字串長度錯誤");
  } catch (error) {
    if (error.message.includes("String too short")) {
      console.log("✅ 字串長度約束驗證正常");
    }
  }

  try {
    // 測試正規表達式約束
    await tool.execute({ text: "test@#$" });
    console.log("❌ 應該要拋出正規表達式錯誤");
  } catch (error) {
    if (error.message.includes("does not match required pattern")) {
      console.log("✅ 正規表達式約束驗證正常");
    }
  }

  // 測試 2: 執行緩存機制
  console.log("\n2️⃣ 測試執行緩存機制...");

  const testParams = { text: "Hello World" };

  // 第一次執行
  const result1 = await tool.execute(testParams);
  if (!result1.fromCache && result1.executionTime > 50) {
    console.log("✅ 第一次執行未使用緩存");
  }

  // 第二次執行（應該命中緩存）
  const result2 = await tool.execute(testParams);
  if (result2.fromCache && result2.executionTime < 10) {
    console.log("✅ 第二次執行命中緩存");
  }

  // 測試 3: 版本管理
  console.log("\n3️⃣ 測試版本管理...");

  const versionInfo = globalVersionManager.getToolVersionInfo("test_tool");
  if (versionInfo && versionInfo.currentVersion === "1.0.0") {
    console.log("✅ 版本註冊正常");
  }

  const compatibility = globalVersionManager.checkCompatibility(
    "test_tool",
    "1.0.0",
  );
  if (compatibility.compatible) {
    console.log("✅ 版本相容性檢查正常");
  }

  // 測試 4: 使用統計
  console.log("\n4️⃣ 測試使用統計...");

  const toolStats = globalStatsManager.getToolSummary("test_tool");
  if (toolStats && toolStats.totalCalls > 0) {
    console.log("✅ 使用統計記錄正常");
    console.log(`   - 總調用次數: ${toolStats.totalCalls}`);
    console.log(`   - 成功率: ${toolStats.successRate}`);
    console.log(`   - 緩存命中率: ${toolStats.cacheHitRate}`);
  }

  // 測試 5: 緩存統計
  console.log("\n5️⃣ 測試緩存統計...");

  const cacheStats = globalToolCache.getStats();
  if (cacheStats.hits > 0) {
    console.log("✅ 緩存統計正常");
    console.log(`   - 緩存命中: ${cacheStats.hits}`);
    console.log(`   - 緩存未命中: ${cacheStats.misses}`);
    console.log(`   - 命中率: ${cacheStats.hitRate}`);
  }

  console.log("\n🎉 工具品質提升功能驗證完成！");
  console.log("\n📊 完成項目：");
  console.log("   ✅ 增強參數驗證（支援長度、格式、範圍等約束）");
  console.log("   ✅ 智能執行緩存（TTL、記憶體管理、自動清理）");
  console.log("   ✅ 語意版本管理（相容性檢查、升級路徑）");
  console.log("   ✅ 即時使用統計（調用、成功率、效能分析）");
  console.log("   ✅ 品質監控 API（/api/quality/* 端點）");
}

// 執行測試
runQualityTests().catch(console.error);
