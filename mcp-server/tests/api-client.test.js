/**
 * API 客戶端基本測試套件
 * @fileoverview 測試 API 客戶端的基本功能
 */

import { describe, test, expect } from "@jest/globals";
import {
  ApiClient,
  ApiError,
  ApiErrorTypes,
  HttpStatusCode,
  createApiClient,
  defaultApiClient,
} from "../src/services/api-client.js";

describe("ApiClient 基本測試", () => {
  describe("建構函數和初始化", () => {
    test("應該使用預設配置建立客戶端", () => {
      const client = new ApiClient();
      expect(client).toBeInstanceOf(ApiClient);
      expect(client.getStatistics().totalRequests).toBe(0);
    });

    test("應該接受自定義配置", () => {
      const config = {
        baseURL: "https://api.example.com",
        timeout: 5000,
        retries: 5,
      };
      const client = new ApiClient(config);
      expect(client).toBeInstanceOf(ApiClient);
    });

    test("createApiClient 工廠函數應該正常工作", () => {
      const client = createApiClient({
        baseURL: "https://test.api.com",
      });
      expect(client).toBeInstanceOf(ApiClient);
    });

    test("defaultApiClient 應該是 ApiClient 實例", () => {
      expect(defaultApiClient).toBeInstanceOf(ApiClient);
    });
  });

  describe("常數定義測試", () => {
    test("ApiErrorTypes 應該包含所有錯誤類型", () => {
      expect(ApiErrorTypes.NETWORK_ERROR).toBe("NETWORK_ERROR");
      expect(ApiErrorTypes.TIMEOUT_ERROR).toBe("TIMEOUT_ERROR");
      expect(ApiErrorTypes.HTTP_ERROR).toBe("HTTP_ERROR");
      expect(ApiErrorTypes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(ApiErrorTypes.AUTHENTICATION_ERROR).toBe("AUTHENTICATION_ERROR");
      expect(ApiErrorTypes.AUTHORIZATION_ERROR).toBe("AUTHORIZATION_ERROR");
      expect(ApiErrorTypes.RATE_LIMIT_ERROR).toBe("RATE_LIMIT_ERROR");
      expect(ApiErrorTypes.SERVER_ERROR).toBe("SERVER_ERROR");
      expect(ApiErrorTypes.UNKNOWN_ERROR).toBe("UNKNOWN_ERROR");
    });

    test("HttpStatusCode 應該包含常用狀態碼", () => {
      expect(HttpStatusCode.OK).toBe(200);
      expect(HttpStatusCode.CREATED).toBe(201);
      expect(HttpStatusCode.BAD_REQUEST).toBe(400);
      expect(HttpStatusCode.UNAUTHORIZED).toBe(401);
      expect(HttpStatusCode.FORBIDDEN).toBe(403);
      expect(HttpStatusCode.NOT_FOUND).toBe(404);
      expect(HttpStatusCode.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe("ApiError 類別測試", () => {
    test("應該正確建立 ApiError 實例", () => {
      const error = new ApiError("Test error", ApiErrorTypes.NETWORK_ERROR);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe("Test error");
      expect(error.type).toBe(ApiErrorTypes.NETWORK_ERROR);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    test("應該包含額外的錯誤資訊", () => {
      const originalError = new Error("Original");
      const config = { url: "/test", method: "GET" };

      const error = new ApiError(
        "API Error",
        ApiErrorTypes.HTTP_ERROR,
        404,
        originalError,
        config,
      );

      expect(error.statusCode).toBe(404);
      expect(error.originalError).toBe(originalError);
      expect(error.config).toBe(config);
    });
  });

  describe("API 客戶端配置測試", () => {
    test("應該正確設置默認值", () => {
      const client = new ApiClient();
      const stats = client.getStatistics();

      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
    });

    test("應該支援攔截器註冊", () => {
      const client = new ApiClient();
      const requestInterceptor = config => config;
      const responseInterceptor = response => response;

      // 這些方法應該存在且不會拋出錯誤
      expect(() => {
        client.addRequestInterceptor(requestInterceptor);
        client.addResponseInterceptor(responseInterceptor);
      }).not.toThrow();
    });

    test("應該支援統計數據重置", () => {
      const client = new ApiClient();

      // 重置統計不應該拋出錯誤
      expect(() => {
        client.resetStatistics();
      }).not.toThrow();

      const stats = client.getStatistics();
      expect(stats.totalRequests).toBe(0);
    });
  });
});
