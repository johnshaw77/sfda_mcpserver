/**
 * 客訴管理模組 API 路由
 */

import createModuleRoutes from "./module-routes-factory.js";
import { getToolManager } from "../tools/index.js";

// 獲取工具管理器實例
const toolManager = getToolManager();

// 定義此模組包含的工具
const complaintsTools = [
  "get_complaints_list",
  "get_complaint_detail",
  "get_complaints_statistics",
  "update_complaint_status"
];

// 創建模組路由
const complaintsRoutes = createModuleRoutes("complaints", complaintsTools, toolManager);

export default complaintsRoutes;
