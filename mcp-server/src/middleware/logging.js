import HybridLogger from "../logging/hybrid-logger.js";

/**
 * 日誌中介層
 * 整合 Winston 和 HybridLogger
 */
class LoggingMiddleware {
  constructor() {
    // 初始化混合日誌器
    this.hybridLogger = new HybridLogger({
      logLevel: process.env.LOG_LEVEL || "info",
      serviceName: "mcp-server",
    });
  }

  /**
   * API 存取日誌中介層
   */
  accessLogger() {
    return (req, res, next) => {
      const startTime = Date.now();

      // 原始 end 方法
      const originalEnd = res.end;

      // 覆蓋 end 方法以記錄響應
      res.end = function (...args) {
        const duration = Date.now() - startTime;

        // 記錄到混合日誌系統
        logMiddleware.hybridLogger.apiAccess(req, res, duration);

        // 調用原始 end 方法
        originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * 工具調用日誌
   */
  async logToolCall(toolName, params, result, duration, clientId = null) {
    await this.hybridLogger.toolCall(
      toolName,
      params,
      result,
      duration,
      clientId,
    );
  }

  /**
   * 系統指標記錄
   */
  async logSystemMetric(metricName, value, unit = null) {
    await this.hybridLogger.systemMetric(metricName, value, unit);
  }

  /**
   * 告警事件記錄
   */
  async logAlert(alertType, severity, message, details = {}) {
    await this.hybridLogger.alertEvent(alertType, severity, message, details);
  }

  /**
   * 錯誤處理中介層
   */
  errorLogger() {
    return (err, req, res, next) => {
      // 記錄到混合日誌系統
      this.hybridLogger.error("API 錯誤", {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // 記錄嚴重錯誤為告警
      if (err.status >= 500) {
        this.logAlert("api_error", "high", `伺服器錯誤: ${err.message}`, {
          method: req.method,
          url: req.url,
          stack: err.stack,
        });
      }

      next(err);
    };
  }

  /**
   * 健康狀態監控
   */
  startHealthMonitoring() {
    // 每分鐘記錄一次系統指標
    setInterval(async () => {
      try {
        const memUsage = process.memoryUsage();

        // 記錄記憶體使用情況
        await this.logSystemMetric(
          "memory_heap_used",
          memUsage.heapUsed / 1024 / 1024,
          "MB",
        );
        await this.logSystemMetric(
          "memory_heap_total",
          memUsage.heapTotal / 1024 / 1024,
          "MB",
        );
        await this.logSystemMetric(
          "memory_external",
          memUsage.external / 1024 / 1024,
          "MB",
        );

        // 記錄 CPU 使用情況 (簡單的進程運行時間)
        const cpuUsage = process.cpuUsage();
        await this.logSystemMetric("cpu_user_time", cpuUsage.user / 1000, "ms");
        await this.logSystemMetric(
          "cpu_system_time",
          cpuUsage.system / 1000,
          "ms",
        );

        // 檢查記憶體洩漏警告
        if (memUsage.heapUsed > 500 * 1024 * 1024) {
          // 500MB
          await this.logAlert("memory_warning", "medium", "記憶體使用量過高", {
            heapUsed: memUsage.heapUsed / 1024 / 1024,
            threshold: 500,
          });
        }
      } catch (error) {
        console.error("健康監控記錄失敗:", error);
      }
    }, 60000); // 每分鐘
  }

  /**
   * 獲取日誌統計
   */
  getLogStats() {
    return this.hybridLogger.getLogStats();
  }

  /**
   * 獲取工具統計
   */
  async getToolStats(hours = 24) {
    return await this.hybridLogger.getToolStats(hours);
  }

  /**
   * 獲取指標趨勢
   */
  async getMetricTrend(metricName, hours = 24) {
    return await this.hybridLogger.getMetricTrend(metricName, hours);
  }

  /**
   * 獲取活躍告警
   */
  async getActiveAlerts() {
    return await this.hybridLogger.getActiveAlerts();
  }

  /**
   * 清理資源
   */
  close() {
    this.hybridLogger.close();
  }
}

// 建立單例實例
const logMiddleware = new LoggingMiddleware();

export default logMiddleware;
