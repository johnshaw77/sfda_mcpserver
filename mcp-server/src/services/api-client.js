/**
 * 企業級 API 客戶端模組
 *
 * 提供完整的 HTTP 請求封裝，包括：
 * - 請求超時和重試機制
 * - 錯誤分類和處理
 * - 請求/響應攔截器
 * - 認證支援
 * - 日誌記錄
 *
 * @author SFDA Development Team
 * @version 1.0.0
 */

import fetch from "node-fetch";
import logger from "../config/logger.js";

/**
 * API 錯誤分類
 */
export const ApiErrorTypes = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  HTTP_ERROR: "HTTP_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

/**
 * HTTP 狀態碼分類
 */
export const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * API 錯誤類別
 */
export class ApiError extends Error {
  constructor(
    message,
    type,
    statusCode = null,
    originalError = null,
    config = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.config = config;
    this.timestamp = new Date();
  }
}

/**
 * 請求配置類別
 */
export class RequestConfig {
  constructor(options = {}) {
    this.url = options.url || "";
    this.method = options.method || "GET";
    this.headers = options.headers || {};
    this.body = options.body || null;
    this.timeout = options.timeout || 30000; // 30 秒預設超時
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 秒預設重試延遲
    this.retryCondition = options.retryCondition || this.defaultRetryCondition;
    this.validateStatus = options.validateStatus || this.defaultValidateStatus;
    this.transformRequest = options.transformRequest || null;
    this.transformResponse = options.transformResponse || null;
  }

  /**
   * 預設重試條件
   */
  defaultRetryCondition(error, attempt) {
    // 網路錯誤或 5xx 伺服器錯誤時重試
    if (error.type === ApiErrorTypes.NETWORK_ERROR) return true;
    if (error.type === ApiErrorTypes.TIMEOUT_ERROR) return true;
    if (error.statusCode >= 500) return true;
    if (error.statusCode === HttpStatusCode.TOO_MANY_REQUESTS) return true;

    return false;
  }

  /**
   * 預設狀態驗證
   */
  defaultValidateStatus(status) {
    return status >= 200 && status < 300;
  }
}

/**
 * API 客戶端類別
 */
export class ApiClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || "";
    this.defaultHeaders = config.defaultHeaders || {
      "Content-Type": "application/json",
      "User-Agent": "SFDA-MCP-Client/1.0.0",
    };
    this.defaultTimeout = config.defaultTimeout || 30000;
    this.defaultRetries = config.defaultRetries || 3;
    this.defaultRetryDelay = config.defaultRetryDelay || 1000;

    // 攔截器
    this.requestInterceptors = [];
    this.responseInterceptors = [];

    // 統計數據
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retryCount: 0,
    };
  }

  /**
   * 添加請求攔截器
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加響應攔截器
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * 執行請求攔截器
   */
  async executeRequestInterceptors(config) {
    let processedConfig = { ...config };

    for (const interceptor of this.requestInterceptors) {
      try {
        processedConfig = await interceptor(processedConfig);
      } catch (error) {
        logger.error("Request interceptor error:", error);
        throw new ApiError(
          "Request interceptor failed",
          ApiErrorTypes.VALIDATION_ERROR,
          null,
          error,
          config,
        );
      }
    }

    return processedConfig;
  }

  /**
   * 執行響應攔截器
   */
  async executeResponseInterceptors(response, config) {
    let processedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      try {
        processedResponse = await interceptor(processedResponse, config);
      } catch (error) {
        logger.error("Response interceptor error:", error);
        throw new ApiError(
          "Response interceptor failed",
          ApiErrorTypes.UNKNOWN_ERROR,
          response.status,
          error,
          config,
        );
      }
    }

    return processedResponse;
  }

  /**
   * 建立完整的 URL
   */
  buildUrl(url) {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const base = this.baseURL.endsWith("/")
      ? this.baseURL.slice(0, -1)
      : this.baseURL;
    const path = url.startsWith("/") ? url : `/${url}`;

    return `${base}${path}`;
  }

  /**
   * 分類 HTTP 錯誤
   */
  classifyError(error, response = null, config = null) {
    // 網路錯誤
    if (
      !response &&
      (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED")
    ) {
      return new ApiError(
        "Network connection failed",
        ApiErrorTypes.NETWORK_ERROR,
        null,
        error,
        config,
      );
    }

    // 超時錯誤
    if (!response && error.type === "request-timeout") {
      return new ApiError(
        "Request timeout",
        ApiErrorTypes.TIMEOUT_ERROR,
        null,
        error,
        config,
      );
    }

    if (response) {
      const status = response.status;

      // 認證錯誤
      if (status === HttpStatusCode.UNAUTHORIZED) {
        return new ApiError(
          "Authentication required",
          ApiErrorTypes.AUTHENTICATION_ERROR,
          status,
          error,
          config,
        );
      }

      // 授權錯誤
      if (status === HttpStatusCode.FORBIDDEN) {
        return new ApiError(
          "Access forbidden",
          ApiErrorTypes.AUTHORIZATION_ERROR,
          status,
          error,
          config,
        );
      }

      // 限流錯誤
      if (status === HttpStatusCode.TOO_MANY_REQUESTS) {
        return new ApiError(
          "Rate limit exceeded",
          ApiErrorTypes.RATE_LIMIT_ERROR,
          status,
          error,
          config,
        );
      }

      // 驗證錯誤
      if (
        status === HttpStatusCode.BAD_REQUEST ||
        status === HttpStatusCode.UNPROCESSABLE_ENTITY
      ) {
        return new ApiError(
          "Request validation failed",
          ApiErrorTypes.VALIDATION_ERROR,
          status,
          error,
          config,
        );
      }

      // 伺服器錯誤
      if (status >= 500) {
        return new ApiError(
          "Server error occurred",
          ApiErrorTypes.SERVER_ERROR,
          status,
          error,
          config,
        );
      }

      // 其他 HTTP 錯誤
      return new ApiError(
        `HTTP error ${status}`,
        ApiErrorTypes.HTTP_ERROR,
        status,
        error,
        config,
      );
    }

    // 未知錯誤
    return new ApiError(
      error.message || "Unknown error occurred",
      ApiErrorTypes.UNKNOWN_ERROR,
      null,
      error,
      config,
    );
  }

  /**
   * 執行單次請求
   */
  async executeRequest(config) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // 建立請求選項
      const requestOptions = {
        method: config.method,
        headers: {
          ...this.defaultHeaders,
          ...config.headers,
        },
      };

      // 添加請求體
      if (config.body) {
        if (config.transformRequest) {
          requestOptions.body = config.transformRequest(config.body);
        } else if (typeof config.body === "object") {
          requestOptions.body = JSON.stringify(config.body);
        } else {
          requestOptions.body = config.body;
        }
      }

      // 設定超時
      const controller = new AbortController();
      requestOptions.signal = controller.signal;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, config.timeout);

      logger.info(`API Request [${requestId}]:`, {
        method: config.method,
        url: config.url,
        headers: requestOptions.headers,
        timeout: config.timeout,
      });

      // 執行請求
      const response = await fetch(config.url, requestOptions);
      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;

      // 檢查狀態碼
      if (!config.validateStatus(response.status)) {
        const errorText = await response.text();
        logger.error(`API Error [${requestId}]:`, {
          status: response.status,
          statusText: response.statusText,
          duration,
          error: errorText,
        });

        throw this.classifyError(
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          response,
          config,
        );
      }

      // 處理響應
      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // 轉換響應
      if (config.transformResponse) {
        responseData = config.transformResponse(responseData);
      }

      const apiResponse = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config,
        duration,
        requestId,
      };

      logger.info(`API Success [${requestId}]:`, {
        status: response.status,
        duration,
        dataSize: JSON.stringify(responseData).length,
      });

      return apiResponse;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 處理 AbortError (超時)
      if (error.name === "AbortError") {
        const timeoutError = new ApiError(
          `Request timeout after ${config.timeout}ms`,
          ApiErrorTypes.TIMEOUT_ERROR,
          null,
          error,
          config,
        );

        logger.error(`API Timeout [${requestId}]:`, {
          timeout: config.timeout,
          duration,
          error: timeoutError.message,
        });

        throw timeoutError;
      }

      // 分類其他錯誤
      const classifiedError = this.classifyError(error, null, config);

      logger.error(`API Error [${requestId}]:`, {
        type: classifiedError.type,
        message: classifiedError.message,
        duration,
        originalError: error.message,
      });

      throw classifiedError;
    }
  }

  /**
   * 帶重試機制的請求執行
   */
  async request(configOptions) {
    const config = new RequestConfig({
      timeout: this.defaultTimeout,
      retries: this.defaultRetries,
      retryDelay: this.defaultRetryDelay,
      ...configOptions,
      url: this.buildUrl(configOptions.url),
    });

    // 執行請求攔截器
    const processedConfig = await this.executeRequestInterceptors(config);

    // 更新統計
    this.stats.totalRequests++;

    let lastError;
    const maxAttempts = processedConfig.retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest(processedConfig);

        // 執行響應攔截器
        const processedResponse = await this.executeResponseInterceptors(
          response,
          processedConfig,
        );

        // 更新統計
        this.stats.successfulRequests++;
        if (attempt > 1) {
          this.stats.retryCount += attempt - 1;
        }

        return processedResponse;
      } catch (error) {
        lastError = error;

        // 檢查是否應該重試
        if (
          attempt < maxAttempts &&
          processedConfig.retryCondition(error, attempt)
        ) {
          const delay = processedConfig.retryDelay * Math.pow(2, attempt - 1); // 指數退避

          logger.warn(
            `API Request retry ${attempt}/${processedConfig.retries}:`,
            {
              error: error.message,
              nextRetryIn: delay,
              url: processedConfig.url,
            },
          );

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    // 更新統計
    this.stats.failedRequests++;

    logger.error("API Request failed after all retries:", {
      url: processedConfig.url,
      method: processedConfig.method,
      attempts: maxAttempts,
      finalError: lastError.message,
    });

    throw lastError;
  }

  /**
   * GET 請求
   */
  async get(url, config = {}) {
    return this.request({
      ...config,
      method: "GET",
      url,
    });
  }

  /**
   * POST 請求
   */
  async post(url, data = null, config = {}) {
    return this.request({
      ...config,
      method: "POST",
      url,
      body: data,
    });
  }

  /**
   * PUT 請求
   */
  async put(url, data = null, config = {}) {
    return this.request({
      ...config,
      method: "PUT",
      url,
      body: data,
    });
  }

  /**
   * PATCH 請求
   */
  async patch(url, data = null, config = {}) {
    return this.request({
      ...config,
      method: "PATCH",
      url,
      body: data,
    });
  }

  /**
   * DELETE 請求
   */
  async delete(url, config = {}) {
    return this.request({
      ...config,
      method: "DELETE",
      url,
    });
  }

  /**
   * HEAD 請求
   */
  async head(url, config = {}) {
    return this.request({
      ...config,
      method: "HEAD",
      url,
    });
  }

  /**
   * OPTIONS 請求
   */
  async options(url, config = {}) {
    return this.request({
      ...config,
      method: "OPTIONS",
      url,
    });
  }

  /**
   * 取得統計資料
   */
  getStatistics() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalRequests > 0
          ? (
              (this.stats.successfulRequests / this.stats.totalRequests) *
              100
            ).toFixed(2) + "%"
          : "0%",
      averageRetries:
        this.stats.successfulRequests > 0
          ? (this.stats.retryCount / this.stats.successfulRequests).toFixed(2)
          : "0",
    };
  }

  /**
   * 重置統計資料
   */
  resetStatistics() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retryCount: 0,
    };
  }
}

/**
 * 建立預設的 API 客戶端實例
 */
export function createApiClient(config = {}) {
  return new ApiClient(config);
}

/**
 * 預設的 API 客戶端實例
 */
export const defaultApiClient = createApiClient();
