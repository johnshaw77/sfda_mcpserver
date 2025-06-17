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
import {
  registerAllTools,
  getToolManager,
  getRegisteredTools,
  getAllModuleMetadata,
  getModuleMetadata,
} from "./tools/index.js";
import { registerAllRoutes } from "./routes/index.js";
import databaseService from "./services/database.js";

// 建立 MCP 協議處理器實例
const mcpHandler = new MCPProtocolHandler();
const toolManager = getToolManager();

// 確保日誌系統已初始化
await logger.init();

// 驗證配置
try {
  config.validate();
} catch (error) {
  logger.error("設定驗證失敗:", error);
  process.exit(1);
}

// 註冊所有工具
try {
  registerAllTools();
  logger.info("工具註冊完成");
} catch (error) {
  logger.error("工具註冊失敗:", error);
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
  });
});

// 工具列表端點 (新增)
app.get("/api/tools", (req, res) => {
  // 獲取所有工具資訊
  const tools = getRegisteredTools();

  // 根據工具的 module 屬性進行分組
  const moduleMap = {};

  // 獲取模組元數據
  const moduleMetadata = getAllModuleMetadata();

  // 按模組分類工具
  tools.forEach(tool => {
    const moduleName = tool.module || "other";
    if (!moduleMap[moduleName]) {
      moduleMap[moduleName] = [];
    }
    moduleMap[moduleName].push(tool);
  });

  // 創建按模組分類的工具列表
  const toolsByModule = {};

  // 遍歷所有模組並添加到結果中
  Object.keys(moduleMap).forEach(moduleName => {
    const moduleTools = moduleMap[moduleName];
    const metadata = moduleMetadata[moduleName] || {
      name: `${moduleName} 模組`,
      description: `${moduleName} 模組的工具集`,
      endpoint: `/api/${moduleName}`,
    };

    toolsByModule[moduleName] = {
      name: metadata.name,
      description: metadata.description,
      endpoint: metadata.endpoint,
      toolCount: moduleTools.length,
      tools: moduleTools,
    };
  });

  // 創建一個扁平工具列表（保持向後兼容）
  const flatToolsList = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    module: tool.module || "other",
  }));

  res.json({
    success: true,
    toolsByModule: toolsByModule,
    tools: flatToolsList, // 保留簡化版的工具列表以保持向後兼容 //TODO: 不用相容
    totalCount: tools.length,
    timestamp: new Date().toISOString(),
    endpoints: {
      allTools: "/api/tools",
      moduleTools: "/api/modules/:moduleName",
      toolDetails: "/api/tools/:toolName",
    },
  });
});

// 模組列表端點 (新增)
app.get("/api/modules", (req, res) => {
  // 獲取所有工具資訊
  const allTools = getRegisteredTools();

  // 獲取所有模組元數據
  const moduleMetadata = getAllModuleMetadata();

  // 模組清單
  const modules = [];

  // 處理每個模組
  for (const [moduleId, metadata] of Object.entries(moduleMetadata)) {
    // 如果是 "other" 模組且沒有要求顯示，則跳過
    if (moduleId === "other" && req.query.showOther !== "true") {
      continue;
    }

    // 過濾出該模組的工具
    const moduleTools = allTools.filter(tool => tool.module === moduleId);

    // 構建模組資訊
    modules.push({
      name: moduleId,
      displayName: metadata.name,
      description: metadata.description,
      endpoint: metadata.endpoint,
      tools: moduleTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
      toolsCount: moduleTools.length,
      apiDocs: `${metadata.endpoint}/docs`,
    });
  }

  res.json({
    success: true,
    modules: modules,
    count: modules.length,
    timestamp: new Date().toISOString(),
    endpoints: {
      modulesDetail: "/api/modules/details",
      specificModule: "/api/modules/:moduleName",
    },
  });
});

// 模組詳細資訊端點 (新增)
app.get("/api/modules/details", (req, res) => {
  // 獲取所有工具資訊
  const allTools = getRegisteredTools();

  // 獲取所有模組元數據
  const moduleMetadata = getAllModuleMetadata();

  // 模組詳細資訊清單
  const modulesDetails = [];

  // 處理每個模組
  for (const [moduleId, metadata] of Object.entries(moduleMetadata)) {
    // 如果是 "other" 模組且沒有要求顯示，則跳過
    if (moduleId === "other" && req.query.showOther !== "true") {
      continue;
    }

    // 過濾出該模組的工具
    const moduleTools = allTools.filter(tool => tool.module === moduleId);

    // 構建模組詳細資訊
    modulesDetails.push({
      name: moduleId,
      displayName: metadata.name,
      description: metadata.description,
      endpoint: metadata.endpoint,
      tools: moduleTools,
      apiEndpoints: {
        toolsList: `${metadata.endpoint}/tools`,
        toolInvoke: `${metadata.endpoint}/:toolName`,
      },
    });
  }

  res.json({
    success: true,
    modulesDetails: modulesDetails,
    count: modulesDetails.length,
    timestamp: new Date().toISOString(),
  });
});

// 特定模組資訊端點 (新增)
app.get("/api/modules/:moduleName", (req, res) => {
  const { moduleName } = req.params;

  // 獲取所有工具資訊
  const allTools = getRegisteredTools();

  // 獲取特定模組的元數據
  const moduleMetadata = getModuleMetadata(moduleName);

  // 檢查模組是否存在
  if (!moduleMetadata) {
    return res.status(404).json({
      success: false,
      error: {
        message: `找不到模組: ${moduleName}`,
        availableModules: Object.keys(getAllModuleMetadata()),
      },
    });
  }

  // 過濾出該模組的工具
  const moduleTools = allTools.filter(tool => tool.module === moduleName);

  // 構建模組資訊
  const moduleInfo = {
    name: moduleName,
    displayName: moduleMetadata.name,
    description: moduleMetadata.description,
    endpoint: moduleMetadata.endpoint,
    toolCount: moduleTools.length,
    tools: moduleTools,
    apiEndpoints: {
      toolsList: `${moduleMetadata.endpoint}/tools`,
      toolInvoke: `${moduleMetadata.endpoint}/:toolName`,
    },
  };

  res.json({
    success: true,
    module: moduleInfo,
    timestamp: new Date().toISOString(),
  });
});

// 模組工具文檔端點 (HR)
app.get("/api/hr/docs", (req, res) => {
  // 獲取所有工具資訊
  const allTools = getRegisteredTools();

  // 獲取 HR 模組元數據
  const moduleMetadata = getModuleMetadata("hr");

  if (!moduleMetadata) {
    return res.status(404).json({
      success: false,
      error: {
        message: "找不到 HR 模組元數據",
      },
    });
  }

  // 獲取 HR 模組的工具
  const hrTools = allTools.filter(tool => tool.module === "hr");

  res.json({
    success: true,
    module: "hr",
    name: moduleMetadata.name,
    description: moduleMetadata.description,
    toolCount: hrTools.length,
    tools: hrTools,
    examples: {
      get_employee: {
        description: "查詢指定員工資訊",
        request: {
          method: "POST",
          endpoint: "/api/hr/get_employee",
          body: {
            employeeNo: "EMP001",
          },
        },
        response: {
          success: true,
          module: "hr",
          toolName: "get_employee",
          result: {
            employeeNo: "EMP001",
            queryTime: "2025-06-17T08:30:45.123Z",
            data: {
              name: "王大明",
              employee_no: "EMP001",
              email: "wang.daming@company.com",
              group_name: "資訊技術部",
            },
            fields: ["basic", "contact", "department"],
          },
          timestamp: "2025-06-17T08:30:45.168Z",
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// 模組工具文檔端點 (MIL) - 已移除

// 系統資訊端點 (新增)
app.get("/api/system/info", (req, res) => {
  const tools = getRegisteredTools();

  // 獲取所有模組元數據
  const moduleMetadata = getAllModuleMetadata();

  // 構建模組清單
  const modules = [];

  // 按模組分組工具
  const toolsByModule = {};

  // 處理每個模組
  for (const [moduleId, metadata] of Object.entries(moduleMetadata)) {
    // 過濾出該模組的工具
    const moduleTools = tools.filter(tool => tool.module === moduleId);

    // 如果是 "other" 模組且沒有工具，則跳過
    if (moduleId === "other" && moduleTools.length === 0) {
      continue;
    }

    // 保存工具清單
    toolsByModule[moduleId] = moduleTools.map(t => t.name);

    // 構建模組資訊
    modules.push({
      name: moduleId,
      displayName: metadata.name,
      description: metadata.description,
      endpoint: metadata.endpoint,
      toolCount: moduleTools.length,
      apiDocs: `${metadata.endpoint}/docs`,
      apiEndpoints: {
        tools: `${metadata.endpoint}/tools`,
        invoke: `${metadata.endpoint}/:toolName`,
      },
    });
  }

  // 系統資訊
  const systemInfo = {
    name: "MCP Server",
    version: "1.0.0",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    apiEndpoints: {
      core: {
        mcp: "/mcp",
        sse: "/sse",
        health: "/health",
      },
      tools: {
        list: "/api/tools",
        stats: "/api/tools/stats",
        health: "/api/tools/health",
      },
      modules: {
        list: "/api/modules",
        details: "/api/modules/details",
        specificModule: "/api/modules/:moduleName",
      },
      system: {
        info: "/api/system/info",
        health: "/health",
        stats: "/api/system/stats",
      },
    },
    modules: modules,
    totalTools: tools.length,
    toolsGrouped: toolsByModule,
  };

  res.json(systemInfo);
});

// 舊版工具列表端點
// 該端點仍保留以支援舊版客戶端
// 建議使用新版 /api/tools 端點
// app.get("/tools", (req, res) => {
//   // 調試資訊
//   logger.info("Legacy tools endpoint called", {
//     mcpHandlerToolsSize: mcpHandler.tools.size,
//     toolManagerToolsSize: toolManager.tools.size,
//     mcpHandlerToolNames: Array.from(mcpHandler.tools.keys()),
//     toolManagerToolNames: Array.from(toolManager.tools.keys()),
//   });

//   const tools = Array.from(mcpHandler.tools.values()).map(tool => ({
//     name: tool.name,
//     description: tool.description,
//     inputSchema: tool.inputSchema,
//   }));

//   res.json({
//     tools: tools,
//     count: tools.length,
//     note: "This is a legacy endpoint. Please use /api/tools instead.",
//   });
// });

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
    message: "連線至 MCP Server",
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

// 根路徑
app.get("/", (req, res) => {
  // 獲取所有工具資訊
  const tools = getRegisteredTools();

  // 根據工具的 module 屬性進行分組
  const moduleMap = {};

  // 獲取模組元數據
  const moduleMetadata = getAllModuleMetadata();

  // 按模組分類工具
  tools.forEach(tool => {
    const moduleName = tool.module || "other";
    if (!moduleMap[moduleName]) {
      moduleMap[moduleName] = [];
    }
    moduleMap[moduleName].push(tool);
  });

  // 創建按模組分類的工具列表
  const toolsByModule = {};

  // 遍歷所有模組並添加到結果中
  Object.keys(moduleMap).forEach(moduleName => {
    const moduleTools = moduleMap[moduleName];
    const metadata = moduleMetadata[moduleName] || {
      name: `${moduleName} 模組`,
      description: `${moduleName} 模組的工具集`,
      endpoint: `/api/${moduleName}`,
    };

    toolsByModule[moduleName] = {
      name: metadata.name,
      description: metadata.description,
      endpoint: metadata.endpoint,
      toolCount: moduleTools.length,
      tools: moduleTools,
    };
  });

  res.json({
    message: "MCP Server 正在執行中",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      // tools: "/tools",
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
      // MIL 模組 API 端點已移除
    },
    modules: toolsByModule,
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
