/**
 * MIL 工具集合
 *
 * 註冊所有與MIL (mission in list)專案任務管理相關的工具
 */

import { GetMILListTool } from "./get-mil-list.js";
import { GetMILDetailsTool } from "./get-mil-details.js";
import { GetStatusReportTool } from "./get-status-report.js";
import { GetMILTypeListTool } from "./get-mil-type-list.js";
import { GetCountByTool } from "./get-count-by.js";

// MIL 模組名稱
export const MODULE_NAME = "mil";

// MIL 模組元數據
export const moduleInfo = {
  name: "MIL專案任務管理",
  description:
    "MIL (Mission in List) 是專案或任務分配系統，旨在追蹤、管理和優化專案進度，確保每個里程碑能夠清晰定義並有效執行，協助團隊達成目標並提升效率",
  endpoint: "/api/mil",
  icon: "list-check",
};

// 創建工具實例並設定模組
const createTool = Tool => {
  const tool = new Tool();
  tool.moduleName = MODULE_NAME;
  return tool;
};

// 導出所有 MIL 工具
export const milTools = [
  createTool(GetMILListTool),
  createTool(GetMILDetailsTool),
  createTool(GetStatusReportTool),
  createTool(GetMILTypeListTool),
  createTool(GetCountByTool),
];

// 註冊所有 MIL 工具的函數
export function registerMILTools(toolMgr) {
  milTools.forEach(tool => {
    toolMgr.registerTool(tool);
  });
}

// 預設導出工具集合
export default milTools;
