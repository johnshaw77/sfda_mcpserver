/**
 * 基礎工具類別
 *
 * 提供所有 MCP 工具的基礎功能，包括：
 * - 參數驗證
 * - 錯誤處理
 * - 執行日誌
 * - 狀態追蹤
 */

import logger from "../config/logger.js";

/**
 * 工具執行狀態
 */
export const ToolStatus = {
  PENDING: "pending",
  RUNNING: "running",
  SUCCESS: "success",
  ERROR: "error",
  TIMEOUT: "timeout",
};

/**
 * 工具錯誤類型
 */
export const ToolErrorType = {
  VALIDATION_ERROR: "validation_error",
  EXECUTION_ERROR: "execution_error",
  TIMEOUT_ERROR: "timeout_error",
  API_ERROR: "api_error",
  PERMISSION_ERROR: "permission_error",
  NETWORK_ERROR: "network_error",
  CONFIGURATION_ERROR: "configuration_error",
  RATE_LIMIT_ERROR: "rate_limit_error",
  AUTHENTICATION_ERROR: "authentication_error",
};

/**
 * 工具執行錯誤類別
 */
export class ToolExecutionError extends Error {
  constructor(message, type = ToolErrorType.EXECUTION_ERROR, details = null) {
    super(message);
    this.name = "ToolExecutionError";
    this.type = type;
    this.details = details;
    this.timestamp = new Date();
  }
}

/**
 * 基礎工具類別
 */
export class BaseTool {
  constructor(name, description, inputSchema) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
    this.executionHistory = [];
    this.stats = {
      totalExecutions: 0,
      successCount: 0,
      errorCount: 0,
      averageExecutionTime: 0,
    };
  }

  /**
   * 驗證輸入參數
   */
  validateInput(params) {
    if (!params || typeof params !== "object") {
      throw new ToolExecutionError(
        "Invalid input parameters",
        ToolErrorType.VALIDATION_ERROR,
        { expected: "object", received: typeof params },
      );
    }

    // 檢查必要參數
    if (this.inputSchema.required) {
      for (const requiredField of this.inputSchema.required) {
        if (!(requiredField in params)) {
          throw new ToolExecutionError(
            `Missing required parameter: ${requiredField}`,
            ToolErrorType.VALIDATION_ERROR,
            { missingField: requiredField },
          );
        }
      }
    }

    // 檢查參數類型
    if (this.inputSchema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(
        this.inputSchema.properties,
      )) {
        if (fieldName in params) {
          const value = params[fieldName];
          const expectedType = fieldSchema.type;

          if (!this._validateType(value, expectedType)) {
            throw new ToolExecutionError(
              `Invalid type for parameter ${fieldName}`,
              ToolErrorType.VALIDATION_ERROR,
              {
                field: fieldName,
                expected: expectedType,
                received: typeof value,
              },
            );
          }
        }
      }
    }

    return true;
  }

  /**
   * 檢查資料類型
   */
  _validateType(value, expectedType) {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "integer":
        return Number.isInteger(value);
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      default:
        return true; // 未知類型，允許通過
    }
  }

  /**
   * 記錄執行開始
   */
  _logExecutionStart(params, executionId) {
    const logEntry = {
      executionId,
      status: ToolStatus.RUNNING,
      startTime: new Date(),
      params: { ...params }, // 複製避免修改原始參數
      endTime: null,
      duration: null,
      result: null,
      error: null,
    };

    this.executionHistory.push(logEntry);

    logger.info(`Tool execution started: ${this.name}`, {
      toolName: this.name,
      executionId,
      params,
    });

    return logEntry;
  }

  /**
   * 記錄執行完成
   */
  _logExecutionEnd(executionId, status, result = null, error = null) {
    const logEntry = this.executionHistory.find(
      entry => entry.executionId === executionId,
    );

    if (logEntry) {
      logEntry.status = status;
      logEntry.endTime = new Date();
      logEntry.duration = logEntry.endTime - logEntry.startTime;
      logEntry.result = result;
      logEntry.error = error;

      // 更新統計資料
      this.stats.totalExecutions++;
      if (status === ToolStatus.SUCCESS) {
        this.stats.successCount++;
      } else {
        this.stats.errorCount++;
      }

      // 更新平均執行時間
      const totalTime = this.executionHistory
        .filter(entry => entry.duration !== null)
        .reduce((sum, entry) => sum + entry.duration, 0);
      this.stats.averageExecutionTime = totalTime / this.stats.totalExecutions;

      logger.info(`Tool execution completed: ${this.name}`, {
        toolName: this.name,
        executionId,
        status,
        duration: logEntry.duration,
        success: status === ToolStatus.SUCCESS,
      });
    }
  }

  /**
   * 執行工具（主要入口點）
   */
  async execute(params, options = {}) {
    const executionId = `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timeout = options.timeout || 30000; // 預設 30 秒超時

    let logEntry;

    try {
      // 驗證輸入參數
      this.validateInput(params);

      // 記錄執行開始
      logEntry = this._logExecutionStart(params, executionId);

      // 設定超時處理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new ToolExecutionError(
              `Tool execution timeout after ${timeout}ms`,
              ToolErrorType.TIMEOUT_ERROR,
              { timeout },
            ),
          );
        }, timeout);
      });

      // 執行工具邏輯
      const executionPromise = this._execute(params, options);

      // 等待執行完成或超時
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // 記錄成功完成
      this._logExecutionEnd(executionId, ToolStatus.SUCCESS, result);

      return {
        success: true,
        result,
        executionId,
        toolName: this.name,
        duration: logEntry.duration,
      };
    } catch (error) {
      // 決定錯誤狀態
      const status =
        error instanceof ToolExecutionError &&
        error.type === ToolErrorType.TIMEOUT_ERROR
          ? ToolStatus.TIMEOUT
          : ToolStatus.ERROR;

      // 記錄錯誤完成
      this._logExecutionEnd(executionId, status, null, {
        message: error.message,
        type: error.type || ToolErrorType.EXECUTION_ERROR,
        details: error.details || null,
      });

      // 拋出錯誤，由上層處理
      throw error;
    }
  }

  /**
   * 具體的執行邏輯（子類別需要實作）
   */
  async _execute(params, options) {
    throw new ToolExecutionError(
      "Tool execution not implemented",
      ToolErrorType.EXECUTION_ERROR,
      { toolName: this.name },
    );
  }

  /**
   * 獲取工具資訊
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
      stats: { ...this.stats },
    };
  }

  /**
   * 獲取執行歷史
   */
  getExecutionHistory(limit = 50) {
    return this.executionHistory.slice(-limit).map(entry => ({
      ...entry,
      params: undefined, // 不包含敏感參數資料
    }));
  }

  /**
   * 清理執行歷史
   */
  clearHistory() {
    this.executionHistory = [];
    this.stats = {
      totalExecutions: 0,
      successCount: 0,
      errorCount: 0,
      averageExecutionTime: 0,
    };
  }
}
