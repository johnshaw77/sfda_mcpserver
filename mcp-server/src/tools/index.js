/**
 * 工具註冊器
 *
 * 負責註冊所有可用的 MCP 工具
 */

import { toolManager } from "./tool-manager.js";
import { registerHRTools } from "./hr/index.js";
import logger from "../config/logger.js";

/**
 * 註冊所有工具
 */
export function registerAllTools() {
  logger.info("Starting tool registration...");

  try {
    // 註冊 HR 工具
    registerHRToolsInternal();

    // 這裡可以添加其他類別的工具註冊
    // registerFinanceTools();
    // registerTaskTools();

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
