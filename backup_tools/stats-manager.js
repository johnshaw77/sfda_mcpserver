/**
 * 工具使用統計系統
 *
 * 收集、分析和報告工具使用情況的詳細統計資訊
 */

import logger from "../config/logger.js";

/**
 * 統計事件類型
 */
export const StatEventType = {
  TOOL_CALL: "tool_call",
  TOOL_SUCCESS: "tool_success",
  TOOL_ERROR: "tool_error",
  TOOL_TIMEOUT: "tool_timeout",
  PARAMETER_VALIDATION_ERROR: "parameter_validation_error",
  CACHE_HIT: "cache_hit",
  CACHE_MISS: "cache_miss",
};

/**
 * 統計事件記錄
 */
class StatEvent {
  constructor(type, toolName, data = {}) {
    this.id = this._generateId();
    this.type = type;
    this.toolName = toolName;
    this.timestamp = new Date();
    this.data = { ...data };
    this.sessionId = data.sessionId || null;
    this.userId = data.userId || null;
  }

  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * 工具使用統計管理器
 */
export class ToolStatsManager {
  constructor(options = {}) {
    this.events = []; // 儲存所有事件
    this.maxEvents = options.maxEvents || 10000; // 最大事件數量
    this.retentionDays = options.retentionDays || 30; // 資料保留天數
    this.cleanupInterval = options.cleanupInterval || 3600000; // 1 小時清理間隔

    // 實時統計快取
    this.realtimeStats = {
      toolCalls: new Map(), // toolName -> count
      errors: new Map(), // toolName -> errorCount
      performance: new Map(), // toolName -> { totalTime, callCount }
      hourlyStats: new Map(), // hour -> stats
      dailyStats: new Map(), // date -> stats
      userStats: new Map(), // userId -> stats
    };

    // 啟動定期清理
    this.startCleanupTimer();
  }

  /**
   * 記錄統計事件
   */
  recordEvent(type, toolName, data = {}) {
    const event = new StatEvent(type, toolName, data);

    // 添加到事件列表
    this.events.push(event);

    // 更新實時統計
    this._updateRealtimeStats(event);

    // 檢查事件數量限制
    if (this.events.length > this.maxEvents) {
      this._trimOldEvents();
    }

    logger.debug("Stat event recorded", {
      eventId: event.id,
      type: event.type,
      toolName: event.toolName,
      timestamp: event.timestamp,
    });

    return event.id;
  }

  /**
   * 記錄工具調用
   */
  recordToolCall(toolName, params = {}, metadata = {}) {
    return this.recordEvent(StatEventType.TOOL_CALL, toolName, {
      params,
      ...metadata,
    });
  }

  /**
   * 記錄工具成功執行
   */
  recordToolSuccess(toolName, executionTime, result = null, metadata = {}) {
    return this.recordEvent(StatEventType.TOOL_SUCCESS, toolName, {
      executionTime,
      resultSize: result ? JSON.stringify(result).length : 0,
      ...metadata,
    });
  }

  /**
   * 記錄工具執行錯誤
   */
  recordToolError(toolName, error, executionTime = null, metadata = {}) {
    return this.recordEvent(StatEventType.TOOL_ERROR, toolName, {
      errorType: error.type || "unknown",
      errorMessage: error.message,
      executionTime,
      ...metadata,
    });
  }

  /**
   * 記錄緩存命中
   */
  recordCacheHit(toolName, metadata = {}) {
    return this.recordEvent(StatEventType.CACHE_HIT, toolName, metadata);
  }

  /**
   * 記錄緩存未命中
   */
  recordCacheMiss(toolName, metadata = {}) {
    return this.recordEvent(StatEventType.CACHE_MISS, toolName, metadata);
  }

  /**
   * 更新實時統計
   */
  _updateRealtimeStats(event) {
    const { type, toolName, timestamp, data } = event;

    // 更新工具調用計數
    if (type === StatEventType.TOOL_CALL) {
      const currentCount = this.realtimeStats.toolCalls.get(toolName) || 0;
      this.realtimeStats.toolCalls.set(toolName, currentCount + 1);
    }

    // 更新錯誤計數
    if (type === StatEventType.TOOL_ERROR) {
      const currentErrors = this.realtimeStats.errors.get(toolName) || 0;
      this.realtimeStats.errors.set(toolName, currentErrors + 1);
    }

    // 更新效能統計
    if (type === StatEventType.TOOL_SUCCESS && data.executionTime) {
      const perfStats = this.realtimeStats.performance.get(toolName) || {
        totalTime: 0,
        callCount: 0,
        minTime: Infinity,
        maxTime: 0,
      };

      perfStats.totalTime += data.executionTime;
      perfStats.callCount += 1;
      perfStats.minTime = Math.min(perfStats.minTime, data.executionTime);
      perfStats.maxTime = Math.max(perfStats.maxTime, data.executionTime);

      this.realtimeStats.performance.set(toolName, perfStats);
    }

    // 更新時段統計
    this._updateTimeBasedStats(timestamp, type, toolName);

    // 更新用戶統計
    if (data.userId) {
      this._updateUserStats(data.userId, type, toolName);
    }
  }

  /**
   * 更新時段統計
   */
  _updateTimeBasedStats(timestamp, type, toolName) {
    const hour = new Date(timestamp).getHours();
    const date = timestamp.toISOString().split("T")[0];

    // 小時統計
    const hourlyKey = `${date}-${hour.toString().padStart(2, "0")}`;
    const hourlyStats = this.realtimeStats.hourlyStats.get(hourlyKey) || {
      calls: 0,
      errors: 0,
      tools: new Set(),
    };

    if (type === StatEventType.TOOL_CALL) hourlyStats.calls++;
    if (type === StatEventType.TOOL_ERROR) hourlyStats.errors++;
    hourlyStats.tools.add(toolName);

    this.realtimeStats.hourlyStats.set(hourlyKey, hourlyStats);

    // 日統計
    const dailyStats = this.realtimeStats.dailyStats.get(date) || {
      calls: 0,
      errors: 0,
      tools: new Set(),
      users: new Set(),
    };

    if (type === StatEventType.TOOL_CALL) dailyStats.calls++;
    if (type === StatEventType.TOOL_ERROR) dailyStats.errors++;
    dailyStats.tools.add(toolName);

    this.realtimeStats.dailyStats.set(date, dailyStats);
  }

  /**
   * 更新用戶統計
   */
  _updateUserStats(userId, type, toolName) {
    const userStats = this.realtimeStats.userStats.get(userId) || {
      totalCalls: 0,
      totalErrors: 0,
      tools: new Set(),
      firstCall: new Date(),
      lastCall: new Date(),
    };

    if (type === StatEventType.TOOL_CALL) userStats.totalCalls++;
    if (type === StatEventType.TOOL_ERROR) userStats.totalErrors++;
    userStats.tools.add(toolName);
    userStats.lastCall = new Date();

    this.realtimeStats.userStats.set(userId, userStats);
  }

  /**
   * 獲取工具統計摘要
   */
  getToolSummary(toolName) {
    const events = this.events.filter(e => e.toolName === toolName);
    const calls = events.filter(e => e.type === StatEventType.TOOL_CALL).length;
    const successes = events.filter(
      e => e.type === StatEventType.TOOL_SUCCESS,
    ).length;
    const errors = events.filter(
      e => e.type === StatEventType.TOOL_ERROR,
    ).length;
    const cacheHits = events.filter(
      e => e.type === StatEventType.CACHE_HIT,
    ).length;
    const cacheMisses = events.filter(
      e => e.type === StatEventType.CACHE_MISS,
    ).length;

    const perfStats = this.realtimeStats.performance.get(toolName);
    const avgExecutionTime = perfStats
      ? perfStats.totalTime / perfStats.callCount
      : 0;

    const successRate = calls > 0 ? (successes / calls) * 100 : 0;
    const cacheHitRate =
      cacheHits + cacheMisses > 0
        ? (cacheHits / (cacheHits + cacheMisses)) * 100
        : 0;

    return {
      toolName,
      totalCalls: calls,
      successfulCalls: successes,
      failedCalls: errors,
      successRate: successRate.toFixed(2) + "%",
      cacheHits,
      cacheMisses,
      cacheHitRate: cacheHitRate.toFixed(2) + "%",
      avgExecutionTime: avgExecutionTime.toFixed(2) + "ms",
      minExecutionTime: perfStats ? perfStats.minTime + "ms" : "N/A",
      maxExecutionTime: perfStats ? perfStats.maxTime + "ms" : "N/A",
      firstCall: events.length > 0 ? events[0].timestamp : null,
      lastCall: events.length > 0 ? events[events.length - 1].timestamp : null,
    };
  }

  /**
   * 獲取全域統計
   */
  getGlobalStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allEvents = this.events;
    const events24h = allEvents.filter(e => e.timestamp >= last24h);
    const events7d = allEvents.filter(e => e.timestamp >= last7days);

    return {
      overview: {
        totalEvents: allEvents.length,
        totalTools: new Set(allEvents.map(e => e.toolName)).size,
        totalUsers: new Set(allEvents.map(e => e.data.userId).filter(Boolean))
          .size,
        dataRetentionDays: this.retentionDays,
      },
      last24Hours: this._calculatePeriodStats(events24h),
      last7Days: this._calculatePeriodStats(events7d),
      allTime: this._calculatePeriodStats(allEvents),
      topTools: this._getTopTools(allEvents, 10),
      recentErrors: this._getRecentErrors(10),
      performanceMetrics: this._getPerformanceMetrics(),
    };
  }

  /**
   * 計算期間統計
   */
  _calculatePeriodStats(events) {
    const calls = events.filter(e => e.type === StatEventType.TOOL_CALL).length;
    const successes = events.filter(
      e => e.type === StatEventType.TOOL_SUCCESS,
    ).length;
    const errors = events.filter(
      e => e.type === StatEventType.TOOL_ERROR,
    ).length;
    const cacheHits = events.filter(
      e => e.type === StatEventType.CACHE_HIT,
    ).length;
    const cacheMisses = events.filter(
      e => e.type === StatEventType.CACHE_MISS,
    ).length;

    return {
      totalCalls: calls,
      successfulCalls: successes,
      failedCalls: errors,
      successRate:
        calls > 0 ? ((successes / calls) * 100).toFixed(2) + "%" : "0%",
      cacheHits,
      cacheMisses,
      cacheHitRate:
        cacheHits + cacheMisses > 0
          ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(2) + "%"
          : "0%",
      uniqueTools: new Set(events.map(e => e.toolName)).size,
      uniqueUsers: new Set(events.map(e => e.data.userId).filter(Boolean)).size,
    };
  }

  /**
   * 獲取最熱門工具
   */
  _getTopTools(events, limit = 10) {
    const toolCounts = new Map();

    events
      .filter(e => e.type === StatEventType.TOOL_CALL)
      .forEach(e => {
        const count = toolCounts.get(e.toolName) || 0;
        toolCounts.set(e.toolName, count + 1);
      });

    return Array.from(toolCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([toolName, count]) => ({ toolName, count }));
  }

  /**
   * 獲取最近錯誤
   */
  _getRecentErrors(limit = 10) {
    return this.events
      .filter(e => e.type === StatEventType.TOOL_ERROR)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(e => ({
        toolName: e.toolName,
        errorType: e.data.errorType,
        errorMessage: e.data.errorMessage,
        timestamp: e.timestamp,
        executionTime: e.data.executionTime,
      }));
  }

  /**
   * 獲取效能指標
   */
  _getPerformanceMetrics() {
    const metrics = {};

    for (const [toolName, perfStats] of this.realtimeStats.performance) {
      metrics[toolName] = {
        averageTime:
          (perfStats.totalTime / perfStats.callCount).toFixed(2) + "ms",
        minTime: perfStats.minTime + "ms",
        maxTime: perfStats.maxTime + "ms",
        totalCalls: perfStats.callCount,
        totalTime: perfStats.totalTime + "ms",
      };
    }

    return metrics;
  }

  /**
   * 獲取時段分析
   */
  getHourlyAnalysis(date = null) {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const hourlyData = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourKey = `${targetDate}-${hour.toString().padStart(2, "0")}`;
      const stats = this.realtimeStats.hourlyStats.get(hourKey) || {
        calls: 0,
        errors: 0,
        tools: new Set(),
      };

      hourlyData.push({
        hour,
        calls: stats.calls,
        errors: stats.errors,
        uniqueTools: stats.tools.size,
        successRate:
          stats.calls > 0
            ? (((stats.calls - stats.errors) / stats.calls) * 100).toFixed(2) +
              "%"
            : "0%",
      });
    }

    return hourlyData;
  }

  /**
   * 清理過期事件
   */
  _trimOldEvents() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const initialLength = this.events.length;
    this.events = this.events.filter(event => event.timestamp >= cutoffDate);

    const removedCount = initialLength - this.events.length;

    if (removedCount > 0) {
      logger.info("Old stat events cleaned up", {
        removedCount,
        remainingCount: this.events.length,
        cutoffDate,
      });
    }
  }

  /**
   * 啟動清理計時器
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this._trimOldEvents();
    }, this.cleanupInterval);
  }

  /**
   * 停止清理計時器
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 匯出統計資料
   */
  exportStats(format = "json") {
    const data = {
      exportedAt: new Date(),
      globalStats: this.getGlobalStats(),
      toolSummaries: {},
      rawEvents: format === "detailed" ? this.events : [],
    };

    // 為每個工具生成摘要
    const uniqueTools = new Set(this.events.map(e => e.toolName));
    for (const toolName of uniqueTools) {
      data.toolSummaries[toolName] = this.getToolSummary(toolName);
    }

    return data;
  }

  /**
   * 銷毀統計管理器
   */
  destroy() {
    this.stopCleanupTimer();
    this.events = [];
    this.realtimeStats = {
      toolCalls: new Map(),
      errors: new Map(),
      performance: new Map(),
      hourlyStats: new Map(),
      dailyStats: new Map(),
      userStats: new Map(),
    };
  }
}

// 全域統計管理器實例
export const globalStatsManager = new ToolStatsManager({
  maxEvents: 10000,
  retentionDays: 30,
  cleanupInterval: 3600000, // 1 小時
});
