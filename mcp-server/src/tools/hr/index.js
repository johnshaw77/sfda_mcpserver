/**
 * HR 工具集合
 *
 * 註冊所有與人力資源相關的工具
 */

import { GetEmployeeTool } from "./get-employee.js";
import { SearchEmployeesTool } from "./search-employees.js";
import { GetEmployeeCountTool } from "./get-employee-count.js";

// HR 模組名稱
export const MODULE_NAME = "hr";

// HR 模組元數據
export const moduleInfo = {
  name: "人力資源管理哈哈",
  description: "人力資源管理模組，提供員工資訊查詢、搜尋等功能",
  endpoint: "/api/hr",
  icon: "user-group",
};

// 創建工具實例並設定模組
const createTool = Tool => {
  const tool = new Tool();
  tool.module = MODULE_NAME; // 使用 module 而不是 moduleName
  return tool;
};

// 導出所有 HR 工具
export const hrTools = [
  createTool(GetEmployeeTool),
  createTool(SearchEmployeesTool),
  createTool(GetEmployeeCountTool),
];

// 註冊所有 HR 工具的函數
export function registerHRTools(toolMgr) {
  hrTools.forEach(tool => {
    toolMgr.registerTool(tool);
  });
}

// 預設導出工具集合
export default hrTools;
