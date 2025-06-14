import express from "express";
import fs from "fs";

/**
 * 日誌分析輔助函數
 */
// 分析錯誤
function analyzeErrors(logs) {
  const errorMap = new Map();
  logs.forEach(log => {
    const key = log.message;
    errorMap.set(key, (errorMap.get(key) || 0) + 1);
  });
  return Array.from(errorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([error, count]) => ({ error, count }));
}

// 計算成功率
function calculateSuccessRate(logs) {
  if (logs.length === 0) return 0;
  const successCount = logs.filter(log => log.success === 1).length;
  return ((successCount / logs.length) * 100).toFixed(2);
}

// 計算平均持續時間
function calculateAvgDuration(logs) {
  if (logs.length === 0) return 0;
  const validDurations = logs.filter(log => log.duration != null);
  if (validDurations.length === 0) return 0;

  const totalDuration = validDurations.reduce(
    (sum, log) => sum + log.duration,
    0,
  );
  return (totalDuration / validDurations.length).toFixed(2);
}

// 分析工具使用情況
function analyzeToolUsage(logs) {
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
}

// 分析 API 使用情況
function analyzeApiUsage(logs) {
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
}

// 分析狀態碼
function analyzeStatusCodes(logs) {
  const statusMap = new Map();
  logs.forEach(log => {
    if (log.status_code) {
      const key = log.status_code.toString();
      statusMap.set(key, (statusMap.get(key) || 0) + 1);
    }
  });

  return Object.fromEntries(statusMap);
}

/**
 * 統一日誌管理路由
 * 結合了所有日誌相關功能，包括：
 * - 檔案日誌和資料庫日誌的查詢
 * - 日誌統計和分析
 * - 系統指標和告警管理
 * - 日誌等級設定和輪轉
 *
 * @param {Object} hybridLogger - 混合日誌系統實例
 * @returns {express.Router} Express 路由
 */
function loggingRoutes(hybridLogger) {
  const router = express.Router();

  /**
   * 獲取日誌統計資訊
   * GET /api/logs/stats
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
          topErrors: analyzeErrors(errorLogs),
        },
        toolAnalysis: {
          total: toolLogs.length,
          successRate: calculateSuccessRate(toolLogs),
          avgDuration: calculateAvgDuration(toolLogs),
          topTools: analyzeToolUsage(toolLogs),
        },
        apiAnalysis: {
          total: apiLogs.length,
          topEndpoints: analyzeApiUsage(apiLogs),
          avgResponseTime: calculateAvgDuration(apiLogs),
          statusCodes: analyzeStatusCodes(apiLogs),
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

  /**
   * 獲取系統指標趨勢
   * GET /api/logs/metrics/:metricName
   */
  router.get("/metrics/:metricName", async (req, res) => {
    try {
      const { metricName } = req.params;
      const hours = parseInt(req.query.hours) || 24;
      const trend = await hybridLogger.getMetricTrend(metricName, hours);

      res.json({
        success: true,
        data: {
          metric: metricName,
          timeRange: `${hours} 小時`,
          trend,
        },
      });
    } catch (error) {
      hybridLogger.error("獲取指標趨勢失敗", {
        error: error.message,
        metricName: req.params.metricName,
      });
      res.status(500).json({
        success: false,
        error: "獲取指標趨勢失敗",
      });
    }
  });

  /**
   * 獲取活躍告警
   * GET /api/logs/alerts
   */
  router.get("/alerts", async (req, res) => {
    try {
      const alerts = await hybridLogger.getActiveAlerts();

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      hybridLogger.error("獲取告警清單失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "獲取告警清單失敗",
      });
    }
  });

  /**
   * 解決告警
   * PATCH /api/logs/alerts/:id/resolve
   */
  router.patch("/alerts/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;

      await hybridLogger.runQuery(
        "UPDATE alert_events SET resolved = 1 WHERE id = ?",
        [id],
      );

      hybridLogger.info("告警已解決", { alertId: id });

      res.json({
        success: true,
        message: "告警已標記為已解決",
      });
    } catch (error) {
      hybridLogger.error("解決告警失敗", {
        error: error.message,
        alertId: req.params.id,
      });
      res.status(500).json({
        success: false,
        error: "解決告警失敗",
      });
    }
  });

  /**
   * 記錄系統指標
   * POST /api/logs/metrics
   */
  router.post("/metrics", async (req, res) => {
    try {
      const { metricName, value, unit } = req.body;

      if (!metricName || value === undefined) {
        return res.status(400).json({
          success: false,
          error: "metricName 和 value 是必需的",
        });
      }

      await hybridLogger.systemMetric(metricName, parseFloat(value), unit);

      res.json({
        success: true,
        message: "系統指標已記錄",
      });
    } catch (error) {
      hybridLogger.error("記錄系統指標失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "記錄系統指標失敗",
      });
    }
  });

  /**
   * 建立告警事件
   * POST /api/logs/alerts
   */
  router.post("/alerts", async (req, res) => {
    try {
      const { alertType, severity, message, details } = req.body;

      if (!alertType || !severity || !message) {
        return res.status(400).json({
          success: false,
          error: "alertType, severity 和 message 是必需的",
        });
      }

      if (!["low", "medium", "high", "critical"].includes(severity)) {
        return res.status(400).json({
          success: false,
          error: "severity 必須是: low, medium, high, critical",
        });
      }

      await hybridLogger.alertEvent(
        alertType,
        severity,
        message,
        details || {},
      );

      hybridLogger.warn("新告警事件", { alertType, severity, message });

      res.json({
        success: true,
        message: "告警事件已建立",
      });
    } catch (error) {
      hybridLogger.error("建立告警事件失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "建立告警事件失敗",
      });
    }
  });

  /**
   * 獲取工具使用統計
   * GET /api/logs/tools/stats
   */
  router.get("/tools/stats", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const stats = await hybridLogger.getToolStats(hours);

      res.json({
        success: true,
        data: stats,
        timeRange: `${hours} 小時`,
      });
    } catch (error) {
      hybridLogger.error("獲取工具統計失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "獲取工具統計失敗",
      });
    }
  });

  /**
   * 查看檔案日誌 (最近 N 行)
   * GET /api/logs/files/:logType/tail
   */
  router.get("/files/:logType/tail", (req, res) => {
    try {
      const { logType } = req.params;
      const lines = parseInt(req.query.lines) || 100;

      if (!hybridLogger.logFiles || !hybridLogger.logFiles[logType]) {
        return res.status(404).json({
          success: false,
          error: `日誌類型 ${logType} 不存在`,
        });
      }

      const filePath = hybridLogger.logFiles[logType];

      if (!fs.existsSync(filePath)) {
        return res.json({
          success: true,
          data: [],
          message: "日誌檔案尚不存在",
        });
      }

      const fileContent = fs.readFileSync(filePath, "utf8");
      const logLines = fileContent.trim().split("\n").slice(-lines);

      // 解析 JSON 日誌行
      const parsedLogs = logLines
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line, timestamp: new Date().toISOString() };
          }
        });

      res.json({
        success: true,
        data: parsedLogs,
        logType,
        lines: parsedLogs.length,
        filePath,
      });
    } catch (error) {
      hybridLogger.error("讀取檔案日誌失敗", {
        error: error.message,
        logType: req.params.logType,
      });
      res.status(500).json({
        success: false,
        error: "讀取檔案日誌失敗",
      });
    }
  });

  /**
   * 日誌搜尋 (檔案)
   * GET /api/logs/search
   */
  router.get("/search", (req, res) => {
    try {
      const { q: query, logType = "combined", lines = 1000 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "查詢參數 q 是必需的",
        });
      }

      if (!hybridLogger.logFiles || !hybridLogger.logFiles[logType]) {
        return res.status(404).json({
          success: false,
          error: `日誌類型 ${logType} 不存在`,
        });
      }

      const filePath = hybridLogger.logFiles[logType];

      if (!fs.existsSync(filePath)) {
        return res.json({
          success: true,
          data: [],
          message: "日誌檔案尚不存在",
        });
      }

      const fileContent = fs.readFileSync(filePath, "utf8");
      const logLines = fileContent.trim().split("\n").slice(-parseInt(lines));

      // 搜尋包含查詢關鍵字的日誌行
      const matchedLogs = logLines
        .filter(line => line.includes(query))
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line, timestamp: new Date().toISOString() };
          }
        });

      res.json({
        success: true,
        data: matchedLogs,
        query,
        logType,
        matches: matchedLogs.length,
        searchedLines: logLines.length,
      });
    } catch (error) {
      hybridLogger.error("搜尋日誌失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "搜尋日誌失敗",
      });
    }
  });

  return router;
}

export default loggingRoutes;
