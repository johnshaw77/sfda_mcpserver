import hybridLogger from "../config/hybrid-logger.js";

/**
 * API 存取日誌中介層
 * 記錄所有 HTTP 請求和回應
 */
export const loggingMiddleware = logger => (req, res, next) => {
  const startTime = Date.now();

  // 記錄請求開始
  logger.debug("API 請求開始", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    category: "api-request",
  });

  // 覆寫 res.end 來捕獲回應
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // 記錄 API 存取
    logger.apiAccess(
      {
        method: req.method,
        url: req.url,
        ip: req.ip,
        headers: req.headers,
      },
      { statusCode: res.statusCode },
      duration,
    );

    // 呼叫原始的 end 方法
    originalEnd.apply(this, args);
  };

  next();
};

/**
 * 錯誤日誌中介層
 * 記錄所有未處理的錯誤
 */
export const errorLoggingMiddleware = logger => (error, req, res, next) => {
  logger.error("API 錯誤", {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    category: "api-error",
  });

  next(error);
};

/**
 * 工具調用日誌包裝器
 * 包裝工具執行來記錄調用情況
 */
export const logToolExecution = async (
  toolName,
  params,
  executorFunction,
  clientId = null,
) => {
  const startTime = Date.now();

  try {
    hybridLogger.debug("工具執行開始", {
      toolName,
      params: hybridLogger.sanitizeParams(params),
      clientId,
      category: "tool-start",
    });

    const result = await executorFunction();
    const duration = Date.now() - startTime;

    // 記錄成功的工具調用
    await hybridLogger.toolCall(toolName, params, result, duration, clientId);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorResult = { error: error.message };

    // 記錄失敗的工具調用
    await hybridLogger.toolCall(
      toolName,
      params,
      errorResult,
      duration,
      clientId,
    );

    throw error;
  }
};

/**
 * 系統事件記錄器
 * 記錄重要的系統事件
 */
export const logSystemEvent = async (event, data = {}, level = "info") => {
  await hybridLogger[level](`系統事件: ${event}`, {
    event,
    data,
    category: "system-event",
  });
};

export default {
  loggingMiddleware,
  errorLoggingMiddleware,
  logToolExecution,
  logSystemEvent,
};
