/**
 * 工具管理器
 *
 * 負責管理所有 MCP 工具的註冊、調用和生命週期管理
 */

import logger from "../config/logger.js";
import { ToolExecutionError, ToolErrorType } from "./base-tool.js";

/**
 * 工具管理器類別
 */
export class ToolManager {
  constructor() {
    this.tools = new Map();
    this.globalStats = {
      totalTools: 0,
      totalExecutions: 0,
      totalSuccesses: 0,
      totalErrors: 0,
    };
  }

  /**
   * 註冊工具
   */
  registerTool(tool) {
    if (!tool || !tool.name) {
      throw new Error("Invalid tool: missing name");
    }

    if (this.tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} already registered, overwriting`);
    }

    this.tools.set(tool.name, tool);
    this.globalStats.totalTools = this.tools.size;

    logger.info(`Tool registered: ${tool.name}`, {
      toolName: tool.name,
      description: tool.description,
    });
  }

  /**
   * 取消註冊工具
   */
  unregisterTool(toolName) {
    if (this.tools.has(toolName)) {
      this.tools.delete(toolName);
      this.globalStats.totalTools = this.tools.size;
      logger.info(`Tool unregistered: ${toolName}`);
      return true;
    }
    return false;
  }

  /**
   * 獲取工具
   */
  getTool(toolName) {
    return this.tools.get(toolName);
  }

  /**
   * 檢查工具是否存在
   */
  hasTool(toolName) {
    return this.tools.has(toolName);
  }

  /**
   * 獲取所有工具列表
   */
  getToolsList() {
    return Array.from(this.tools.values()).map(tool => tool.getInfo());
  }

  /**
   * 調用工具
   */
  async callTool(toolName, params, options = {}) {
    try {
      // 檢查工具是否存在
      if (!this.hasTool(toolName)) {
        throw new ToolExecutionError(
          `Tool not found: ${toolName}`,
          ToolErrorType.EXECUTION_ERROR,
          { toolName, availableTools: Array.from(this.tools.keys()) },
        );
      }

      const tool = this.getTool(toolName);

      logger.info(`Calling tool: ${toolName}`, {
        toolName,
        params: this._sanitizeParams(params),
      });

      // 執行工具
      const result = await tool.execute(params, options);

      // 更新全域統計
      this.globalStats.totalExecutions++;
      this.globalStats.totalSuccesses++;

      logger.info(`Tool call successful: ${toolName}`, {
        toolName,
        executionId: result.executionId,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      // 更新全域統計
      this.globalStats.totalExecutions++;
      this.globalStats.totalErrors++;

      logger.error(`Tool call failed: ${toolName}`, {
        toolName,
        error: error.message,
        type: error.type || "unknown",
        params: this._sanitizeParams(params),
      });

      // 重新拋出錯誤供上層處理
      throw error;
    }
  }

  /**
   * 清理敏感參數用於日誌記錄
   */
  _sanitizeParams(params) {
    if (!params || typeof params !== "object") {
      return params;
    }

    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "credential",
    ];
    const sanitized = { ...params };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "***";
      }
    }

    return sanitized;
  }

  /**
   * 獲取全域統計資料
   */
  getGlobalStats() {
    return {
      ...this.globalStats,
      successRate:
        this.globalStats.totalExecutions > 0
          ? (
              (this.globalStats.totalSuccesses /
                this.globalStats.totalExecutions) *
              100
            ).toFixed(2) + "%"
          : "0%",
      errorRate:
        this.globalStats.totalExecutions > 0
          ? (
              (this.globalStats.totalErrors /
                this.globalStats.totalExecutions) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };
  }

  /**
   * 獲取工具統計資料
   */
  getToolStats(toolName) {
    const tool = this.getTool(toolName);
    if (!tool) {
      return null;
    }

    return {
      toolName,
      ...tool.stats,
      successRate:
        tool.stats.totalExecutions > 0
          ? (
              (tool.stats.successCount / tool.stats.totalExecutions) *
              100
            ).toFixed(2) + "%"
          : "0%",
      errorRate:
        tool.stats.totalExecutions > 0
          ? (
              (tool.stats.errorCount / tool.stats.totalExecutions) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };
  }

  /**
   * 獲取所有工具的統計資料
   */
  getAllToolsStats() {
    const stats = {};

    for (const toolName of this.tools.keys()) {
      stats[toolName] = this.getToolStats(toolName);
    }

    return {
      global: this.getGlobalStats(),
      tools: stats,
    };
  }

  /**
   * 重置統計資料
   */
  resetStats() {
    this.globalStats = {
      totalTools: this.tools.size,
      totalExecutions: 0,
      totalSuccesses: 0,
      totalErrors: 0,
    };

    // 重置每個工具的統計資料
    for (const tool of this.tools.values()) {
      tool.clearHistory();
    }

    logger.info("Tool manager stats reset");
  }

  /**
   * 健康檢查
   */
  healthCheck() {
    const health = {
      status: "healthy",
      totalTools: this.tools.size,
      tools: {},
      issues: [],
    };

    // 檢查每個工具的健康狀態
    for (const [toolName, tool] of this.tools) {
      const toolHealth = {
        name: toolName,
        registered: true,
        recentErrors: 0,
      };

      // 檢查最近的錯誤率
      const recentExecutions = tool.getExecutionHistory(10);
      toolHealth.recentErrors = recentExecutions.filter(
        execution => execution.status === "error",
      ).length;

      if (toolHealth.recentErrors > 5) {
        health.issues.push(
          `Tool ${toolName} has high error rate: ${toolHealth.recentErrors}/10`,
        );
      }

      health.tools[toolName] = toolHealth;
    }

    if (health.issues.length > 0) {
      health.status = "degraded";
    }

    return health;
  }

  /**
   * 關閉管理器
   */
  shutdown() {
    logger.info("Shutting down tool manager");

    // 清理所有工具
    this.tools.clear();
    this.globalStats = {
      totalTools: 0,
      totalExecutions: 0,
      totalSuccesses: 0,
      totalErrors: 0,
    };
  }
}

// 建立全域工具管理器實例
export const toolManager = new ToolManager();
