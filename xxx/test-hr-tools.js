/**
 * HR 工具測試腳本
 *
 * 提供一個簡單的命令行介面用於測試 HR 工具功能
 * 使用方法:
 *   node test-hr-tools.js get_employee_info --employeeId=A116592
 *   node test-hr-tools.js get_employee_list --department=研發部 --titleName=工程師 --limit=5
 *   node test-hr-tools.js get_employee_id --name=張 --limit=3
 */

import { ToolManager } from "./src/tools/tool-manager.js";
import { registerHRTools } from "./src/tools/hr/index.js";

// 解析命令行參數
const args = process.argv.slice(2);
const toolName = args[0];

// 解析工具參數
const params = {};
args.slice(1).forEach(arg => {
  if (arg.startsWith("--")) {
    const [key, value] = arg.slice(2).split("=");

    // 處理特殊類型
    if (value === "true") params[key] = true;
    else if (value === "false") params[key] = false;
    else if (!isNaN(Number(value))) params[key] = Number(value);
    else params[key] = value;
  }
});

// 初始化工具管理器
async function runTest() {
  try {
    console.log("初始化工具管理器...");
    const toolManager = new ToolManager();

    // 註冊 HR 工具
    console.log("註冊 HR 工具...");
    registerHRTools(toolManager);

    // 檢查工具是否存在
    if (!toolName) {
      console.error("錯誤: 請指定要測試的工具名稱");
      console.log(
        "可用工具: ",
        toolManager.getRegisteredToolNames().join(", "),
      );
      process.exit(1);
    }

    if (!toolManager.hasToolByName(toolName)) {
      console.error(`錯誤: 工具 "${toolName}" 不存在`);
      console.log(
        "可用工具: ",
        toolManager.getRegisteredToolNames().join(", "),
      );
      process.exit(1);
    }

    // 執行工具
    console.log(`執行工具 "${toolName}" 參數:`, params);
    const result = await toolManager.executeTool(toolName, params);

    // 輸出結果
    console.log("\n== 執行結果 ==");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("執行錯誤:", error.message);
    if (error.details) {
      console.error("錯誤詳情:", error.details);
    }
    if (error.stack) {
      console.error("堆疊追蹤:", error.stack);
    }
  } finally {
    process.exit(0);
  }
}

// 執行測試
runTest();
