import express from "express";
import fs from "fs";

const router = express.Router();

/**
 * 日誌管理 API 路由 (ES6 版本)
 * 支援檔案和資料庫日誌的統一管理
 */
function createLoggingRoutes(logMiddleware) {
  /**
   * 獲取日誌系統狀態
   */
  router.get("/status", async (req, res) => {
    try {
      const stats = logMiddleware.getLogStats();
      const toolStats = await logMiddleware.getToolStats(24);
      const activeAlerts = await logMiddleware.getActiveAlerts();

      res.json({
        success: true,
        data: {
          system: stats,
          toolUsage: toolStats,
          activeAlerts: activeAlerts.length,
          strategy: "hybrid",
        },
      });
    } catch (error) {
      console.error("獲取日誌狀態失敗:", error);
      res.status(500).json({
        success: false,
        error: "獲取日誌狀態失敗",
      });
    }
  });

  /**
   * 獲取工具使用統計
   */
  router.get("/tools/stats", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const stats = await logMiddleware.getToolStats(hours);

      res.json({
        success: true,
        data: stats,
        timeRange: `${hours} 小時`,
      });
    } catch (error) {
      console.error("獲取工具統計失敗:", error);
      res.status(500).json({
        success: false,
        error: "獲取工具統計失敗",
      });
    }
  });

  /**
   * 獲取系統指標趨勢
   */
  router.get("/metrics/:metricName", async (req, res) => {
    try {
      const { metricName } = req.params;
      const hours = parseInt(req.query.hours) || 24;
      const trend = await logMiddleware.getMetricTrend(metricName, hours);

      res.json({
        success: true,
        data: {
          metric: metricName,
          timeRange: `${hours} 小時`,
          trend,
        },
      });
    } catch (error) {
      console.error("獲取指標趨勢失敗:", error);
      res.status(500).json({
        success: false,
        error: "獲取指標趨勢失敗",
      });
    }
  });

  /**
   * 獲取活躍告警
   */
  router.get("/alerts", async (req, res) => {
    try {
      const alerts = await logMiddleware.getActiveAlerts();

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      console.error("獲取告警清單失敗:", error);
      res.status(500).json({
        success: false,
        error: "獲取告警清單失敗",
      });
    }
  });

  /**
   * 建立告警事件
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

      await logMiddleware.logAlert(alertType, severity, message, details || {});

      res.json({
        success: true,
        message: "告警事件已建立",
      });
    } catch (error) {
      console.error("建立告警事件失敗:", error);
      res.status(500).json({
        success: false,
        error: "建立告警事件失敗",
      });
    }
  });

  /**
   * 記錄系統指標
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

      await logMiddleware.logSystemMetric(metricName, parseFloat(value), unit);

      res.json({
        success: true,
        message: "系統指標已記錄",
      });
    } catch (error) {
      console.error("記錄系統指標失敗:", error);
      res.status(500).json({
        success: false,
        error: "記錄系統指標失敗",
      });
    }
  });

  /**
   * 查看檔案日誌 (最近 N 行)
   */
  router.get("/files/:logType/tail", (req, res) => {
    try {
      const { logType } = req.params;
      const lines = parseInt(req.query.lines) || 100;

      const stats = logMiddleware.getLogStats();
      const logPath = stats.files[logType]?.path;

      if (!logPath) {
        return res.status(404).json({
          success: false,
          error: `日誌類型 ${logType} 不存在，可用類型: ${Object.keys(stats.files).join(", ")}`,
        });
      }

      if (!fs.existsSync(logPath)) {
        return res.json({
          success: true,
          data: [],
          message: "日誌檔案尚不存在",
        });
      }

      const fileContent = fs.readFileSync(logPath, "utf8");
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
        filePath: logPath,
      });
    } catch (error) {
      console.error("讀取檔案日誌失敗:", error);
      res.status(500).json({
        success: false,
        error: "讀取檔案日誌失敗",
      });
    }
  });

  /**
   * 搜尋日誌內容
   */
  router.get("/search", (req, res) => {
    try {
      const { q: query, logType = "system", lines = 1000 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "查詢參數 q 是必需的",
        });
      }

      const stats = logMiddleware.getLogStats();
      const logPath = stats.files[logType]?.path;

      if (!logPath) {
        return res.status(404).json({
          success: false,
          error: `日誌類型 ${logType} 不存在`,
        });
      }

      if (!fs.existsSync(logPath)) {
        return res.json({
          success: true,
          data: [],
          message: "日誌檔案尚不存在",
        });
      }

      const fileContent = fs.readFileSync(logPath, "utf8");
      const logLines = fileContent.trim().split("\n").slice(-parseInt(lines));

      // 搜尋包含查詢關鍵字的日誌行
      const matchedLogs = logLines
        .filter(line => line.toLowerCase().includes(query.toLowerCase()))
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
      console.error("搜尋日誌失敗:", error);
      res.status(500).json({
        success: false,
        error: "搜尋日誌失敗",
      });
    }
  });

  return router;
}

export default createLoggingRoutes;
