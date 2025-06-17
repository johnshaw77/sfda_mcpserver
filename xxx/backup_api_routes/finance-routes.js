/**
 * 財務管理模組 API 路由
 */

import createModuleRoutes from "./module-routes-factory.js";
import { getToolManager } from "../tools/index.js";

// 獲取工具管理器實例
const toolManager = getToolManager();

// 定義此模組包含的工具
const financeTools = ["get_budget_status"];

// 創建模組路由
const financeRoutes = createModuleRoutes("finance", financeTools, toolManager);

export default financeRoutes;
