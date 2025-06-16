/**
 * Finance 工具模組索引
 *
 * 導出所有財務相關工具
 */

import { GetBudgetStatusTool } from "./get-budget-status.js";

/**
 * 所有可用的財務工具
 */
export const financeTools = [GetBudgetStatusTool];

/**
 * 註冊所有財務工具到工具管理器
 */
export function registerFinanceTools(toolManager) {
  financeTools.forEach(ToolClass => {
    const tool = new ToolClass();
    toolManager.registerTool(tool);
  });
}
