/**
 * 日誌系統包裝器
 *
 * 為了確保系統中的日誌統一性，此模組現在作為 hybridLogger 的包裝器
 * 舊的 Winston 日誌器已被移除，以避免系統中存在兩套日誌系統
 */

import hybridLogger from "./hybrid-logger.js";

// 為了向後兼容，我們提供與 Winston 日誌器相同的介面
const logger = {
  error: (message, meta = {}) => hybridLogger.error(message, meta),
  warn: (message, meta = {}) => hybridLogger.warn(message, meta),
  info: (message, meta = {}) => hybridLogger.info(message, meta),
  debug: (message, meta = {}) => hybridLogger.debug(message, meta),
  verbose: (message, meta = {}) => hybridLogger.trace(message, meta),
  log: (level, message, meta = {}) => {
    switch (level.toLowerCase()) {
      case "error":
        return hybridLogger.error(message, meta);
      case "warn":
        return hybridLogger.warn(message, meta);
      case "info":
        return hybridLogger.info(message, meta);
      case "debug":
        return hybridLogger.debug(message, meta);
      case "verbose":
      case "trace":
        return hybridLogger.trace(message, meta);
      default:
        return hybridLogger.info(message, meta);
    }
  },
};

export default logger;
