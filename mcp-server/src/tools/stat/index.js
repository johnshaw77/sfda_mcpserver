/**
 * 統計分析工具註冊
 *
 * 註冊所有統計相關的 MCP 工具
 */

import { PerformTTestTool } from "./perform-ttest.js";
import { AnalyzeDataTool } from "./analyze-data.js";
import { PerformChiSquareTool } from "./perform-chisquare.js";

// Stat 模組名稱
export const MODULE_NAME = "stat";

// Stat 模組元數據
export const moduleInfo = {
  name: "統計分析工具",
  description: "提供各種統計假設檢定和數據分析功能",
  endpoint: "/api/stat",
  icon: "chart-bar",
};

// 創建工具實例並設定模組（與 MIL 一致的方式）
const createTool = Tool => {
  const tool = new Tool();
  tool.moduleName = MODULE_NAME;
  return tool;
};

// 導出所有統計工具
export const statTools = [
  createTool(PerformTTestTool),
  createTool(AnalyzeDataTool),
  createTool(PerformChiSquareTool),
];

// 註冊所有統計工具的函數 (與 HR/MIL 一致的方式)
export function registerStatTools(toolMgr) {
  statTools.forEach(tool => {
    toolMgr.registerTool(tool);
  });
}

// 預設導出工具集合
export default statTools;
