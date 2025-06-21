/**
 * 中央路由管理
 *
 * 負責註冊所有模組的路由
 */

import hrRoutes from "./hr-routes.js";
import milRoutes from "./mil-routes.js";
import statRoutes from "./stat-routes.js";
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

  // 註冊 MIL 模組路由
  app.use("/api/mil", milRoutes);
  logger.info("MIL module routes registered at /api/mil");

  // 註冊 STAT 模組路由
  app.use("/api/stat", statRoutes);
  logger.info("STAT module routes registered at /api/stat");

  logger.info("All module routes registered successfully");
}
