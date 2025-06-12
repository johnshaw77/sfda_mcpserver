import express from "express";
import cors from "cors";
import config from "./config/config.js";
import logger from "./config/logger.js";
import databaseService from "./services/database.js";
import { MCPProtocolHandler } from "./services/mcp-protocol.js";
import { sseManager } from "./services/sse-manager.js";
import { registerAllTools, getToolManager } from "./tools/index.js";
import {
  registerAllModules,
  getAllModulesInfo,
} from "./routes/module-registry.js";
import registerLegacyRoutes from "./routes/legacy-routes.js";
import logMiddleware from "./middleware/logging.js";
import createLoggingRoutes from "./routes/logging-api.js";

// 建立 MCP 協議處理器實例
const mcpHandler = new MCPProtocolHandler();
const toolManager = getToolManager();

// 驗證配置
try {
  config.validate();
} catch (error) {
  logger.error("Configuration validation failed:", error);
  process.exit(1);
}

// 初始化資料庫連接
try {
  await databaseService.initialize();
  logger.info("Database initialization completed");
} catch (error) {
  logger.error("Database initialization failed:", error);
  process.exit(1);
}

// 註冊所有工具
try {
  registerAllTools();
  logger.info("Tools registration completed");
} catch (error) {
  logger.error("Tools registration failed:", error);
  process.exit(1);
}

// 啟動混合日誌系統健康監控
logMiddleware.startHealthMonitoring();
logger.info("Hybrid logging system initialized");

const app = express();

// 中間件設定
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 混合日誌中間件 (記錄 API 存取)
app.use(logMiddleware.accessLogger());

// 請求日誌中間件 (Winston)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// 健康檢查端點
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: config.nodeEnv,
    mcp: {
      protocolVersion: "2024-11-05",
      initialized: mcpHandler.initialized,
      connections: sseManager.getStats().totalConnections,
    },
  });
});

// MCP 協議端點 (JSON-RPC over HTTP)
app.post("/mcp", async (req, res) => {
  try {
    const message = req.body;
    const response = await mcpHandler.handleMessage(message);
    res.json(response);
  } catch (error) {
    logger.error("MCP request error:", error);
    res.status(500).json({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: "Internal error",
        data: config.isDevelopment() ? error.message : undefined,
      },
    });
  }
});

// SSE 端點 (用於即時通訊)
app.get("/sse", (req, res) => {
  const connectionId = sseManager.createConnection(req, res);

  // 可以在這裡發送歡迎訊息
  sseManager.sendToConnection(connectionId, "welcome", {
    message: "Connected to MCP Server",
    capabilities: mcpHandler.capabilities,
  });
});

// SSE 狀態查詢端點
app.get("/sse/stats", (req, res) => {
  res.json(sseManager.getStats());
});

// 註冊所有模組路由
registerAllModules(app);
logger.info("All module routes registered");

// 註冊舊版 API 路由（重定向到新格式）
registerLegacyRoutes(app);
logger.info("Legacy routes registered for backward compatibility");

// 品質監控 API 路由 - 已由模組註冊器處理

// 日誌管理 API 路由
app.use("/api/logging", createLoggingRoutes(logMiddleware));

// 根路徑
app.get("/", (req, res) => {
  res.json({
    message: "MCP Server is running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      mcp: "/mcp",
      sse: "/sse",
      sseStats: "/sse/stats",
      // 統一的工具 API 端點
      tools: "/api/tools",
      toolCall: "/api/tools/:toolName",
      toolStats: "/api/tools/stats",
      toolSpecificStats: "/api/tools/:toolName/stats",
      toolHealth: "/api/tools/health",
      // 舊版端點 (重定向到新格式)
      legacyTools: "/tools",
      legacyToolCall: "/tools/:toolName",
      legacyToolStats: "/tools/stats",
      legacyToolHealth: "/tools/health",
      // 模組化 API 端點
      hrApi: "/api/hr/:toolName",
      hrTools: "/api/hr/tools",
      financeApi: "/api/finance/:toolName",
      financeTools: "/api/finance/tools",
      tasksApi: "/api/tasks/:toolName",
      tasksTools: "/api/tasks/tools",
      // 品質監控 API 端點
      qualityOverview: "/api/quality/overview",
      qualityCache: "/api/quality/cache",
      qualityVersions: "/api/quality/versions",
      qualityStats: "/api/quality/stats",
      // 日誌管理 API 端點
      loggingStatus: "/api/logging/status",
      loggingToolStats: "/api/logging/tools/stats",
      loggingMetrics: "/api/logging/metrics/:metricName",
      loggingAlerts: "/api/logging/alerts",
      loggingSearch: "/api/logging/search",
      loggingFiles: "/api/logging/files/:logType/tail",
    },
    modules: getAllModulesInfo(),
    mcp: {
      protocolVersion: "2024-11-05",
      supported: true,
    },
    toolsRegistered: toolManager.tools.size,
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  logger.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: config.isDevelopment() ? error.message : "Internal server error",
    },
  });
});

// 錯誤處理中介層 (必須在所有路由之後)
app.use(logMiddleware.errorLogger());

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

// 啟動服務器
const server = app.listen(config.port, () => {
  logger.info(`MCP Server started on port ${config.port}`, {
    environment: config.nodeEnv,
    port: config.port,
  });
});

// 優雅關閉
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  sseManager.closeAllConnections();
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  sseManager.closeAllConnections();
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

export default app;
