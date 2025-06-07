import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 混合式日誌系統
 * 結合檔案和 SQLite 的優勢
 */
export class HybridLogger {
  constructor(options = {}) {
    // 日誌等級對應
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    };

    this.logLevel = this.parseLogLevel(
      options.logLevel || process.env.LOG_LEVEL || "info",
    );
    this.logDir = options.logDir || path.join(__dirname, "../../logs");
    this.dbPath = options.dbPath || path.join(this.logDir, "analytics.db");
    this.serviceName = options.serviceName || "mcp-server";
    this.environment =
      options.environment || process.env.NODE_ENV || "development";

    // 初始化
    this.ensureLogDirectory();
    this.initFileLoggers();
    this.initDatabase();
  }

  parseLogLevel(level) {
    const normalizedLevel = level.toLowerCase();
    return this.levels.hasOwnProperty(normalizedLevel)
      ? normalizedLevel
      : "info";
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 初始化檔案日誌器
   * 用於高頻、即時日誌
   */
  initFileLoggers() {
    this.fileLoggers = {
      // 系統運行日誌 (高頻寫入)
      system: {
        path: path.join(this.logDir, "system.log"),
        stream: null,
      },

      // API 存取日誌 (每個請求)
      access: {
        path: path.join(this.logDir, "access.log"),
        stream: null,
      },

      // 錯誤日誌 (需要即時查看)
      error: {
        path: path.join(this.logDir, "error.log"),
        stream: null,
      },

      // 調試日誌 (開發環境)
      debug: {
        path: path.join(this.logDir, "debug.log"),
        stream: null,
      },
    };

    // 建立寫入串流
    Object.keys(this.fileLoggers).forEach(key => {
      this.fileLoggers[key].stream = fs.createWriteStream(
        this.fileLoggers[key].path,
        { flags: "a" },
      );
    });
  }

  /**
   * 初始化 SQLite 資料庫
   * 用於統計分析和查詢
   */
  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, err => {
        if (err) {
          console.error("SQLite 初始化失敗:", err);
          reject(err);
        } else {
          this.createAnalyticsTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createAnalyticsTables() {
    const tables = [
      // 工具調用統計表
      `CREATE TABLE IF NOT EXISTS tool_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_name TEXT NOT NULL,
        success INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        error_type TEXT,
        client_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        date TEXT NOT NULL,
        hour INTEGER NOT NULL
      )`,

      // 系統指標表
      `CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        unit TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        date TEXT NOT NULL,
        hour INTEGER NOT NULL
      )`,

      // 告警事件表
      `CREATE TABLE IF NOT EXISTS alert_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        details TEXT,
        resolved INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 建立索引
      `CREATE INDEX IF NOT EXISTS idx_tool_analytics_date_tool ON tool_analytics(date, tool_name)`,
      `CREATE INDEX IF NOT EXISTS idx_system_metrics_date_metric ON system_metrics(date, metric_name)`,
      `CREATE INDEX IF NOT EXISTS idx_alert_events_timestamp ON alert_events(timestamp)`,
    ];

    for (const sql of tables) {
      await this.runQuery(sql);
    }
  }

  async runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * 建立結構化日誌條目
   */
  createLogEntry(level, message, meta = {}) {
    const now = new Date();
    return {
      timestamp: now.toISOString(),
      level: level.toUpperCase(),
      service: this.serviceName,
      environment: this.environment,
      message,
      pid: process.pid,
      ...meta,
    };
  }

  /**
   * 寫入檔案日誌 (高頻、即時)
   */
  writeToFile(logEntry, logType = "system") {
    if (!this.shouldLog(logEntry.level.toLowerCase())) {
      return;
    }

    const logLine = JSON.stringify(logEntry) + "\n";
    const logger = this.fileLoggers[logType];

    if (logger && logger.stream) {
      logger.stream.write(logLine);
    }

    // 開發環境也輸出到控制台
    if (this.environment === "development") {
      this.consoleOutput(logEntry);
    }
  }

  /**
   * 寫入 SQLite (分析、統計)
   */
  async writeToDatabase(type, data) {
    if (!this.db) {
      console.warn("SQLite 資料庫未初始化");
      return;
    }

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const hour = now.getHours();

    try {
      switch (type) {
        case "tool_analytics":
          await this.runQuery(
            `INSERT INTO tool_analytics 
             (tool_name, success, duration, error_type, client_id, date, hour) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              data.toolName,
              data.success ? 1 : 0,
              data.duration,
              data.errorType || null,
              data.clientId || null,
              date,
              hour,
            ],
          );
          break;

        case "system_metrics":
          await this.runQuery(
            `INSERT INTO system_metrics 
             (metric_name, metric_value, unit, date, hour) 
             VALUES (?, ?, ?, ?, ?)`,
            [data.metricName, data.value, data.unit || null, date, hour],
          );
          break;

        case "alert_events":
          await this.runQuery(
            `INSERT INTO alert_events 
             (alert_type, severity, message, details) 
             VALUES (?, ?, ?, ?)`,
            [
              data.alertType,
              data.severity,
              data.message,
              JSON.stringify(data.details) || null,
            ],
          );
          break;
      }
    } catch (error) {
      console.error(`SQLite 寫入失敗 (${type}):`, error);
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  consoleOutput(logEntry) {
    const colors = {
      ERROR: "\x1b[31m", // 紅色
      WARN: "\x1b[33m", // 黃色
      INFO: "\x1b[36m", // 青色
      DEBUG: "\x1b[90m", // 灰色
      TRACE: "\x1b[37m", // 白色
    };

    const resetColor = "\x1b[0m";
    const color = colors[logEntry.level] || "";

    console.log(
      `${color}[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message}${resetColor}`,
      logEntry.meta ? logEntry.meta : "",
    );
  }

  // === 日誌等級方法 ===

  error(message, meta = {}) {
    const logEntry = this.createLogEntry("error", message, meta);
    this.writeToFile(logEntry, "error");
    this.writeToFile(logEntry, "system");
  }

  warn(message, meta = {}) {
    const logEntry = this.createLogEntry("warn", message, meta);
    this.writeToFile(logEntry, "system");
  }

  info(message, meta = {}) {
    const logEntry = this.createLogEntry("info", message, meta);
    this.writeToFile(logEntry, "system");
  }

  debug(message, meta = {}) {
    const logEntry = this.createLogEntry("debug", message, meta);
    this.writeToFile(logEntry, "debug");
  }

  trace(message, meta = {}) {
    const logEntry = this.createLogEntry("trace", message, meta);
    this.writeToFile(logEntry, "debug");
  }

  // === 特殊用途方法 ===

  /**
   * API 存取日誌 (檔案)
   */
  apiAccess(req, res, duration) {
    const logEntry = this.createLogEntry("info", "API 存取", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      duration,
      category: "api-access",
    });
    this.writeToFile(logEntry, "access");
  }

  /**
   * 工具調用日誌 (檔案 + 資料庫)
   */
  async toolCall(toolName, params, result, duration, clientId = null) {
    // 1. 寫入檔案 (即時日誌)
    const logEntry = this.createLogEntry("info", "工具調用", {
      toolName,
      params: this.sanitizeParams(params),
      success: !result.error,
      duration,
      clientId,
      category: "tool-call",
    });
    this.writeToFile(logEntry, "system");

    // 2. 寫入資料庫 (分析用)
    await this.writeToDatabase("tool_analytics", {
      toolName,
      success: !result.error,
      duration,
      errorType: result.error ? result.error.type : null,
      clientId,
    });
  }

  /**
   * 系統指標記錄 (資料庫)
   */
  async systemMetric(metricName, value, unit = null) {
    await this.writeToDatabase("system_metrics", {
      metricName,
      value,
      unit,
    });
  }

  /**
   * 告警事件記錄 (資料庫)
   */
  async alertEvent(alertType, severity, message, details = {}) {
    await this.writeToDatabase("alert_events", {
      alertType,
      severity,
      message,
      details,
    });
  }

  /**
   * 工具調用日誌記錄 (新方法 - 支援狀態追蹤)
   */
  async logToolCall(data) {
    const {
      toolName,
      executionId,
      status,
      params,
      context,
      executionTime,
      error,
      resultSize,
      cacheKey,
    } = data;

    // 1. 寫入檔案日誌 (即時記錄)
    const logEntry = this.createLogEntry("info", `工具調用: ${status}`, {
      toolName,
      executionId,
      status,
      params: params ? this.sanitizeParams(params) : undefined,
      context,
      executionTime,
      error: error ? { message: error.message, type: error.type } : undefined,
      resultSize,
      cacheKey,
      category: "tool-execution",
    });
    this.writeToFile(logEntry, "system");

    // 2. 如果是完成狀態，寫入資料庫 (統計用)
    if (status === "success" || status === "error") {
      await this.writeToDatabase("tool_analytics", {
        toolName,
        success: status === "success",
        duration: executionTime || 0,
        errorType: error ? error.type : null,
        clientId: context?.userId || null,
      });
    }
  }

  /**
   * 清理敏感參數
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    const sensitiveFields = ["password", "token", "apiKey", "secret"];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = "***";
      }
    });

    return sanitized;
  }

  // === 查詢和統計方法 ===

  /**
   * 獲取工具使用統計
   */
  async getToolStats(hours = 24) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT 
        tool_name,
        COUNT(*) as total_calls,
        SUM(success) as successful_calls,
        AVG(duration) as avg_duration,
        MAX(timestamp) as last_call
      FROM tool_analytics 
      WHERE timestamp > datetime('now', '-${hours} hours')
      GROUP BY tool_name
      ORDER BY total_calls DESC`;

      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 獲取系統指標趨勢
   */
  async getMetricTrend(metricName, hours = 24) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT 
        date,
        hour,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        COUNT(*) as sample_count
      FROM system_metrics 
      WHERE metric_name = ? AND timestamp > datetime('now', '-${hours} hours')
      GROUP BY date, hour
      ORDER BY date, hour`;

      this.db.all(sql, [metricName], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 獲取未解決的告警
   */
  async getActiveAlerts() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM alert_events 
                   WHERE resolved = 0 
                   ORDER BY timestamp DESC`;

      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 獲取日誌統計
   */
  getLogStats() {
    const fileStats = {};

    Object.entries(this.fileLoggers).forEach(([type, logger]) => {
      try {
        if (fs.existsSync(logger.path)) {
          const stats = fs.statSync(logger.path);
          fileStats[type] = {
            size: stats.size,
            lastModified: stats.mtime,
            exists: true,
          };
        } else {
          fileStats[type] = { exists: false };
        }
      } catch (error) {
        fileStats[type] = { error: error.message };
      }
    });

    return {
      currentLogLevel: this.logLevel,
      logDirectory: this.logDir,
      databasePath: this.dbPath,
      files: fileStats,
      strategy: "hybrid",
    };
  }

  /**
   * 清理資源
   */
  close() {
    // 關閉檔案串流
    Object.values(this.fileLoggers).forEach(logger => {
      if (logger.stream) {
        logger.stream.end();
      }
    });

    // 關閉資料庫連接
    if (this.db) {
      this.db.close();
    }
  }
}

export default HybridLogger;
