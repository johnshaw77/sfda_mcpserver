import express from "express";
import cors from "cors";
import config from "./config/config.js";
import logger from "./config/logger.js";
import { MCPProtocolHandler } from "./services/mcp-protocol.js";
import { sseManager } from "./services/sse-manager.js";
import { registerAllTools, getToolManager } from "./tools/index.js";
import qualityRoutes from "./api/quality-routes.js";
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

// 品質管理 API 路由
app.use("/api/quality", qualityRoutes);

// 通用工具調用函數
const callToolHandler = async (req, res, module) => {
  const { toolName } = req.params;
  const params = req.body;

  try {
    logger.info(`Calling ${module} tool: ${toolName}`, {
      module,
      toolName,
      params: toolManager._sanitizeParams
        ? toolManager._sanitizeParams(params)
        : params,
    });

    const result = await toolManager.callTool(toolName, params);

    res.json({
      success: true,
      module,
      toolName,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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

// HR 模組工具列表端點
app.get("/api/hr/tools", (req, res) => {
  const hrTools = [
    "get_employee_info",
    "get_employee_list",
    "get_attendance_record",
    "get_salary_info",
    "get_department_list",
  ];

  const allTools = toolManager.getToolsList();
  const hrToolsWithDetails = allTools.filter(tool =>
    hrTools.includes(tool.name),
  );

  res.json({
    module: "hr",
    tools: hrToolsWithDetails,
    count: hrToolsWithDetails.length,
    timestamp: new Date().toISOString(),
  });
});

// HR 模組 API 端點
app.post("/api/hr/:toolName", async (req, res) => {
  const hrTools = [
    "get_employee_info",
    "get_employee_list",
    "get_attendance_record",
    "get_salary_info",
    "get_department_list",
  ];

  const { toolName } = req.params;
  if (!hrTools.includes(toolName)) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TOOL_NOT_FOUND",
        message: `HR tool '${toolName}' not found. Available tools: ${hrTools.join(", ")}`,
      },
    });
  }

  await callToolHandler(req, res, "hr");
});

// Finance 模組工具列表端點
app.get("/api/finance/tools", (req, res) => {
  const financeTools = ["get_budget_status"];

  const allTools = toolManager.getToolsList();
  const financeToolsWithDetails = allTools.filter(tool =>
    financeTools.includes(tool.name),
  );

  res.json({
    module: "finance",
    tools: financeToolsWithDetails,
    count: financeToolsWithDetails.length,
    timestamp: new Date().toISOString(),
  });
});

// Finance 模組 API 端點
app.post("/api/finance/:toolName", async (req, res) => {
  const financeTools = ["get_budget_status"];

  const { toolName } = req.params;
  if (!financeTools.includes(toolName)) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TOOL_NOT_FOUND",
        message: `Finance tool '${toolName}' not found. Available tools: ${financeTools.join(", ")}`,
      },
    });
  }

  await callToolHandler(req, res, "finance");
});

// Task Management 模組工具列表端點
app.get("/api/tasks/tools", (req, res) => {
  const taskTools = ["create_task", "get_task_list"];

  const allTools = toolManager.getToolsList();
  const taskToolsWithDetails = allTools.filter(tool =>
    taskTools.includes(tool.name),
  );

  res.json({
    module: "tasks",
    tools: taskToolsWithDetails,
    count: taskToolsWithDetails.length,
    timestamp: new Date().toISOString(),
  });
});

// Task Management 模組 API 端點
app.post("/api/tasks/:toolName", async (req, res) => {
  const taskTools = ["create_task", "get_task_list"];

  const { toolName } = req.params;
  if (!taskTools.includes(toolName)) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TOOL_NOT_FOUND",
        message: `Task tool '${toolName}' not found. Available tools: ${taskTools.join(", ")}`,
      },
    });
  }

  await callToolHandler(req, res, "tasks");
});

// 保留原有的工具測試端點以便向後相容
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

// 品質監控 API 路由
app.use("/api/quality", qualityRoutes);

// 日誌管理 API 路由
app.use("/api/logging", createLoggingRoutes(logMiddleware));

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
      // 新增模組化 API 端點
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
