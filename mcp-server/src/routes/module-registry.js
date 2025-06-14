/**
 * 模組註冊器
 *
 * 集中管理所有工具模組，便於在單一文件中查看和修改模組列表
 */

import logger from "../config/logger.js";

// 導入所有模組路由
import hrRoutes from "./hr-routes.js";
import financeRoutes from "./finance-routes.js";
import tasksRoutes from "./tasks-routes.js";
import complaintsRoutes from "./complaints-routes.js";
import qualityRoutes from "./quality-routes.js";
import toolsRoutes from "./tools-routes.js";
import loggingRoutes from "./logging-routes.js";

/**
 * 模組註冊表
 * 包含所有可用的工具模組及其路由
 *
 * 當添加新模組時，只需在此處註冊即可
 */
const moduleRegistry = [
  {
    name: "hr",
    description:
      "人力資源管理模組，提供員工資訊查詢、出勤記錄、薪資查詢、部門管理等功能",
    path: "/api/hr",
    router: hrRoutes,
    tools: [
      "get_employee_info",
      "get_employee_list",
      "get_attendance_record",
      "get_salary_info",
      "get_department_list",
    ],
  },
  {
    name: "finance",
    description: "財務管理模組，提供預算狀態查詢、財務報表、成本分析等功能",
    path: "/api/finance",
    router: financeRoutes,
    tools: ["get_budget_status"],
  },
  {
    name: "tasks",
    description:
      "任務管理模組，提供任務創建、列表查詢、狀態追蹤、專案管理等功能",
    path: "/api/tasks",
    router: tasksRoutes,
    tools: ["create_task", "get_task_list"],
  },
  {
    name: "complaints",
    description: "客訴管理模組，提供客訴查詢、統計、狀態更新等功能",
    path: "/api/complaints",
    router: complaintsRoutes,
    tools: [
      "get_complaints_list",
      "get_complaint_detail",
      "get_complaints_statistics",
      "update_complaint_status",
    ],
  },
  {
    name: "quality",
    description: "品質監控模組，提供工具品質監控、統計、緩存管理等功能",
    path: "/api/quality",
    router: qualityRoutes,
    tools: [], // 此模組使用單獨的路由定義
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
 */
export function registerAllModules(app) {
  moduleRegistry.forEach(module => {
    app.use(module.path, module.router);
    console.log(`Registered module: ${module.name} at ${module.path}`);
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
