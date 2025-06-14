import express from "express";
import hybridLogger from "../config/hybrid-logger.js";

const router = express.Router();

/**
 * 獲取日誌統計資訊
 * GET /api/logging/stats
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await hybridLogger.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error) {
    await hybridLogger.error("獲取日誌統計失敗", {
      error: error.message,
      category: "api-error",
    });

    res.status(500).json({
      success: false,
      error: "獲取日誌統計失敗",
    });
  }
});

/**
 * 設定日誌等級
 * POST /api/logging/level
 */
router.post("/level", async (req, res) => {
  try {
    const { level } = req.body;

    if (
      !level ||
      !["error", "warn", "info", "debug", "trace"].includes(level)
    ) {
      return res.status(400).json({
        success: false,
        error: "無效的日誌等級。有效值: error, warn, info, debug, trace",
      });
    }

    hybridLogger.setLogLevel(level);

    await hybridLogger.info("日誌等級已更新", {
      newLevel: level,
      updatedBy: req.ip,
      category: "config-change",
    });

    res.json({
      success: true,
      message: `日誌等級已設定為 ${level}`,
      data: {
        oldLevel: hybridLogger.logLevel,
        newLevel: level,
      },
    });
  } catch (error) {
    await hybridLogger.error("設定日誌等級失敗", {
      error: error.message,
      category: "api-error",
    });

    res.status(500).json({
      success: false,
      error: "設定日誌等級失敗",
    });
  }
});

/**
 * 查詢日誌記錄
 * GET /api/logging/query
 */
router.get("/query", async (req, res) => {
  try {
    const {
      level,
      category,
      toolName,
      startTime,
      endTime,
      limit = 100,
      offset = 0,
    } = req.query;

    const logs = await hybridLogger.queryLogs({
      level,
      category,
      toolName,
      startTime,
      endTime,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    await hybridLogger.error("查詢日誌失敗", {
      error: error.message,
      query: req.query,
      category: "api-error",
    });

    res.status(500).json({
      success: false,
      error: "查詢日誌失敗：" + error.message,
    });
  }
});

/**
 * 手動觸發日誌輪轉
 * POST /api/logging/rotate
 */
router.post("/rotate", async (req, res) => {
  try {
    await hybridLogger.info("手動觸發日誌輪轉", {
      triggeredBy: req.ip,
      category: "maintenance",
    });

    hybridLogger.rotateAllLogs();

    res.json({
      success: true,
      message: "日誌輪轉已完成",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await hybridLogger.error("日誌輪轉失敗", {
      error: error.message,
      category: "api-error",
    });

    res.status(500).json({
      success: false,
      error: "日誌輪轉失敗",
    });
  }
});

/**
 * 獲取即時日誌 (WebSocket 或 SSE)
 * GET /api/logging/live
 */
router.get("/live", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // 發送初始連接訊息
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      timestamp: new Date().toISOString(),
      message: "日誌串流已連接",
    })}\n\n`,
  );

  // 保持連接活躍
  const keepAlive = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({
        type: "ping",
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );
  }, 30000);

  // 處理客戶端斷開連接
  req.on("close", () => {
    clearInterval(keepAlive);
  });

  // 注意：這裡需要實作日誌事件的即時推送機制
  // 可以透過 EventEmitter 或其他方式來實現
});

/**
 * 日誌分析報告
 * GET /api/logging/analysis
 */
router.get("/analysis", async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const startTime = new Date(
      Date.now() - hours * 60 * 60 * 1000,
    ).toISOString();

    // 獲取各種統計資料
    const errorLogs = await hybridLogger.queryLogs({
      level: "error",
      startTime,
      limit: 1000,
    });

    const toolLogs = await hybridLogger.queryLogs({
      category: "tool-call",
      startTime,
      limit: 1000,
    });

    const apiLogs = await hybridLogger.queryLogs({
      category: "api-access",
      startTime,
      limit: 1000,
    });

    // 分析數據
    const analysis = {
      timeRange: {
        hours: parseInt(hours),
        startTime,
        endTime: new Date().toISOString(),
      },
      errorAnalysis: {
        total: errorLogs.length,
        topErrors: this.analyzeErrors(errorLogs),
      },
      toolAnalysis: {
        total: toolLogs.length,
        successRate: this.calculateSuccessRate(toolLogs),
        avgDuration: this.calculateAvgDuration(toolLogs),
        topTools: this.analyzeToolUsage(toolLogs),
      },
      apiAnalysis: {
        total: apiLogs.length,
        topEndpoints: this.analyzeApiUsage(apiLogs),
        avgResponseTime: this.calculateAvgDuration(apiLogs),
        statusCodes: this.analyzeStatusCodes(apiLogs),
      },
    };

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    await hybridLogger.error("日誌分析失敗", {
      error: error.message,
      category: "api-error",
    });

    res.status(500).json({
      success: false,
      error: "日誌分析失敗",
    });
  }
});

// 輔助分析方法
router.analyzeErrors = logs => {
  const errorMap = new Map();
  logs.forEach(log => {
    const key = log.message;
    errorMap.set(key, (errorMap.get(key) || 0) + 1);
  });
  return Array.from(errorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([error, count]) => ({ error, count }));
};

router.calculateSuccessRate = logs => {
  if (logs.length === 0) return 0;
  const successCount = logs.filter(log => log.success === 1).length;
  return ((successCount / logs.length) * 100).toFixed(2);
};

router.calculateAvgDuration = logs => {
  if (logs.length === 0) return 0;
  const validDurations = logs.filter(log => log.duration != null);
  if (validDurations.length === 0) return 0;

  const totalDuration = validDurations.reduce(
    (sum, log) => sum + log.duration,
    0,
  );
  return (totalDuration / validDurations.length).toFixed(2);
};

router.analyzeToolUsage = logs => {
  const toolMap = new Map();
  logs.forEach(log => {
    if (log.tool_name) {
      const key = log.tool_name;
      const current = toolMap.get(key) || { count: 0, totalDuration: 0 };
      current.count++;
      if (log.duration) current.totalDuration += log.duration;
      toolMap.set(key, current);
    }
  });

  return Array.from(toolMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([tool, stats]) => ({
      tool,
      count: stats.count,
      avgDuration:
        stats.count > 0 ? (stats.totalDuration / stats.count).toFixed(2) : 0,
    }));
};

router.analyzeApiUsage = logs => {
  const endpointMap = new Map();
  logs.forEach(log => {
    if (log.url) {
      const key = `${log.method} ${log.url}`;
      endpointMap.set(key, (endpointMap.get(key) || 0) + 1);
    }
  });

  return Array.from(endpointMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));
};

router.analyzeStatusCodes = logs => {
  const statusMap = new Map();
  logs.forEach(log => {
    if (log.status_code) {
      const key = log.status_code.toString();
      statusMap.set(key, (statusMap.get(key) || 0) + 1);
    }
  });

  return Object.fromEntries(statusMap);
};

export default router;
