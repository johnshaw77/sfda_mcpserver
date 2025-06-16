/**
 * 模組註冊器
 *
 * 集中管理所有工具模組，便於在單一文件中查看和修改模組列表
 * 注意：此文件即將被移除，所有模組已遷移到新的自註冊架構
 */

import logger from "../config/logger.js";

// 導入所有模組路由
import hrRoutes from "./hr-routes.js";
import toolsRoutes from "./tools-routes.js";
import loggingRoutes from "./logging-routes.js";

/**
 * 模組註冊表
 * 包含所有可用的工具模組及其路由
 *
 * 注意：所有模組已遷移到新的自註冊架構，請參考 /docs/hr-module-migration.md
 * 舊模組將保留一段時間以確保向後兼容，最終將被移除
 */
const moduleRegistry = [
  {
    name: "hr",
    description:
      "人力資源管理模組，提供員工資訊查詢、出勤記錄、薪資查詢、部門管理等功能",
    path: "/api/hr",
    router: hrRoutes,
    tools: ["get_employee", "search_employees", "get_employee_count"],
    deprecated: true, // 標記為已棄用
    migrationNote:
      "已遷移到新的自註冊架構，請參考 /docs/hr-module-migration.md",
  },
  {
    name: "tools",
    description: "工具管理模組，提供統一的工具調用、列表、統計和健康檢查端點",
    path: "/api/tools",
    router: toolsRoutes,
    tools: [], // 此模組使用單獨的路由定義，涵蓋所有工具
  },
  {
    name: "logging",
    description: "日誌管理模組，提供日誌查詢、統計、等級設定和輪轉功能",
    path: "/api/logs",
    router: loggingRoutes(logger),
    tools: [], // 此模組使用單獨的路由定義
  },
];

/**
 * 註冊所有模組路由到 Express 應用
 * @param {Express.Application} app - Express 應用實例
 *
 * 注意：所有模組已遷移到新的自註冊架構，請參考 /docs/hr-module-migration.md
 * 此函數將保留一段時間以確保向後兼容，最終將被移除或重構
 */
export function registerAllModules(app) {
  logger.warn("使用棄用的模組註冊方法，即將被移除");

  moduleRegistry.forEach(module => {
    app.use(module.path, module.router);
    console.log(`Registered legacy module: ${module.name} at ${module.path}`);
  });
}

/**
 * 獲取所有註冊模組的資訊
 * @returns {Array} 模組資訊列表
 */
export function getAllModulesInfo() {
  return moduleRegistry.map(module => ({
    name: module.name,
    description: module.description,
    endpoint: `${module.path}/:toolName`,
    tools: module.tools,
  }));
}

export default moduleRegistry;
