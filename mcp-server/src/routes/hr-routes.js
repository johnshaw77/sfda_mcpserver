/**
 * 人力資源模組 API 路由
 */

import createModuleRoutes from "./module-routes-factory.js";
import { getToolManager } from "../tools/index.js";

// 獲取工具管理器實例
const toolManager = getToolManager();

// 定義此模組包含的工具
const hrTools = [
  "get_employee_info",
  "get_employee_list",
  "get_attendance_record",
  "get_salary_info",
  "get_department_list",
];

// 創建模組路由
const hrRoutes = createModuleRoutes("hr", hrTools, toolManager);

export default hrRoutes;
