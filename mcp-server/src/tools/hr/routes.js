/**
 * HR 模組路由
 *
 * 負責註冊 HR 相關的 API 路由和中間件
 */

import express from "express";
import { hrTools } from "./index.js";
import logger from "../../config/logger.js";
import { authMiddleware } from "../../middleware/auth.js";

/**
 * 建立 HR 模組路由
 * @param {object} toolManager - 工具管理器實例
 * @returns {express.Router} - Express 路由器
 */
export function createHRRouter(toolManager) {
  const router = express.Router();

  // 取得可用工具名稱清單
  const availableTools = hrTools.map(tool => tool.name);

  logger.info(
    `Creating HR module router with tools: ${availableTools.join(", ")}`,
  );

  // 添加中間件 (根據需要自訂)
  router.use(authMiddleware); // 假設需要身份驗證

  // 處理所有 HR 工具請求
  router.post("/:toolName", async (req, res) => {
    const { toolName } = req.params;

    // 檢查工具是否存在
    if (!availableTools.includes(toolName)) {
      logger.warn(`Tool not found: ${toolName}`, {
        module: "HR",
        requestedTool: toolName,
      });
      return res.status(404).json({
        error: "Tool not found",
        message: `找不到工具 ${toolName}`,
        availableTools,
      });
    }

    try {
      // 取得工具實例
      const tool = toolManager.getTool(toolName);

      // 執行工具
      const result = await tool.execute(req.body, {
        user: req.user, // 假設中間件提供了 user 資訊
        requestId: req.headers["x-request-id"],
      });

      // 返回結果
      res.json(result);
    } catch (error) {
      logger.error(`Error executing HR tool ${toolName}: ${error.message}`, {
        module: "HR",
        tool: toolName,
        error: error.stack,
      });

      // 返回錯誤
      res.status(500).json({
        error: "Tool execution failed",
        message: error.message,
        details: error.details || undefined,
      });
    }
  });

  // 取得可用工具列表的端點 (可選)
  router.get("/tools", (req, res) => {
    res.json({
      module: "HR",
      tools: availableTools,
    });
  });

  return router;
}

/**
 * 註冊 HR 模組路由
 * @param {object} app - Express 應用實例
 * @param {object} toolManager - 工具管理器實例
 */
export function registerHRRoutes(app, toolManager) {
  // 建立並註冊 HR 路由
  const hrRouter = createHRRouter(toolManager);
  app.use("/api/hr", hrRouter);

  logger.info("HR module routes registered at /api/hr");
}
