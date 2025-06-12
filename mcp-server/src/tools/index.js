/**
 * 工具註冊器
 *
 * 負責註冊所有可用的 MCP 工具
 */

import { toolManager } from "./tool-manager.js";
import { registerHRTools } from "./hr/index.js";
import { registerFinanceTools } from "./finance/index.js";
import { registerTaskManagementTools } from "./task-management/index.js";
import { getComplaintsTools } from "./complaints/index.js";
import logger from "../config/logger.js";

/**
 * 註冊所有工具
 */
export function registerAllTools() {
  logger.info("Starting tool registration...");

  try {
    // 註冊 HR 工具
    registerHRToolsInternal();

    // 註冊財務工具
    registerFinanceToolsInternal();

    // 註冊任務管理工具
    registerTaskManagementToolsInternal();

    // 註冊客訴管理工具
    registerComplaintsToolsInternal();

    const totalTools = toolManager.tools.size;
    logger.info(`Tool registration completed. Total tools: ${totalTools}`);

    return true;
  } catch (error) {
    logger.error("Tool registration failed:", error);
    throw error;
  }
}

/**
 * 註冊人資管理工具
 */
function registerHRToolsInternal() {
  logger.info("Registering HR tools...");

  // 註冊所有 HR 工具
  registerHRTools(toolManager);

  logger.info("HR tools registered successfully");
}

/**
 * 註冊財務管理工具
 */
function registerFinanceToolsInternal() {
  logger.info("Registering Finance tools...");

  // 註冊所有財務工具
  registerFinanceTools(toolManager);

  logger.info("Finance tools registered successfully");
}

/**
 * 註冊任務管理工具
 */
function registerTaskManagementToolsInternal() {
  logger.info("Registering Task Management tools...");

  // 註冊所有任務管理工具
  registerTaskManagementTools(toolManager);

  logger.info("Task Management tools registered successfully");
}

/**
 * 註冊客訴管理工具
 */
function registerComplaintsToolsInternal() {
  logger.info("Registering Complaints tools...");

  // 註冊所有客訴管理工具
  const complaintsTools = getComplaintsTools();
  complaintsTools.forEach(tool => {
    toolManager.registerTool(tool);
  });

  logger.info("Complaints tools registered successfully");
}

/**
 * 取得所有已註冊的工具列表
 */
export function getRegisteredTools() {
  return toolManager.getToolsList();
}

/**
 * 取得工具管理器實例
 */
export function getToolManager() {
  return toolManager;
}
