/**
 * 工具執行緩存系統
 *
 * 提供智能緩存功能，減少重複計算和 API 調用
 */

import crypto from "crypto";
import logger from "../config/logger.js";

/**
 * 緩存項目
 */
class CacheItem {
  constructor(key, value, ttl = 300000) {
    // 默認 5 分鐘 TTL
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.ttl = ttl;
    this.accessCount = 1;
    this.lastAccessed = Date.now();
  }

  /**
   * 檢查緩存是否過期
   */
  isExpired() {
    return Date.now() - this.createdAt > this.ttl;
  }

  /**
   * 訪問緩存項目
   */
  access() {
    this.accessCount++;
    this.lastAccessed = Date.now();
    return this.value;
  }

  /**
   * 獲取緩存項目資訊
   */
  getInfo() {
    return {
      key: this.key,
      createdAt: this.createdAt,
      ttl: this.ttl,
      accessCount: this.accessCount,
      lastAccessed: this.lastAccessed,
      age: Date.now() - this.createdAt,
      isExpired: this.isExpired(),
    };
  }
}

/**
 * 工具緩存管理器
 */
export class ToolCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000; // 最大緩存項目數
    this.defaultTTL = options.defaultTTL || 300000; // 5 分鐘
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 分鐘清理間隔
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      cleanups: 0,
    };

    // 啟動定期清理
    this.startCleanupTimer();
  }

  /**
   * 生成緩存鍵
   */
  generateKey(toolName, params, additionalContext = {}) {
    const keyData = {
      tool: toolName,
      params: this._normalizeParams(params),
      context: additionalContext,
    };

    const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
    return crypto
      .createHash("sha256")
      .update(keyString)
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * 正規化參數（排序、清理）
   */
  _normalizeParams(params) {
    if (!params || typeof params !== "object") return params;

    const normalized = {};
    const keys = Object.keys(params).sort();

    for (const key of keys) {
      const value = params[key];
      if (typeof value === "object" && value !== null) {
        normalized[key] = this._normalizeParams(value);
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * 設置緩存
   */
  set(key, value, ttl = this.defaultTTL) {
    // 檢查緩存大小限制
    if (this.cache.size >= this.maxSize) {
      this._evictOldest();
    }

    const cacheItem = new CacheItem(key, value, ttl);
    this.cache.set(key, cacheItem);
    this.stats.sets++;

    logger.debug("Tool cache set", {
      key,
      ttl,
      cacheSize: this.cache.size,
    });

    return true;
  }

  /**
   * 獲取緩存
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      logger.debug("Tool cache miss", { key });
      return null;
    }

    if (item.isExpired()) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug("Tool cache expired", { key });
      return null;
    }

    this.stats.hits++;
    logger.debug("Tool cache hit", {
      key,
      accessCount: item.accessCount,
    });

    return item.access();
  }

  /**
   * 檢查緩存是否存在且有效
   */
  has(key) {
    const item = this.cache.get(key);
    return item && !item.isExpired();
  }

  /**
   * 刪除緩存
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug("Tool cache deleted", { key });
    }
    return deleted;
  }

  /**
   * 清空所有緩存
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info("Tool cache cleared", { clearedItems: size });
    return size;
  }

  /**
   * 驅逐最舊的緩存項目
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      logger.debug("Tool cache evicted oldest item", { key: oldestKey });
    }
  }

  /**
   * 清理過期緩存
   */
  cleanup() {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, item] of this.cache) {
      if (item.isExpired()) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    this.stats.cleanups++;

    if (cleanedCount > 0) {
      logger.debug("Tool cache cleanup completed", {
        cleanedItems: cleanedCount,
        remainingItems: this.cache.size,
      });
    }

    return cleanedCount;
  }

  /**
   * 啟動定期清理計時器
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
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
   * 獲取緩存統計資訊
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + "%",
      cacheSize: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: this._estimateMemoryUsage(),
    };
  }

  /**
   * 估算記憶體使用量
   */
  _estimateMemoryUsage() {
    let totalSize = 0;

    for (const [key, item] of this.cache) {
      totalSize += key.length * 2; // UTF-16 編碼
      totalSize += JSON.stringify(item.value).length * 2;
      totalSize += 100; // 物件額外開銷估算
    }

    return {
      bytes: totalSize,
      kb: (totalSize / 1024).toFixed(2),
      mb: (totalSize / 1024 / 1024).toFixed(2),
    };
  }

  /**
   * 獲取緩存項目詳細資訊
   */
  getItemsInfo() {
    const items = [];

    for (const [key, item] of this.cache) {
      items.push(item.getInfo());
    }

    return items.sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  /**
   * 銷毀緩存管理器
   */
  destroy() {
    this.stopCleanupTimer();
    this.clear();
  }
}

// 全域緩存實例
export const globalToolCache = new ToolCache({
  maxSize: 1000,
  defaultTTL: 300000, // 5 分鐘
  cleanupInterval: 60000, // 1 分鐘
});
