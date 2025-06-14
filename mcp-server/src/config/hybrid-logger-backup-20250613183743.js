import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 企業級混合式日誌系統
 * 同時支援檔案日誌和 SQLite 查詢
 * 符合 Week 11-14 監控與可觀測性需求
 */
class HybridLogger {
  constructor(options = {}) {
    // 日誌等級定義 - 確保在使用前先定義
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    };
    
    // 現在可以安全使用 parseLogLevel 方法
    this.logLevel = this.parseLogLevel(
      options.logLevel || process.env.LOG_LEVEL || "info",
    );
    this.logDir = options.logDir || path.join(__dirname, "../logs");
    this.dbPath = options.dbPath || path.join(this.logDir, "logs.db");
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB
    this.maxFiles = options.maxFiles || 10;
    this.serviceName = options.serviceName || "mcp-server";
    this.environment =
      options.environment || process.env.NODE_ENV || "development";
    this.useDatabase = options.useDatabase !== false; // 預設啟用資料庫
      
    // 初始化部分邏輯從 constructor 移到 init 方法
    this.ensureLogDirectory();
    this.initLogFiles();
  }

    // 初始化
    this.ensureLogDirectory();
    this.initLogFiles();
    
    // 只有在確保非同步操作不在構造函數中執行
    if (this.useDatabase) {
      // 在下一個事件循環初始化資料庫，避免構造函數中的非同步操作
      setTimeout(() => this.initDatabase(), 0);
    }
  }

  parseLogLevel(level) {
    if (!level) return "info";
    
    const normalizedLevel = level.toLowerCase();
    // 使用更健壯的方式檢查日誌等級是否有效
    const validLevels = ["error", "warn", "info", "debug", "trace"];
    return validLevels.includes(normalizedLevel) ? normalizedLevel : "info";
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  initLogFiles() {
    this.logFiles = {
      combined: path.join(this.logDir, "combined.log"),
      error: path.join(this.logDir, "error.log"),
      tool: path.join(this.logDir, "tool-calls.log"),
      access: path.join(this.logDir, "access.log"),
    };
  }

  async initDatabase() {
    try {
      this.db = new sqlite3.Database(this.dbPath);
      await this.createTables();
      console.log("✅ SQLite 日誌資料庫已初始化");
    } catch (error) {
      console.error("❌ SQLite 初始化失敗:", error);
      this.useDatabase = false;
    }
  }

  async createTables() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL,
        service TEXT NOT NULL,
        environment TEXT NOT NULL,
        message TEXT NOT NULL,
        category TEXT,
        tool_name TEXT,
        duration INTEGER,
        success INTEGER,
        client_id TEXT,
        method TEXT,
        url TEXT,
        status_code INTEGER,
        ip TEXT,
        user_agent TEXT,
        meta TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
      CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category);
      CREATE INDEX IF NOT EXISTS idx_logs_tool_name ON logs(tool_name);
      CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(createTableSQL, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * 建立結構化日誌條目
   */
  createLogEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      environment: this.environment,
      message,
      pid: process.pid,
      ...meta,
    };
  }

  /**
   * 檢查是否應該記錄此等級
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * 雙重寫入：檔案 + 資料庫
   */
  async writeLog(logEntry, logType = "combined") {
    if (!this.shouldLog(logEntry.level.toLowerCase())) {
      return;
    }

    // 1. 寫入檔案 (同步，確保即時性)
    this.writeToFile(logEntry, logType);

    // 2. 寫入資料庫 (非同步，不阻塞主要流程)
    if (this.useDatabase) {
      this.writeToDatabase(logEntry).catch(error => {
        console.error("資料庫寫入失敗:", error);
      });
    }
  }

  /**
   * 寫入檔案 (JSON 格式)
   */
  writeToFile(logEntry, logType) {
    const logLine = JSON.stringify(logEntry) + "\n";
    const fileName = this.logFiles[logType] || this.logFiles.combined;

    try {
      this.rotateLogIfNeeded(fileName);
      fs.appendFileSync(fileName, logLine);

      if (this.environment === "development") {
        this.consoleOutput(logEntry);
      }
    } catch (error) {
      console.error("檔案日誌寫入失敗:", error);
    }
  }

  /**
   * 寫入資料庫
   */
  async writeToDatabase(logEntry) {
    if (!this.db) return;

    const sql = `
      INSERT INTO logs (
        timestamp, level, service, environment, message, category,
        tool_name, duration, success, client_id, method, url,
        status_code, ip, user_agent, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      logEntry.timestamp,
      logEntry.level,
      logEntry.service,
      logEntry.environment,
      logEntry.message,
      logEntry.category || null,
      logEntry.toolName || null,
      logEntry.duration || null,
      logEntry.success !== undefined ? (logEntry.success ? 1 : 0) : null,
      logEntry.clientId || null,
      logEntry.method || null,
      logEntry.url || null,
      logEntry.statusCode || null,
      logEntry.ip || null,
      logEntry.userAgent || null,
      JSON.stringify(logEntry.meta || {}),
    ];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  /**
   * 控制台輸出 (開發環境)
   */
  consoleOutput(logEntry) {
    const colors = {
      ERROR: "\x1b[31m",
      WARN: "\x1b[33m",
      INFO: "\x1b[36m",
      DEBUG: "\x1b[90m",
      TRACE: "\x1b[37m",
    };

    const resetColor = "\x1b[0m";
    const color = colors[logEntry.level] || "";

    console.log(
      `${color}[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message}${resetColor}`,
    );
  }

  /**
   * 日誌輪轉機制
   */
  rotateLogIfNeeded(fileName) {
    if (!fs.existsSync(fileName)) return;

    const stats = fs.statSync(fileName);
    if (stats.size < this.maxFileSize) return;

    const baseFileName = fileName.replace(".log", "");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const rotatedFileName = `${baseFileName}.${timestamp}.log`;

    try {
      fs.renameSync(fileName, rotatedFileName);
      this.cleanupOldLogs(baseFileName);

      this.info("日誌檔案已輪轉", {
        originalFile: fileName,
        rotatedFile: rotatedFileName,
        fileSize: stats.size,
      });
    } catch (error) {
      console.error("日誌輪轉失敗:", error);
    }
  }

  /**
   * 清理舊日誌檔案
   */
  cleanupOldLogs(baseFileName) {
    const logDir = path.dirname(baseFileName);
    const baseName = path.basename(baseFileName);

    try {
      const files = fs
        .readdirSync(logDir)
        .filter(file => file.startsWith(baseName) && file.includes(".log"))
        .map(file => ({
          name: file,
          path: path.join(logDir, file),
          stat: fs.statSync(path.join(logDir, file)),
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime);

      if (files.length > this.maxFiles) {
        const filesToDelete = files.slice(this.maxFiles);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error("清理舊日誌檔案失敗:", error);
    }
  }

  // 基本日誌方法
  async error(message, meta = {}) {
    const logEntry = this.createLogEntry("error", message, meta);
    await this.writeLog(logEntry, "error");
    await this.writeLog(logEntry, "combined");
  }

  async warn(message, meta = {}) {
    const logEntry = this.createLogEntry("warn", message, meta);
    await this.writeLog(logEntry, "combined");
  }

  async info(message, meta = {}) {
    const logEntry = this.createLogEntry("info", message, meta);
    await this.writeLog(logEntry, "combined");
  }

  async debug(message, meta = {}) {
    const logEntry = this.createLogEntry("debug", message, meta);
    await this.writeLog(logEntry, "combined");
  }

  async trace(message, meta = {}) {
    const logEntry = this.createLogEntry("trace", message, meta);
    await this.writeLog(logEntry, "combined");
  }

  // 特殊用途日誌方法
  async toolCall(toolName, params, result, duration, clientId = null) {
    const logEntry = this.createLogEntry("info", "工具調用", {
      category: "tool-call",
      toolName,
      params: this.sanitizeParams(params),
      success: !result.error,
      duration,
      clientId,
    });
    await this.writeLog(logEntry, "tool");
  }

  async apiAccess(req, res, duration) {
    const logEntry = this.createLogEntry("info", "API 存取", {
      category: "api-access",
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      duration,
    });
    await this.writeLog(logEntry, "access");
  }

  async systemEvent(event, data = {}) {
    const logEntry = this.createLogEntry("info", "系統事件", {
      category: "system-event",
      event,
      data,
    });
    await this.writeLog(logEntry, "combined");
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

  /**
   * SQL 查詢介面
   */
  async queryLogs(options = {}) {
    if (!this.useDatabase || !this.db) {
      throw new Error("資料庫查詢不可用");
    }

    const {
      level,
      category,
      toolName,
      startTime,
      endTime,
      limit = 100,
      offset = 0,
    } = options;

    let sql = "SELECT * FROM logs WHERE 1=1";
    const params = [];

    if (level) {
      sql += " AND level = ?";
      params.push(level.toUpperCase());
    }

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    if (toolName) {
      sql += " AND tool_name = ?";
      params.push(toolName);
    }

    if (startTime) {
      sql += " AND timestamp >= ?";
      params.push(startTime);
    }

    if (endTime) {
      sql += " AND timestamp <= ?";
      params.push(endTime);
    }

    sql += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 獲取統計資訊
   */
  async getStats() {
    const fileStats = this.getFileStats();

    if (this.useDatabase && this.db) {
      const dbStats = await this.getDatabaseStats();
      return { ...fileStats, database: dbStats };
    }

    return fileStats;
  }

  getFileStats() {
    const stats = {};

    Object.entries(this.logFiles).forEach(([type, filePath]) => {
      try {
        if (fs.existsSync(filePath)) {
          const fileStats = fs.statSync(filePath);
          stats[type] = {
            size: fileStats.size,
            lastModified: fileStats.mtime,
            exists: true,
          };
        } else {
          stats[type] = { exists: false };
        }
      } catch (error) {
        stats[type] = { error: error.message };
      }
    });

    return {
      currentLogLevel: this.logLevel,
      logDirectory: this.logDir,
      maxFileSize: this.maxFileSize,
      maxFiles: this.maxFiles,
      files: stats,
    };
  }

  async getDatabaseStats() {
    if (!this.useDatabase || !this.db) {
      return null;
    }

    const queries = [
      "SELECT COUNT(*) as totalLogs FROM logs",
      "SELECT level, COUNT(*) as count FROM logs GROUP BY level",
      "SELECT category, COUNT(*) as count FROM logs WHERE category IS NOT NULL GROUP BY category",
      "SELECT tool_name, COUNT(*) as count FROM logs WHERE tool_name IS NOT NULL GROUP BY tool_name ORDER BY count DESC LIMIT 10",
    ];

    try {
      const results = await Promise.all(
        queries.map(
          query =>
            new Promise((resolve, reject) => {
              this.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
              });
            }),
        ),
      );

      return {
        totalLogs: results[0][0].totalLogs,
        logsByLevel: results[1],
        logsByCategory: results[2],
        topTools: results[3],
      };
    } catch (error) {
      console.error("獲取資料庫統計失敗:", error);
      return { error: error.message };
    }
  }

  /**
   * 設定日誌等級
   */
  setLogLevel(level) {
    const normalizedLevel = this.parseLogLevel(level);
    this.logLevel = normalizedLevel;
    this.info("日誌等級已更新", { newLevel: normalizedLevel });
  }

  /**
   * 手動觸發日誌輪轉
   */
  rotateAllLogs() {
    Object.values(this.logFiles).forEach(filePath => {
      this.rotateLogIfNeeded(filePath);
    });
    this.info("手動日誌輪轉已完成");
  }

  /**
   * 關閉日誌系統
   */
  async close() {
    if (this.db) {
      return new Promise(resolve => {
        this.db.close(err => {
          if (err) {
            console.error("關閉資料庫失敗:", err);
          } else {
            console.log("資料庫連接已關閉");
          }
          resolve();
        });
      });
    }
  }
}

// 建立全域日誌實例
const hybridLogger = new HybridLogger({
  serviceName: "mcp-server",
  logLevel: process.env.LOG_LEVEL || "info",
  environment: process.env.NODE_ENV || "development",
  useDatabase: process.env.USE_DATABASE_LOGGING !== "false",
});

export { HybridLogger };
export default hybridLogger;
