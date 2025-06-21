/**
 * 統計分析模組路由
 * 
 * 提供統計分析相關的 API 端點
 */

import express from "express";
import logger from "../config/logger.js";
import { statTools } from "../tools/stat/index.js";

const router = express.Router();

/**
 * 創建統一的工具執行中間件
 * @param {Object} tool - 工具實例
 * @returns {Function} Express 中間件函數
 */
function createToolHandler(tool) {
  return async (req, res) => {
    const startTime = Date.now();
    
    try {
      logger.info(`執行統計工具: ${tool.name}`, {
        parameters: req.body,
        timestamp: new Date().toISOString()
      });

      // 執行工具
      const result = await tool.execute(req.body);
      const executionTime = Date.now() - startTime;

      logger.info(`統計工具執行成功: ${tool.name}`, {
        executionTime: `${executionTime}ms`,
        success: result.success
      });

      // 返回統一格式的回應
      res.json({
        success: true,
        module: "stat",
        tool: tool.name,
        result: result,
        executionTime,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error(`統計工具執行失敗: ${tool.name}`, {
        error: error.message,
        stack: error.stack,
        parameters: req.body,
        executionTime: `${executionTime}ms`
      });

      res.status(500).json({
        success: false,
        module: "stat",
        tool: tool.name,
        error: error.message,
        executionTime,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// 動態註冊所有統計工具的路由
statTools.forEach(tool => {
  const endpoint = `/${tool.name}`;
  router.post(endpoint, createToolHandler(tool));
  
  logger.info(`註冊統計工具路由: POST /api/stat${endpoint}`, {
    toolName: tool.name,
    description: tool.description
  });
});

// 統計模組資訊端點
router.get("/info", (req, res) => {
  res.json({
    module: "stat",
    name: "統計分析工具",
    description: "提供各種統計假設檢定和數據分析功能",
    tools: statTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      endpoint: `/api/stat/${tool.name}`
    })),
    timestamp: new Date().toISOString()
  });
});

// MCP 服務連接測試端點
router.get("/tools", (req, res) => {
  res.json({
    success: true,
    module: "stat",
    tools: statTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      endpoint: `/api/stat/${tool.name}`,
      schema: tool.schema
    })),
    timestamp: new Date().toISOString()
  });
});

export default router; 