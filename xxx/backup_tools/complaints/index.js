/**
 * 客訴管理工具模組
 *
 * 提供完整的客訴管理功能，包括查詢、統計、狀態更新等
 */

import getComplaintsListTool from "./get-complaints-list.js";
import getComplaintDetailTool from "./get-complaint-detail.js";
import getComplaintsStatisticsTool from "./get-complaints-statistics.js";
import updateComplaintStatusTool from "./update-complaint-status.js";

/**
 * 客訴管理工具清單
 */
export const complaintsTools = [
  getComplaintsListTool,
  getComplaintDetailTool,
  getComplaintsStatisticsTool,
  updateComplaintStatusTool,
];

/**
 * 取得所有客訴管理工具
 */
export function getComplaintsTools() {
  return complaintsTools;
}

/**
 * 根據名稱取得特定工具
 */
export function getComplaintsTool(name) {
  return complaintsTools.find(tool => tool.name === name);
}

/**
 * 客訴工具模組資訊
 */
export const complaintsModuleInfo = {
  name: "complaints",
  displayName: "客訴管理",
  description: "提供客訴記錄的查詢、統計分析和狀態管理功能",
  version: "1.0.0",
  category: "quality-management",
  tools: complaintsTools.map(tool => ({
    name: tool.name,
    description: tool.description,
  })),
};

export default {
  tools: complaintsTools,
  getTools: getComplaintsTools,
  getTool: getComplaintsTool,
  moduleInfo: complaintsModuleInfo,
};
