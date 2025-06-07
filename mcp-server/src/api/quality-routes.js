/**
 * 工具品質監控 API 端點
 *
 * 提供工具品質相關的統計、監控和管理功能
 */

import express from "express";
import { globalToolCache } from "../tools/tool-cache.js";
import { globalVersionManager } from "../tools/version-manager.js";
import { globalStatsManager } from "../tools/stats-manager.js";
import logger from "../config/logger.js";

const router = express.Router();

/**
 * 獲取工具品質總覽
 * GET /api/quality/overview
 */
router.get("/overview", (req, res) => {
  try {
    const overview = {
      timestamp: new Date(),
      cache: globalToolCache.getStats(),
      versions: globalVersionManager.getVersionStats(),
      usage: globalStatsManager.getGlobalStats(),
      systemHealth: {
        cacheEnabled: true,
        versionManagementEnabled: true,
        statsTrackingEnabled: true,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    };

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    logger.error("Failed to get quality overview", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve quality overview",
    });
  }
});

/**
 * 獲取緩存狀態和統計
 * GET /api/quality/cache
 */
router.get("/cache", (req, res) => {
  try {
    const cacheStats = globalToolCache.getStats();
    const cacheItems = globalToolCache.getItemsInfo();

    res.json({
      success: true,
      data: {
        stats: cacheStats,
        items: cacheItems,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to get cache stats", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve cache statistics",
    });
  }
});

/**
 * 清空緩存
 * DELETE /api/quality/cache
 */
router.delete("/cache", (req, res) => {
  try {
    const clearedCount = globalToolCache.clear();

    logger.info("Cache cleared manually", { clearedCount });

    res.json({
      success: true,
      message: `Cleared ${clearedCount} cache items`,
      clearedCount,
    });
  } catch (error) {
    logger.error("Failed to clear cache", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to clear cache",
    });
  }
});

/**
 * 刪除特定緩存項目
 * DELETE /api/quality/cache/:key
 */
router.delete("/cache/:key", (req, res) => {
  try {
    const { key } = req.params;
    const deleted = globalToolCache.delete(key);

    if (deleted) {
      logger.info("Cache item deleted", { key });
      res.json({
        success: true,
        message: `Cache item deleted: ${key}`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Cache item not found",
      });
    }
  } catch (error) {
    logger.error("Failed to delete cache item", {
      key: req.params.key,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: "Failed to delete cache item",
    });
  }
});

/**
 * 獲取版本管理資訊
 * GET /api/quality/versions
 */
router.get("/versions", (req, res) => {
  try {
    const versionStats = globalVersionManager.getVersionStats();

    res.json({
      success: true,
      data: versionStats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to get version stats", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve version statistics",
    });
  }
});

/**
 * 獲取特定工具的版本歷史
 * GET /api/quality/versions/:toolName
 */
router.get("/versions/:toolName", (req, res) => {
  try {
    const { toolName } = req.params;
    const currentVersion = globalVersionManager.getToolVersion(toolName);
    const versionHistory = globalVersionManager.getVersionHistory(toolName);

    if (!currentVersion) {
      return res.status(404).json({
        success: false,
        error: "Tool not found",
      });
    }

    res.json({
      success: true,
      data: {
        toolName,
        currentVersion: currentVersion.toString(),
        versionHistory,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to get tool version history", {
      toolName: req.params.toolName,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve tool version history",
    });
  }
});

/**
 * 檢查版本相容性
 * POST /api/quality/versions/check-compatibility
 */
router.post("/versions/check-compatibility", (req, res) => {
  try {
    const { toolName, requiredVersion } = req.body;

    if (!toolName || !requiredVersion) {
      return res.status(400).json({
        success: false,
        error: "toolName and requiredVersion are required",
      });
    }

    const compatibility = globalVersionManager.checkCompatibility(
      toolName,
      requiredVersion,
    );

    res.json({
      success: true,
      data: compatibility,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to check version compatibility", {
      body: req.body,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: "Failed to check version compatibility",
    });
  }
});

/**
 * 獲取使用統計
 * GET /api/quality/stats
 */
router.get("/stats", (req, res) => {
  try {
    const globalStats = globalStatsManager.getGlobalStats();

    res.json({
      success: true,
      data: globalStats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to get usage stats", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve usage statistics",
    });
  }
});

/**
 * 獲取特定工具的使用統計
 * GET /api/quality/stats/:toolName
 */
router.get("/stats/:toolName", (req, res) => {
  try {
    const { toolName } = req.params;
    const toolStats = globalStatsManager.getToolSummary(toolName);

    res.json({
      success: true,
      data: toolStats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to get tool stats", {
      toolName: req.params.toolName,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve tool statistics",
    });
  }
});

/**
 * 獲取時段分析
 * GET /api/quality/stats/hourly-analysis
 */
router.get("/stats/hourly-analysis", (req, res) => {
  try {
    const { date } = req.query;
    const hourlyAnalysis = globalStatsManager.getHourlyAnalysis(date);

    res.json({
      success: true,
      data: {
        date: date || new Date().toISOString().split("T")[0],
        hourlyData: hourlyAnalysis,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to get hourly analysis", {
      query: req.query,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve hourly analysis",
    });
  }
});

/**
 * 匯出統計資料
 * GET /api/quality/stats/export
 */
router.get("/stats/export", (req, res) => {
  try {
    const { format = "json" } = req.query;
    const exportData = globalStatsManager.exportStats(format);

    const filename = `tool-stats-${new Date().toISOString().split("T")[0]}.json`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");

    res.json(exportData);
  } catch (error) {
    logger.error("Failed to export stats", {
      query: req.query,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: "Failed to export statistics",
    });
  }
});

/**
 * 獲取系統健康狀態
 * GET /api/quality/health
 */
router.get("/health", (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    const health = {
      status: "healthy",
      timestamp: new Date(),
      uptime: {
        seconds: uptime,
        humanReadable: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      },
      memory: {
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      },
      components: {
        cache: {
          status: "operational",
          stats: globalToolCache.getStats(),
        },
        versionManager: {
          status: "operational",
          toolCount: globalVersionManager.getVersionStats().totalTools,
        },
        statsManager: {
          status: "operational",
          eventCount: globalStatsManager.getGlobalStats().overview.totalEvents,
        },
      },
    };

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error("Failed to get health status", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve health status",
    });
  }
});

/**
 * 執行系統清理
 * POST /api/quality/cleanup
 */
router.post("/cleanup", (req, res) => {
  try {
    const { components = ["cache", "stats"] } = req.body;
    const results = {};

    if (components.includes("cache")) {
      const cleanedCache = globalToolCache.cleanup();
      results.cache = { cleanedItems: cleanedCache };
    }

    if (components.includes("stats")) {
      // 統計系統有自動清理機制，這裡可以強制執行
      results.stats = { message: "Stats cleanup initiated" };
    }

    logger.info("System cleanup executed", { components, results });

    res.json({
      success: true,
      message: "System cleanup completed",
      results,
    });
  } catch (error) {
    logger.error("Failed to execute cleanup", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to execute system cleanup",
    });
  }
});

export default router;
