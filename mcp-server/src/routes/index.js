/**
 * 中央路由管理
 *
 * 負責註冊所有模組的路由
 */

import hrRoutes from "./hr-routes.js";
import logger from "../config/logger.js";

/**
 * 註冊所有模組路由
 * @param {object} app - Express 應用實例
 * @param {object} toolManager - 工具管理器實例 (未使用)
 */
export function registerAllRoutes(app, toolManager) {
  logger.info("Starting module routes registration...");

  // 註冊 HR 模組路由
  app.use("/api/hr", hrRoutes);
  logger.info("HR module routes registered at /api/hr");

  logger.info("All module routes registered successfully");
}
