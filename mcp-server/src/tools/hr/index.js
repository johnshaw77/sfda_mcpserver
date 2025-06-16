/**
 * HR 工具集合
 *
 * 註冊所有與人力資源相關的工具
 */

import { GetEmployeeTool } from "./get-employee.js";
import { SearchEmployeesTool } from "./search-employees.js";
import { GetEmployeeCountTool } from "./get-employee-count.js";

// 導出所有 HR 工具
export const hrTools = [
  new GetEmployeeTool(),
  new SearchEmployeesTool(),
  new GetEmployeeCountTool(),
];

// 註冊所有 HR 工具的函數
export function registerHRTools(toolMgr) {
  hrTools.forEach(tool => {
    toolMgr.registerTool(tool);
  });
}

// 預設導出工具集合
export default hrTools;
