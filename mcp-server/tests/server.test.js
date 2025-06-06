import { describe, test, expect } from "@jest/globals";
import request from "supertest";
import app from "../src/server.js";

describe("MCP Server", () => {
  describe("健康檢查端點", () => {
    test("GET /health 應該回傳 200 狀態", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("version", "1.0.0");
      expect(response.body).toHaveProperty("environment");
    });
  });

  describe("工具列表端點", () => {
    test("GET /tools 應該回傳空陣列", async () => {
      const response = await request(app).get("/tools").expect(200);

      expect(response.body).toHaveProperty("tools");
      expect(response.body).toHaveProperty("count");
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.tools).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });

  describe("根端點", () => {
    test("GET / 應該回傳服務器資訊", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.body).toHaveProperty("message", "MCP Server is running");
      expect(response.body).toHaveProperty("version", "1.0.0");
      expect(response.body).toHaveProperty("endpoints");
      expect(response.body.endpoints).toHaveProperty("health", "/health");
      expect(response.body.endpoints).toHaveProperty("tools", "/tools");
    });
  });

  describe("404 處理", () => {
    test("不存在的端點應該回傳 404", async () => {
      const response = await request(app).get("/nonexistent").expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });
  });
});
