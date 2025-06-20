/**
 * 工具註冊器
 *
 * 負責註冊所有可用的 MCP 工具
 */

import { toolManager } from "./tool-manager.js";
import { registerHRTools, moduleInfo as hrModuleInfo } from "./hr/index.js";
import { registerMILTools, moduleInfo as milModuleInfo } from "./mil/index.js";
import {
  tools as statTools,
  handlers as statHandlers,
  toolsInfo as statModuleInfo,
} from "./stat/index.js";
import logger from "../config/logger.js";
import moduleRegistry from "../config/module-registry.js";

/**
 * 註冊所有工具
 */
export function registerAllTools() {
  logger.info("開始註冊工具...");

  try {
    // 註冊 HR 工具
    registerHRToolsInternal();

    // 註冊 MIL 工具
    registerMILToolsInternal();

    // 註冊統計分析工具
    registerStatToolsInternal();

    // 註冊模組元數據
    registerModuleMetadata();

    const totalTools = toolManager.tools.size;
    logger.info(`工具註冊完成。總計工具數量: ${totalTools}`);

    return true;
  } catch (error) {
    logger.error("工具註冊失敗:", error);
    throw error;
  }
}

/**
 * 註冊模組元數據
 */
function registerModuleMetadata() {
  logger.info("註冊模組元數據...");

  // 註冊 HR 模組元數據
  moduleRegistry.registerModuleMetadata("hr", hrModuleInfo);

  // 註冊 MIL 模組元數據
  moduleRegistry.registerModuleMetadata("mil", milModuleInfo);

  // 註冊其他模組元數據
  moduleRegistry.registerModuleMetadata("other", {
    name: "其他工具",
    description: "其他未分類工具",
    endpoint: "/api/tools",
    icon: "apps",
  });

  logger.info("模組元數據註冊成功");
}

/**
 * 註冊人資管理工具
 */
function registerHRToolsInternal() {
  logger.info("註冊 HR 工具...");

  // 註冊所有 HR 工具
  registerHRTools(toolManager);

  logger.info("HR 工具註冊成功");
}

/**
 * 註冊 MIL (mission in list) 專案進度管理工具
 */
function registerMILToolsInternal() {
  logger.info("註冊 MIL 工具...");

  // 註冊所有 MIL 工具
  registerMILTools(toolManager);

  logger.info("MIL 工具註冊成功");
}

/**
 * 註冊統計分析工具
 */
function registerStatToolsInternal() {
  logger.info("註冊統計分析工具...");

  try {
    // 註冊所有統計工具
    statTools.forEach(tool => {
      const handler = statHandlers[tool.name];
      if (handler) {
        toolManager.registerTool(tool, handler);
        logger.debug(`已註冊統計工具: ${tool.name}`);
      } else {
        logger.warn(`找不到統計工具 ${tool.name} 的處理器`);
      }
    });

    // 註冊統計模組元數據
    moduleRegistry.registerModuleMetadata("stat", statModuleInfo);

    logger.info(`統計分析工具註冊成功，共註冊 ${statTools.length} 個工具`);
  } catch (error) {
    logger.error("統計分析工具註冊失敗:", error);
    throw error;
  }
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

/**
 * 取得所有模組元數據
 */
export function getAllModuleMetadata() {
  return moduleRegistry.getAllModuleMetadata();
}

/**
 * 取得特定模組元數據
 */
export function getModuleMetadata(moduleId) {
  return moduleRegistry.getModuleMetadata(moduleId);
}
