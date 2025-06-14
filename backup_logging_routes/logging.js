import express from "express";
import fs from "fs";

const router = express.Router();

/**
 * 日誌管理 API 路由
 * 支援檔案和資料庫日誌的統一管理
 */
function createLoggingRoutes(logger) {
  /**
   * 獲取日誌系統狀態
   */
  router.get("/api/logging/status", async (req, res) => {
    try {
      const stats = logger.getLogStats();
      const toolStats = await logger.getToolStats(24);
      const activeAlerts = await logger.getActiveAlerts();

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
      logger.error("獲取日誌狀態失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "獲取日誌狀態失敗",
      });
    }
  });

  /**
   * 獲取工具使用統計
   */
  router.get("/api/logging/tools/stats", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const stats = await logger.getToolStats(hours);

      res.json({
        success: true,
        data: stats,
        timeRange: `${hours} 小時`,
      });
    } catch (error) {
      logger.error("獲取工具統計失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "獲取工具統計失敗",
      });
    }
  });

  /**
   * 獲取系統指標趨勢
   */
  router.get("/api/logging/metrics/:metricName", async (req, res) => {
    try {
      const { metricName } = req.params;
      const hours = parseInt(req.query.hours) || 24;
      const trend = await logger.getMetricTrend(metricName, hours);

      res.json({
        success: true,
        data: {
          metric: metricName,
          timeRange: `${hours} 小時`,
          trend,
        },
      });
    } catch (error) {
      logger.error("獲取指標趨勢失敗", {
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
   */
  router.get("/api/logging/alerts", async (req, res) => {
    try {
      const alerts = await logger.getActiveAlerts();

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      logger.error("獲取告警清單失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "獲取告警清單失敗",
      });
    }
  });

  /**
   * 解決告警
   */
  router.patch("/api/logging/alerts/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;

      await logger.runQuery(
        "UPDATE alert_events SET resolved = 1 WHERE id = ?",
        [id],
      );

      logger.info("告警已解決", { alertId: id });

      res.json({
        success: true,
        message: "告警已標記為已解決",
      });
    } catch (error) {
      logger.error("解決告警失敗", {
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
   * 設定日誌等級
   */
  router.post("/api/logging/level", (req, res) => {
    try {
      const { level } = req.body;

      if (
        !level ||
        !["error", "warn", "info", "debug", "trace"].includes(level)
      ) {
        return res.status(400).json({
          success: false,
          error: "無效的日誌等級，必須是: error, warn, info, debug, trace",
        });
      }

      const oldLevel = logger.logLevel;
      logger.logLevel = level;

      logger.info("日誌等級已更新", {
        oldLevel,
        newLevel: level,
        updatedBy: req.ip,
      });

      res.json({
        success: true,
        message: `日誌等級已從 ${oldLevel} 更新為 ${level}`,
      });
    } catch (error) {
      logger.error("設定日誌等級失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "設定日誌等級失敗",
      });
    }
  });

  /**
   * 查看檔案日誌 (最近 N 行)
   */
  router.get("/api/logging/files/:logType/tail", (req, res) => {
    try {
      const { logType } = req.params;
      const lines = parseInt(req.query.lines) || 100;

      if (!logger.fileLoggers[logType]) {
        return res.status(404).json({
          success: false,
          error: `日誌類型 ${logType} 不存在`,
        });
      }

      const fs = require("fs");
      const filePath = logger.fileLoggers[logType].path;

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
      logger.error("讀取檔案日誌失敗", {
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
   * 記錄系統指標
   */
  router.post("/api/logging/metrics", async (req, res) => {
    try {
      const { metricName, value, unit } = req.body;

      if (!metricName || value === undefined) {
        return res.status(400).json({
          success: false,
          error: "metricName 和 value 是必需的",
        });
      }

      await logger.systemMetric(metricName, parseFloat(value), unit);

      res.json({
        success: true,
        message: "系統指標已記錄",
      });
    } catch (error) {
      logger.error("記錄系統指標失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "記錄系統指標失敗",
      });
    }
  });

  /**
   * 建立告警事件
   */
  router.post("/api/logging/alerts", async (req, res) => {
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

      await logger.alertEvent(alertType, severity, message, details || {});

      logger.warn("新告警事件", { alertType, severity, message });

      res.json({
        success: true,
        message: "告警事件已建立",
      });
    } catch (error) {
      logger.error("建立告警事件失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "建立告警事件失敗",
      });
    }
  });

  /**
   * 日誌搜尋 (檔案)
   */
  router.get("/api/logging/search", (req, res) => {
    try {
      const { q: query, logType = "system", lines = 1000 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "查詢參數 q 是必需的",
        });
      }

      if (!logger.fileLoggers[logType]) {
        return res.status(404).json({
          success: false,
          error: `日誌類型 ${logType} 不存在`,
        });
      }

      const fs = require("fs");
      const filePath = logger.fileLoggers[logType].path;

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
      logger.error("搜尋日誌失敗", { error: error.message });
      res.status(500).json({
        success: false,
        error: "搜尋日誌失敗",
      });
    }
  });

  return router;
}

export default createLoggingRoutes;
