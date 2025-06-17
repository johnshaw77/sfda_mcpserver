/**
 * 舊版 API 端點重定向
 *
 * 此檔案處理舊版 `/tools/` 端點向新版 `/api/tools/` 端點的重定向
 * 為向後相容而保留，新應用應直接使用 `/api/tools/` 端點
 */

import express from "express";
import logger from "../config/logger.js";

const router = express.Router();

/**
 * 註冊舊版路由重定向
 * @param {express.Application} app - Express 應用實例
 */
export function registerLegacyRoutes(app) {
  // 工具列表重定向
  app.get("/tools", (req, res) => {
    logger.info("Legacy endpoint redirected: /tools -> /api/tools");
    res.redirect("/api/tools");
  });

  // 工具調用重定向
  app.post("/tools/:toolName", (req, res) => {
    const { toolName } = req.params;
    logger.info(
      `Legacy endpoint redirected: /tools/${toolName} -> /api/tools/${toolName}`,
    );
    res.redirect(307, `/api/tools/${toolName}`); // 307 保留 POST 方法和請求體
  });

  // 工具統計重定向
  app.get("/tools/stats", (req, res) => {
    logger.info("Legacy endpoint redirected: /tools/stats -> /api/tools/stats");
    res.redirect("/api/tools/stats");
  });

  // 特定工具統計重定向
  app.get("/tools/:toolName/stats", (req, res) => {
    const { toolName } = req.params;
    logger.info(
      `Legacy endpoint redirected: /tools/${toolName}/stats -> /api/tools/${toolName}/stats`,
    );
    res.redirect(`/api/tools/${toolName}/stats`);
  });

  // 工具健康檢查重定向
  app.get("/tools/health", (req, res) => {
    logger.info(
      "Legacy endpoint redirected: /tools/health -> /api/tools/health",
    );
    res.redirect("/api/tools/health");
  });

  logger.info("Legacy routes registered for backward compatibility");
}

export default registerLegacyRoutes;
