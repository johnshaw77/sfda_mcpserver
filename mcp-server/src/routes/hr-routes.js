/**
 * 人力資源模組 API 路由 (簡化版)
 */

import express from "express";
import { getToolManager, getModuleMetadata } from "../tools/index.js";
import logger from "../config/logger.js";

// 創建模組路由
const router = express.Router();

// 獲取工具管理器實例
const toolManager = getToolManager();

// 工具列表端點
router.get("/tools", (req, res) => {
  // 獲取模組元數據
  const moduleMetadata = getModuleMetadata("hr");

  // 獲取所有 HR 工具
  const hrTools = toolManager
    .getToolsList()
    .filter(tool => tool.module === "hr");

  res.json({
    module: "hr",
    moduleName: moduleMetadata ? moduleMetadata.name : "人力資源管理",
    tools: hrTools.map(tool => tool.name),
    timestamp: new Date().toISOString(),
  });
});

// 工具調用端點
router.post("/:toolName", async (req, res) => {
  const { toolName } = req.params;
  const params = req.body;

  try {
    // 獲取所有 HR 工具
    const hrTools = toolManager
      .getToolsList()
      .filter(tool => tool.module === "hr");
    const validTools = hrTools.map(tool => tool.name);

    // 檢查工具是否存在
    if (!validTools.includes(toolName)) {
      return res.status(404).json({
        success: false,
        error: {
          message: `找不到工具 ${toolName}`,
          availableTools: validTools,
        },
      });
    }

    const result = await toolManager.callTool(toolName, params);

    res.json({
      success: true,
      module: "hr",
      toolName,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`HR tool failed: ${toolName}`, {
      module: "hr",
      toolName,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      module: "hr",
      toolName,
      error: {
        message: error.message,
        type: error.type || "execution_error",
      },
    });
  }
});

export default router;
