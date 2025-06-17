/**
 * Task Management 工具模組索引
 *
 * 導出所有任務管理相關工具
 */

import { CreateTaskTool } from "./create-task.js";
import { GetTaskListTool } from "./get-task-list.js";

/**
 * 所有可用的任務管理工具
 */
export const taskManagementTools = [CreateTaskTool, GetTaskListTool];

/**
 * 註冊所有任務管理工具到工具管理器
 */
export function registerTaskManagementTools(toolManager) {
  taskManagementTools.forEach(ToolClass => {
    const tool = new ToolClass();
    toolManager.registerTool(tool);
  });
}
