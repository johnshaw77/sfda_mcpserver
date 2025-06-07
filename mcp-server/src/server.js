import express from "express";
import cors from "cors";
import config from "./config/config.js";
import logger from "./config/logger.js";
import { MCPProtocolHandler } from "./services/mcp-protocol.js";
import { sseManager } from "./services/sse-manager.js";
import { registerAllTools, getToolManager } from "./tools/index.js";

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

// 註冊所有工具
try {
  registerAllTools();
  logger.info("Tools registration completed");
} catch (error) {
  logger.error("Tools registration failed:", error);
  process.exit(1);
}

const app = express();

// 中間件設定
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 請求日誌中間件
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

// 工具列表端點 (HTTP API)
app.get("/tools", (req, res) => {
  // 調試資訊
  logger.info("Tools endpoint called", {
    mcpHandlerToolsSize: mcpHandler.tools.size,
    toolManagerToolsSize: toolManager.tools.size,
    mcpHandlerToolNames: Array.from(mcpHandler.tools.keys()),
    toolManagerToolNames: Array.from(toolManager.tools.keys()),
  });

  const tools = Array.from(mcpHandler.tools.values()).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  res.json({
    tools: tools,
    count: tools.length,
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

// 工具測試端點 - 調用特定工具
app.post("/tools/:toolName", async (req, res) => {
  const { toolName } = req.params;
  const params = req.body;

  try {
    logger.info(`Testing tool: ${toolName}`, {
      toolName,
      params: toolManager._sanitizeParams
        ? toolManager._sanitizeParams(params)
        : params,
    });

    const result = await toolManager.callTool(toolName, params);

    res.json({
      success: true,
      toolName,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Tool test failed: ${toolName}`, {
      toolName,
      error: error.message,
      type: error.type || "unknown",
    });

    res.status(400).json({
      success: false,
      toolName,
      error: {
        message: error.message,
        type: error.type || "execution_error",
        details: error.details || null,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// 工具統計端點
app.get("/tools/stats", (req, res) => {
  const stats = toolManager.getAllToolsStats();
  res.json(stats);
});

// 特定工具統計端點
app.get("/tools/:toolName/stats", (req, res) => {
  const { toolName } = req.params;
  const stats = toolManager.getToolStats(toolName);

  if (!stats) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TOOL_NOT_FOUND",
        message: `Tool '${toolName}' not found`,
      },
    });
  }

  res.json(stats);
});

// 工具健康檢查端點
app.get("/tools/health", (req, res) => {
  const health = toolManager.healthCheck();

  const statusCode =
    health.status === "healthy"
      ? 200
      : health.status === "degraded"
        ? 200
        : 500;

  res.status(statusCode).json(health);
});

// 根路徑
app.get("/", (req, res) => {
  res.json({
    message: "MCP Server is running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      tools: "/tools",
      toolTest: "/tools/:toolName",
      toolStats: "/tools/stats",
      toolHealth: "/tools/health",
      mcp: "/mcp",
      sse: "/sse",
      sseStats: "/sse/stats",
    },
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
