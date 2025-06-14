import express from "express";
import cors from "cors";
import config from "./config/config.js";
import logger from "./config/logger.js";
import hybridLogger from "./config/hybrid-logger.js";
import {
  loggingMiddleware,
  errorLoggingMiddleware,
} from "./middleware/logging.js";
import { MCPProtocolHandler } from "./services/mcp-protocol.js";
import { sseManager } from "./services/sse-manager.js";
import { registerAllTools, getToolManager } from "./tools/index.js";
import { registerAllModules } from "./routes/module-registry.js";

// 建立 MCP 協議處理器實例
const mcpHandler = new MCPProtocolHandler();
const toolManager = getToolManager();

// 確保混合日誌系統已初始化
await hybridLogger.init();

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

// 混合日誌中間件
app.use(loggingMiddleware(hybridLogger));

// 錯誤日誌中間件
app.use(errorLoggingMiddleware(hybridLogger));

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

// 註冊所有模組化路由
registerAllModules(app);

// 工具調用日誌記錄
const callToolHandler = async (req, res, module) => {
  const { toolName } = req.params;
  const params = req.body;

  try {
    // 記錄工具調用開始
    hybridLogger.log("info", "工具調用開始", {
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
    hybridLogger.log("info", "工具調用成功", {
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
    hybridLogger.log("error", "工具調用失敗", {
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

// 舊版工具統計與健康檢查端點已被移除
// 請改用 /api/tools/stats, /api/tools/:toolName/stats 和 /api/tools/health 端點

// 根路徑
app.get("/", (req, res) => {
  res.json({
    message: "MCP Server is running",
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
      // 模組化 API 端點
      hrApi: "/api/hr/:toolName",
      financeApi: "/api/finance/:toolName",
      tasksApi: "/api/tasks/:toolName",
      complaintsApi: "/api/complaints/:toolName",
      // 品質監控 API 端點
      qualityOverview: "/api/quality/overview",
      qualityCache: "/api/quality/cache",
      qualityVersions: "/api/quality/versions",
      qualityStats: "/api/quality/stats",
      // 日誌 API 端點
      logsApi: "/api/logs",
    },
    modules: {
      hr: {
        endpoint: "/api/hr/:toolName",
        tools: [
          "get_employee_info",
          "get_employee_list",
          "get_attendance_record",
          "get_salary_info",
          "get_department_list",
        ],
      },
      finance: {
        endpoint: "/api/finance/:toolName",
        tools: ["get_budget_status"],
      },
      tasks: {
        endpoint: "/api/tasks/:toolName",
        tools: ["create_task", "get_task_list"],
      },
      complaints: {
        endpoint: "/api/complaints/:toolName",
        tools: [
          "get_complaints_list",
          "get_complaint_detail",
          "get_complaints_statistics",
          "update_complaint_status",
        ],
      },
      tools: {
        endpoint: "/api/tools/:toolName",
        description: "統一的工具調用和管理 API",
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
