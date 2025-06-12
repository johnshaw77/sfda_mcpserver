/**
 * 模組路由工廠
 *
 * 這個工廠函數可以為任何工具模組創建標準的 API 端點
 * 包括工具列表端點和工具調用端點
 */

import express from "express";
import logger from "../config/logger.js";

/**
 * 創建模組路由
 * @param {string} moduleName - 模組名稱
 * @param {string[]} toolNames - 該模組包含的工具名稱
 * @param {object} toolManager - 工具管理器實例
 * @returns {express.Router} Express 路由器
 */
export function createModuleRoutes(moduleName, toolNames, toolManager) {
  const router = express.Router();

  // 工具列表端點 GET /api/{module}/tools
  router.get("/tools", (req, res) => {
    const allTools = toolManager.getToolsList();
    const moduleToolsWithDetails = allTools.filter(tool =>
      toolNames.includes(tool.name),
    );

    res.json({
      module: moduleName,
      tools: moduleToolsWithDetails,
      count: moduleToolsWithDetails.length,
      timestamp: new Date().toISOString(),
    });
  });

  // 工具調用端點 POST /api/{module}/:toolName
  router.post("/:toolName", async (req, res) => {
    const { toolName } = req.params;

    // 檢查請求的工具是否在此模組中
    if (!toolNames.includes(toolName)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TOOL_NOT_FOUND",
          message: `${moduleName} tool '${toolName}' not found. Available tools: ${toolNames.join(", ")}`,
        },
      });
    }

    // 調用工具
    await callToolHandler(req, res, moduleName, toolManager);
  });

  return router;
}

/**
 * 通用工具調用處理函數
 * @private
 */
async function callToolHandler(req, res, module, toolManager) {
  const { toolName } = req.params;
  const params = req.body;

  try {
    logger.info(`Calling ${module} tool: ${toolName}`, {
      module,
      toolName,
      params: toolManager._sanitizeParams
        ? toolManager._sanitizeParams(params)
        : params,
    });

    const result = await toolManager.callTool(toolName, params);

    res.json({
      success: true,
      module,
      toolName,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`${module} tool failed: ${toolName}`, {
      module,
      toolName,
      error: error.message,
      type: error.type || "unknown",
    });

    res.status(400).json({
      success: false,
      module,
      toolName,
      error: {
        message: error.message,
        type: error.type || "execution_error",
        details: error.details || null,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export default createModuleRoutes;
