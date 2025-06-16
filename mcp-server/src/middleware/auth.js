/**
 * 身份驗證中間件
 *
 * 提供簡單的身份驗證功能，將來可以擴展為完整的身份驗證系統
 */

import logger from "../config/logger.js";

/**
 * 簡單的身份驗證中間件
 * 目前只是記錄請求，不進行實際身份驗證
 */
export const authMiddleware = (req, res, next) => {
  // 記錄請求
  logger.debug("認證中間件執行", {
    path: req.path,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // 為將來的身份驗證添加佔位符
  // 目前不驗證身份，直接通過並設置空的用戶對象
  req.user = {
    authenticated: true,
    id: "system",
    roles: ["user"],
  };

  next();
};

export default authMiddleware;
