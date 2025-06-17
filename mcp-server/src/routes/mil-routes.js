/**
 * 製造智能資訊實驗室 (MIL) 模組 API 路由
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
  res.json({
    module: "mil",
    tools: [
      "get-mil-list",
      "get-mil-details",
      "get-status-report",
      "get-mil-type-list",
    ],
    timestamp: new Date().toISOString(),
  });
});

// 工具調用端點
router.post("/:toolName", async (req, res) => {
  const { toolName } = req.params;
  const params = req.body;

  try {
    // 檢查工具是否存在
    const validTools = [
      "get-mil-list",
      "get-mil-details",
      "get-status-report",
      "get-mil-type-list",
    ];

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
      module: "mil",
      toolName: toolName,
      result: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`MIL 工具 ${toolName} 調用失敗:`, {
      error: error.message,
      stack: error.stack,
      params: JSON.stringify(params),
    });

    // 處理不同類型的錯誤
    if (error.type === "validation_error") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.details,
        },
      });
    } else if (error.type === "not_found") {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: error.message,
          details: error.details,
        },
      });
    }

    // 其他錯誤
    res.status(500).json({
      success: false,
      error: {
        code: "EXECUTION_ERROR",
        message: error.message,
      },
    });
  }
});

// 文檔端點
router.get("/docs", (req, res) => {
  // 獲取模組元數據
  const moduleMetadata = getModuleMetadata("mil");

  res.json({
    module: "mil",
    name: moduleMetadata.name,
    description: moduleMetadata.description,
    tools: [
      {
        name: "get-mil-list",
        description: "根據條件查詢 MIL 列表",
        endpoint: "/api/mil/get-mil-list",
        method: "POST",
        parameters: {
          status: "選填，MIL 處理狀態",
          proposerName: "選填，提出人姓名，支持模糊查詢",
          serialNumber: "選填，MIL 編號，支持模糊查詢",
          importance: "選填，重要度",
          page: "選填，頁數，預設 1",
          limit: "選填，每頁返回結果數量限制，預設 100",
        },
      },
      {
        name: "get-mil-details",
        description: "查詢特定 MIL 的詳細資訊",
        endpoint: "/api/mil/get-mil-details",
        method: "POST",
        parameters: {
          serialNumber: "必填，MIL 編號",
        },
      },
      {
        name: "get-status-report",
        description: "生成 MIL 狀態分布統計報告",
        endpoint: "/api/mil/get-status-report",
        method: "POST",
        parameters: {},
      },
      {
        name: "get-mil-type-list",
        description: "取得 MIL 類型列表，獲取所有 MIL 類型的唯一列表",
        endpoint: "/api/mil/get-mil-type-list",
        method: "POST",
        parameters: {},
      },
    ],
    timestamp: new Date().toISOString(),
  });
});

export default router;
