/**
 * 基礎工具類別
 *
 * 提供所有 MCP 工具的基礎功能，包括：
 * - 參數驗證（增強版）
 * - 錯誤處理
 * - 執行日誌
 * - 狀態追蹤
 * - 緩存支援
 * - 版本管理
 * - 使用統計
 */

import hybridLogger from "../config/hybrid-logger.js";
import { HybridLogger } from "../config/hybrid-logger.js";
import { globalToolCache } from "./tool-cache.js";
import { globalVersionManager } from "./version-manager.js";
import { globalStatsManager, StatEventType } from "./stats-manager.js";

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
  NOT_FOUND: "not_found",
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
 * 參數驗證器類別
 */
export class ParameterValidator {
  /**
   * 驗證字串參數
   */
  static validateString(value, constraints = {}) {
    if (typeof value !== "string") {
      throw new ToolExecutionError(
        `Expected string, got ${typeof value}`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.minLength && value.length < constraints.minLength) {
      throw new ToolExecutionError(
        `String too short: minimum ${constraints.minLength} characters`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.maxLength && value.length > constraints.maxLength) {
      throw new ToolExecutionError(
        `String too long: maximum ${constraints.maxLength} characters`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.pattern && !new RegExp(constraints.pattern).test(value)) {
      throw new ToolExecutionError(
        `String does not match required pattern: ${constraints.pattern}`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.enum && !constraints.enum.includes(value)) {
      throw new ToolExecutionError(
        `Value must be one of: ${constraints.enum.join(", ")}`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    return true;
  }

  /**
   * 驗證數字參數
   */
  static validateNumber(value, constraints = {}) {
    if (typeof value !== "number" || isNaN(value)) {
      throw new ToolExecutionError(
        `Expected number, got ${typeof value}`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.minimum !== undefined && value < constraints.minimum) {
      throw new ToolExecutionError(
        `Number too small: minimum ${constraints.minimum}`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.maximum !== undefined && value > constraints.maximum) {
      throw new ToolExecutionError(
        `Number too large: maximum ${constraints.maximum}`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.multipleOf && value % constraints.multipleOf !== 0) {
      throw new ToolExecutionError(
        `Number must be multiple of ${constraints.multipleOf}`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    return true;
  }

  /**
   * 驗證陣列參數
   */
  static validateArray(value, constraints = {}) {
    if (!Array.isArray(value)) {
      throw new ToolExecutionError(
        `Expected array, got ${typeof value}`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.minItems && value.length < constraints.minItems) {
      throw new ToolExecutionError(
        `Array too short: minimum ${constraints.minItems} items`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.maxItems && value.length > constraints.maxItems) {
      throw new ToolExecutionError(
        `Array too long: maximum ${constraints.maxItems} items`,
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    if (constraints.uniqueItems && new Set(value).size !== value.length) {
      throw new ToolExecutionError(
        "Array items must be unique",
        ToolErrorType.VALIDATION_ERROR,
      );
    }

    return true;
  }
}

/**
 * 基礎工具類別
 */
export class BaseTool {
  constructor(name, description, inputSchema, options = {}) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
    this.version = options.version || "1.0.0";
    this.cacheable = options.cacheable !== false; // 預設啟用緩存
    this.cacheTTL = options.cacheTTL || 300000; // 5 分鐘
    this.executionHistory = [];
    this.stats = {
      totalExecutions: 0,
      successCount: 0,
      errorCount: 0,
      averageExecutionTime: 0,
    };

    // 使用全局混合日誌系統，而不是為每個工具創建新實例
    this.hybridLogger = hybridLogger;

    // 註冊版本
    globalVersionManager.registerToolVersion(this.name, this.version, {
      description: this.description,
      cacheable: this.cacheable,
      cacheTTL: this.cacheTTL,
    });
  }

  /**
   * 驗證輸入參數（增強版）
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

    // 檢查參數類型和約束條件
    if (this.inputSchema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(
        this.inputSchema.properties,
      )) {
        if (fieldName in params) {
          const value = params[fieldName];
          this._validateFieldWithConstraints(fieldName, value, fieldSchema);
        }
      }
    }

    return true;
  }

  /**
   * 驗證單一欄位及其約束條件
   */
  _validateFieldWithConstraints(fieldName, value, schema) {
    const expectedType = schema.type;

    // 基本類型檢查
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

    // 進階約束檢查
    try {
      switch (expectedType) {
        case "string":
          ParameterValidator.validateString(value, schema);
          break;
        case "number":
        case "integer":
          ParameterValidator.validateNumber(value, schema);
          break;
        case "array":
          ParameterValidator.validateArray(value, schema);
          break;
      }
    } catch (error) {
      // 重新拋出錯誤，包含欄位名稱資訊
      throw new ToolExecutionError(
        `Parameter '${fieldName}': ${error.message}`,
        error.type,
        { field: fieldName, ...error.details },
      );
    }
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
   * 執行工具 (增強版 - 包含緩存、統計、版本管理)
   */
  async execute(params, context = {}) {
    const executionId = this._generateExecutionId();
    const startTime = Date.now();

    try {
      // 記錄工具調用開始 - 混合日誌
      await this.hybridLogger.logToolCall({
        toolName: this.name,
        executionId,
        params: this._sanitizeParams(params),
        context: {
          sessionId: context.sessionId,
          userId: context.userId,
          timestamp: startTime,
        },
        status: "started",
      });

      // 記錄工具調用統計
      globalStatsManager.recordToolCall(this.name, params, {
        sessionId: context.sessionId,
        userId: context.userId,
        executionId,
      });

      // 驗證輸入參數
      try {
        this.validateInput(params);
      } catch (validationError) {
        // 記錄驗證錯誤
        await this.hybridLogger.logToolCall({
          toolName: this.name,
          executionId,
          status: "error",
          executionTime: Date.now() - startTime,
          error: {
            message: validationError.message,
            type: validationError.type || "validation_error",
            details: validationError.details,
          },
          context: {
            sessionId: context.sessionId,
            userId: context.userId,
          },
        });

        // 記錄錯誤統計
        globalStatsManager.recordToolError(
          this.name,
          validationError,
          Date.now() - startTime,
          {
            sessionId: context.sessionId,
            userId: context.userId,
            executionId,
          },
        );

        throw validationError;
      }

      // 檢查緩存
      let result = null;
      let fromCache = false;

      if (this.cacheable) {
        const cacheKey = globalToolCache.generateKey(
          this.name,
          params,
          context,
        );
        result = globalToolCache.get(cacheKey);

        if (result !== null) {
          fromCache = true;

          // 記錄緩存命中
          await this.hybridLogger.logToolCall({
            toolName: this.name,
            executionId,
            status: "cache_hit",
            cacheKey,
            executionTime: Date.now() - startTime,
          });

          globalStatsManager.recordCacheHit(this.name, {
            sessionId: context.sessionId,
            userId: context.userId,
            cacheKey,
          });

          logger.info(`Tool cache hit: ${this.name}`, {
            toolName: this.name,
            executionId,
            cacheKey,
          });
        } else {
          // 記錄緩存未命中
          await this.hybridLogger.logToolCall({
            toolName: this.name,
            executionId,
            status: "cache_miss",
            cacheKey,
          });

          globalStatsManager.recordCacheMiss(this.name, {
            sessionId: context.sessionId,
            userId: context.userId,
            cacheKey,
          });
        }
      }

      // 如果沒有緩存結果，執行工具邏輯
      if (result === null) {
        const logEntry = this._logExecutionStart(params, executionId);

        try {
          result = await this._execute(params, context);

          const executionTime = Date.now() - startTime;
          this._logExecutionEnd(executionId, ToolStatus.SUCCESS, result);

          // 記錄成功執行 - 混合日誌
          await this.hybridLogger.logToolCall({
            toolName: this.name,
            executionId,
            status: "success",
            executionTime,
            resultSize: JSON.stringify(result).length,
            context: {
              sessionId: context.sessionId,
              userId: context.userId,
            },
          });

          // 記錄成功統計
          globalStatsManager.recordToolSuccess(
            this.name,
            executionTime,
            result,
            {
              sessionId: context.sessionId,
              userId: context.userId,
              executionId,
            },
          );

          // 存入緩存
          if (this.cacheable && result !== null) {
            const cacheKey = globalToolCache.generateKey(
              this.name,
              params,
              context,
            );
            globalToolCache.set(cacheKey, result, this.cacheTTL);
          }
        } catch (error) {
          const executionTime = Date.now() - startTime;
          this._logExecutionEnd(executionId, ToolStatus.ERROR, null, error);

          // 記錄錯誤執行 - 混合日誌
          await this.hybridLogger.logToolCall({
            toolName: this.name,
            executionId,
            status: "error",
            executionTime,
            error: {
              message: error.message,
              type: error.type || "unknown",
              stack: error.stack,
            },
            context: {
              sessionId: context.sessionId,
              userId: context.userId,
            },
          });

          // 記錄錯誤統計
          globalStatsManager.recordToolError(this.name, error, executionTime, {
            sessionId: context.sessionId,
            userId: context.userId,
            executionId,
          });

          throw error;
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        executionTime,
        fromCache,
        executionId,
        toolName: this.name,
        version: this.version,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Tool execution failed: ${this.name}`, {
        toolName: this.name,
        error: error.message,
        executionId,
        params,
      });

      return {
        success: false,
        error: {
          type: error.type || ToolErrorType.EXECUTION_ERROR,
          message: error.message,
          details: error.details || null,
        },
        executionTime: Date.now() - startTime,
        fromCache: false,
        executionId,
        toolName: this.name,
        version: this.version,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 具體的執行邏輯（子類別需要實作）
   */
  async _execute(params, context) {
    throw new ToolExecutionError(
      "Tool execution not implemented",
      ToolErrorType.EXECUTION_ERROR,
      { toolName: this.name },
    );
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
   * 生成執行 ID
   */
  _generateExecutionId() {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理參數以便安全記錄（移除敏感信息）
   */
  _sanitizeParams(params) {
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "key",
      "api_key",
      "apikey",
      "auth",
    ];

    if (typeof params !== "object" || params === null) {
      return params;
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(params)) {
      const lowerKey = key.toLowerCase();

      if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this._sanitizeParams(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 獲取工具資訊（增強版）
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      inputSchema: this.inputSchema,
      cacheable: this.cacheable,
      cacheTTL: this.cacheTTL,
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

  /**
   * 獲取緩存統計
   */
  getCacheStats() {
    if (!this.cacheable) {
      return { cacheable: false };
    }

    return {
      cacheable: true,
      cacheTTL: this.cacheTTL,
      globalCacheStats: globalToolCache.getStats(),
    };
  }

  /**
   * 獲取使用統計
   */
  getUsageStats() {
    return globalStatsManager.getToolSummary(this.name);
  }

  /**
   * 檢查版本相容性
   */
  checkVersionCompatibility(requiredVersion) {
    return globalVersionManager.checkCompatibility(this.name, requiredVersion);
  }
}
