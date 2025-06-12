/**
 * 工具通用 API 路由
 *
 * 提供工具調用、統計和健康檢查等端點
 * 包含向後相容的舊式 API 端點和新的統一格式端點
 */

import express from "express";
import logger from "../config/logger.js";
import { getToolManager } from "../tools/index.js";
import { MCPProtocolHandler } from "../services/mcp-protocol.js";

const router = express.Router();
const toolManager = getToolManager();
const mcpHandler = new MCPProtocolHandler();

/**
 * 工具列表端點
 * GET /api/tools
 */
router.get("/", (req, res) => {
  // 調試資訊
  logger.info("Tools endpoint called", {
    mcpHandlerToolsSize: mcpHandler.tools.size,
    toolManagerToolsSize: toolManager.tools.size,
    mcpHandlerToolNames: Array.from(mcpHandler.tools.keys()),
    toolManagerToolNames: Array.from(toolManager.tools.keys()),
  });

  const tools = Array.from(mcpHandler.tools.values()).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  res.json({
    tools: tools,
    count: tools.length,
  });
});

/**
 * 工具調用端點
 * POST /api/tools/:toolName
 */
router.post("/:toolName", async (req, res) => {
  const { toolName } = req.params;
  const params = req.body;

  try {
    logger.info(`Calling tool: ${toolName}`, {
      toolName,
      params: toolManager._sanitizeParams
        ? toolManager._sanitizeParams(params)
        : params,
    });

    const result = await toolManager.callTool(toolName, params);

    res.json({
      success: true,
      toolName,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Tool call failed: ${toolName}`, {
      toolName,
      error: error.message,
      type: error.type || "unknown",
    });

    res.status(400).json({
      success: false,
      toolName,
      error: {
        message: error.message,
        type: error.type || "execution_error",
        details: error.details || null,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * 工具統計端點
 * GET /api/tools/stats
 */
router.get("/stats", (req, res) => {
  const stats = toolManager.getAllToolsStats();
  res.json(stats);
});

/**
 * 特定工具統計端點
 * GET /api/tools/:toolName/stats
 */
router.get("/:toolName/stats", (req, res) => {
  const { toolName } = req.params;
  const stats = toolManager.getToolStats(toolName);

  if (!stats) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TOOL_NOT_FOUND",
        message: `Tool '${toolName}' not found`,
      },
    });
  }

  res.json(stats);
});

/**
 * 工具健康檢查端點
 * GET /api/tools/health
 */
router.get("/health", (req, res) => {
  const health = toolManager.healthCheck();

  const statusCode =
    health.status === "healthy"
      ? 200
      : health.status === "degraded"
        ? 200
        : 500;

  res.status(statusCode).json(health);
});

export default router;
