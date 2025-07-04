/**
 * 統計分析工具註冊
 *
 * 註冊所有統計相關的 MCP 工具
 */

import { PerformTTestTool } from "./perform-ttest.js";
import { AnalyzeDataTool } from "./analyze-data.js";
import { PerformChiSquareTool } from "./perform-chisquare.js";
import { PerformANOVATool } from "./perform-anova.js";
import { ParseCSVTTestTool } from "./parse-csv-ttest.js";
import { CreateChartTool } from "./create-chart.js";
import { CreateHistogramTool } from "./create-histogram.js";
import { CreateBoxplotTool } from "./create-boxplot.js";
import { CreateScatterTool } from "./create-scatter.js";
import { PerformMannWhitneyTool } from "./perform-mann-whitney.js";
import { PerformWilcoxonTool } from "./perform-wilcoxon.js";
import { PerformKruskalWallisTool } from "./perform-kruskal-wallis.js";

// Stat 模組名稱
export const MODULE_NAME = "stat";

// Stat 模組元數據
export const moduleInfo = {
  name: "統計分析工具",
  description: "提供各種統計假設檢定、數據分析和視覺化功能，包括參數和非參數檢定、圖表創建",
  endpoint: "/api/stat",
  icon: "chart-bar",
};

// 創建工具實例並設定模組（與 MIL 一致的方式）
const createTool = Tool => {
  const tool = new Tool();
  tool.module = MODULE_NAME; // 使用 module 而不是 moduleName
  return tool;
};

// 導出所有統計工具
export const statTools = [
  // 統計檢定工具
  createTool(PerformTTestTool),
  createTool(PerformChiSquareTool),
  createTool(PerformANOVATool),
  createTool(PerformMannWhitneyTool),
  createTool(PerformWilcoxonTool),
  createTool(PerformKruskalWallisTool),
  
  // 數據分析工具
  createTool(AnalyzeDataTool),
  createTool(ParseCSVTTestTool),
  
  // 圖表創建工具
  createTool(CreateChartTool),
  createTool(CreateHistogramTool),
  createTool(CreateBoxplotTool),
  createTool(CreateScatterTool),
];

// 註冊所有統計工具的函數 (與 HR/MIL 一致的方式)
export function registerStatTools(toolMgr) {
  statTools.forEach(tool => {
    toolMgr.registerTool(tool);
  });
}

// 預設導出工具集合
export default statTools;
