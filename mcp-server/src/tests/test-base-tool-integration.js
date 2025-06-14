/**
 * base-tool 整合測試腳本
 *
 * 用於測試 base-tool 與統一日誌系統的整合
 */

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 動態導入所需模組
async function runTest() {
  try {
    console.log("導入 BaseTool 類...");
    const { BaseTool, ToolExecutionError, ToolErrorType } = await import(
      "../tools/base-tool.js"
    );

    // 創建測試工具
    class TestTool extends BaseTool {
      constructor() {
        super("test-tool", "測試工具", {
          type: "object",
          properties: {
            message: { type: "string" },
          },
          required: ["message"],
        });
      }

      async _execute(params) {
        console.log(`執行測試工具，參數: ${params.message}`);
        return { result: `處理完成: ${params.message}` };
      }
    }

    // 實例化並執行工具
    console.log("創建測試工具實例...");
    const testTool = new TestTool();

    console.log("執行測試工具...");
    const result = await testTool.execute(
      { message: "測試日誌整合" },
      { sessionId: "test-session", userId: "test-user" },
    );

    console.log("執行結果:", result);
    console.log("✅ BaseTool 與日誌系統整合測試成功");
  } catch (error) {
    console.error("測試失敗:", error);
    process.exit(1);
  }
}

runTest();
