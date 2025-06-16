import express from "express";
import cors from "cors";
import config from "./config/config.js";
import logger from "./config/logger.js";
import {
  loggingMiddleware,
  errorLoggingMiddleware,
} from "./middleware/logging.js";
import { MCPProtocolHandler } from "./services/mcp-protocol.js";
import { sseManager } from "./services/sse-manager.js";
import { registerAllTools, getToolManager } from "./tools/index.js";
import { registerAllRoutes } from "./routes/index.js";
import databaseService from "./services/database.js";

// 建立 MCP 協議處理器實例
const mcpHandler = new MCPProtocolHandler();
const toolManager = getToolManager();

// VPN 保持連線定時器
let keepAliveTimer = null;

// 確保日誌系統已初始化
await logger.init();

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

// 初始化資料庫服務
try {
  await databaseService.initialize();
  logger.debug("資料庫服務初始化成功");
} catch (error) {
  logger.error("資料庫服務初始化失敗，但伺服器將繼續啟動:", error);
  // 不讓資料庫錯誤阻止服務器啟動，但會記錄錯誤
}

// 設置定時器保持 VPN 連線 (每3分鐘向 qms 發送簡單查詢)
keepAliveTimer = setInterval(
  async () => {
    try {
      await databaseService.query("qms", "SELECT id FROM flexium_okr LIMIT 1");
      logger.debug("VPN keep-alive query executed successfully");
    } catch (error) {
      logger.debug("VPN keep-alive query failed:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },
  1 * 60 * 1000,
); // 1分鐘 = 1 * 60 * 1000 毫秒

const app = express();

// 中間件設定
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// 混合日誌中間件
app.use(loggingMiddleware(logger));

// 錯誤日誌中間件
app.use(errorLoggingMiddleware(logger));

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
    database: {
      initialized: databaseService.isInitialized,
      vpnKeepAlive: {
        enabled: keepAliveTimer !== null,
        interval: "1 minute",
      },
    },
  });
});

// 舊版工具列表端點
// 該端點仍保留以支援舊版客戶端
// 建議使用新版 /api/tools 端點
app.get("/tools", (req, res) => {
  // 調試資訊
  logger.info("Legacy tools endpoint called", {
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
    note: "This is a legacy endpoint. Please use /api/tools instead.",
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

// 註冊所有路由
try {
  console.log("正在註冊所有路由...");
  registerAllRoutes(app, toolManager);
  console.log("所有路由註冊完成");
} catch (error) {
  console.error("路由註冊失敗:", error);
  logger.error("路由註冊失敗:", error);
}

// API 404 處理
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API 路徑不存在",
    message: `找不到路徑 ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// 工具調用日誌記錄
const callToolHandler = async (req, res, module) => {
  const { toolName } = req.params;
  const params = req.body;

  try {
    // 記錄工具調用開始
    logger.log("info", "工具調用開始", {
      category: "tool-call",
      module,
      toolName,
      params: toolManager._sanitizeParams
        ? toolManager._sanitizeParams(params)
        : params,
      user: req.ip,
    });

    logger.info(`Calling ${module} tool: ${toolName}`, {
      module,
      toolName,
      params: toolManager._sanitizeParams
        ? toolManager._sanitizeParams(params)
        : params,
    });

    const result = await toolManager.callTool(toolName, params);

    // 記錄工具調用成功
    logger.log("info", "工具調用成功", {
      category: "tool-call",
      module,
      toolName,
      success: true,
      executionTime: Date.now() - req.startTime,
    });

    res.json({
      success: true,
      module,
      toolName,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // 記錄工具調用失敗
    logger.log("error", "工具調用失敗", {
      category: "tool-call",
      module,
      toolName,
      error: error.message,
      type: error.type || "unknown",
      user: req.ip,
    });

    logger.error(`${module} tool failed: ${toolName}`, {
      module,
      toolName,
      error: error.message,
      type: error.type || "unknown",
    });

    res.status(400).json({
      success: false,
      module,
      toolName,
      error: {
        message: error.message,
        type: error.type || "execution_error",
        details: error.details || null,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// 根路徑
app.get("/", (req, res) => {
  res.json({
    message: "MCP Server 正在執行中",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      tools: "/tools",
      // 統一工具 API 路由
      toolsApi: "/api/tools",
      toolStats: "/api/tools/stats",
      specificToolStats: "/api/tools/:toolName/stats",
      toolHealth: "/api/tools/health",
      mcp: "/mcp",
      sse: "/sse",
      sseStats: "/sse/stats",
      // HR 模組 API 端點
      hr: "/api/hr",
    },
    modules: {
      // 只保留 HR 模組
      hr: {
        endpoint: "/api/hr/:toolName",
        description: "人資模組 API",
      },
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
try {
  console.log(`正在啟動 MCP Server，端口: ${config.port}...`);
  const server = app.listen(config.port, () => {
    console.log(`MCP Server 成功啟動，監聽端口: ${config.port}`);
    logger.info(`MCP Server started on port ${config.port}`, {
      environment: config.nodeEnv,
      port: config.port,
    });
  });

  // 優雅關閉
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down gracefully");

    // 清理定時器
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      logger.info("Keep-alive timer cleared");
    }

    // 關閉 SSE 連接
    sseManager.closeAllConnections();

    // 關閉資料庫連接
    try {
      await databaseService.close();
      logger.info("Database connections closed");
    } catch (error) {
      logger.error("Error closing database connections:", error);
    }

    server.close(() => {
      logger.info("Process terminated");
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    logger.info("SIGINT received, shutting down gracefully");

    // 清理定時器
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      logger.info("Keep-alive timer cleared");
    }

    // 關閉 SSE 連接
    sseManager.closeAllConnections();

    // 關閉資料庫連接
    try {
      await databaseService.close();
      logger.info("Database connections closed");
    } catch (error) {
      logger.error("Error closing database connections:", error);
    }

    server.close(() => {
      logger.info("Process terminated");
      process.exit(0);
    });
  });
} catch (error) {
  console.error("啟動服務器失敗:", error);
  logger.error("啟動服務器失敗:", error);
}

export default app;
