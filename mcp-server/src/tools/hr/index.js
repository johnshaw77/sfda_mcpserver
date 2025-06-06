/**
 * HR 工具模組索引
 *
 * 導出所有 HR 相關工具
 */

import { GetEmployeeInfoTool } from "./get-employee-info.js";
import { GetEmployeeListTool } from "./get-employee-list.js";
import { GetAttendanceRecordTool } from "./get-attendance-record.js";
import { GetSalaryInfoTool } from "./get-salary-info.js";

/**
 * 所有可用的 HR 工具
 */
export const hrTools = [
  GetEmployeeInfoTool,
  GetEmployeeListTool,
  GetAttendanceRecordTool,
  GetSalaryInfoTool,
];

/**
 * 註冊所有 HR 工具到工具管理器
 */
export function registerHRTools(toolManager) {
  hrTools.forEach(ToolClass => {
    const tool = new ToolClass();
    toolManager.registerTool(tool);
  });
}
