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
    const deleted = globalToolCache.deleteItem(key);

    if (deleted) {
      logger.info("Cache item deleted manually", { key });
      res.json({
        success: true,
        message: `Deleted cache item: ${key}`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Cache item not found: ${key}`,
      });
    }
  } catch (error) {
    logger.error("Failed to delete cache item", { 
      error: error.message,
      key: req.params.key
    });
    res.status(500).json({
      success: false,
      error: "Failed to delete cache item",
    });
  }
});

/**
 * 獲取工具版本信息
 * GET /api/quality/versions
 */
router.get("/versions", (req, res) => {
  try {
    const versions = globalVersionManager.getAllVersions();
    
    res.json({
      success: true,
      data: {
        versions,
        count: Object.keys(versions).length,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to get tool versions", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve tool versions",
    });
  }
});

/**
 * 獲取特定工具的統計資料
 * GET /api/quality/stats/:toolName
 */
router.get("/stats/:toolName", (req, res) => {
  try {
    const { toolName } = req.params;
    const stats = globalStatsManager.getToolStats(toolName);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: `No statistics found for tool: ${toolName}`,
      });
    }
    
    res.json({
      success: true,
      data: {
        toolName,
        stats,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to get tool stats", { 
      error: error.message,
      toolName: req.params.toolName 
    });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve tool statistics",
    });
  }
});

/**
 * 獲取全域統計資料
 * GET /api/quality/stats
 */
router.get("/stats", (req, res) => {
  try {
    const globalStats = globalStatsManager.getGlobalStats();
    const topTools = globalStatsManager.getTopTools(5);
    
    res.json({
      success: true,
      data: {
        global: globalStats,
        topTools,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to get global stats", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve global statistics",
    });
  }
});

export default router;
