/\*\*

- HR 模組遷移指南
-
- 本文檔說明如何將 HR 工具從舊架構遷移到新的模組自註冊架構
  2025-06-16
  \*/

## 新架構概述

我們已經將系統架構重構為「模組自註冊」模式，每個模組現在負責自己的:

1. 工具實現 (.js 文件)
2. 工具註冊 (index.js)
3. 路由註冊 (routes.js - 新增)

## 檔案結構

新的檔案結構如下:

```
src/
├── tools/
│   ├── hr/
│   │   ├── index.js          # 註冊 HR 工具到工具管理器
│   │   ├── routes.js         # 註冊 HR 模組路由 (新增)
│   │   ├── get-employee.js   # 工具實現
│   │   └── ...
```

## 如何創建新模組

如果要創建一個新模組 (如 "inventory")，請按照以下步驟:

1. 創建模組目錄結構:

   ```
   mkdir -p src/tools/inventory
   ```

2. 在 `inventory` 目錄中創建工具實現文件，如 `get-inventory.js`

3. 創建 `index.js` 註冊工具:

   ```javascript
   import { GetInventoryTool } from "./get-inventory.js";

   // 導出所有庫存工具
   export const inventoryTools = [
     new GetInventoryTool(),
     // 其他工具...
   ];

   // 註冊所有庫存工具的函數
   export function registerInventoryTools(toolMgr) {
     inventoryTools.forEach((tool) => {
       toolMgr.registerTool(tool);
     });
   }

   // 預設導出工具集合
   export default inventoryTools;
   ```

4. 創建 `routes.js` 設置路由:

   ```javascript
   import express from "express";
   import { inventoryTools } from "./index.js";
   import logger from "../../config/logger.js";

   export function createInventoryRouter(toolManager) {
     const router = express.Router();
     const availableTools = inventoryTools.map((tool) => tool.name);

     // 設置路由邏輯
     router.post("/:toolName", async (req, res) => {
       // 類似 HR 路由的邏輯
     });

     return router;
   }

   export function registerInventoryRoutes(app, toolManager) {
     const inventoryRouter = createInventoryRouter(toolManager);
     app.use("/api/inventory", inventoryRouter);

     logger.info("Inventory module routes registered at /api/inventory");
   }
   ```

5. 在 `src/routes/index.js` 中導入並註冊新模組:

   ```javascript
   import { registerInventoryRoutes } from "../tools/inventory/routes.js";

   export function registerAllRoutes(app, toolManager) {
     // 現有模組...

     // 註冊庫存模組路由
     registerInventoryRoutes(app, toolManager);

     // ...
   }
   ```

6. 在 `src/tools/index.js` 中註冊工具:

   ```javascript
   import { registerInventoryTools } from "./inventory/index.js";

   export function registerAllTools() {
     // 現有工具註冊...

     // 註冊庫存工具
     registerInventoryToolsInternal();

     // ...
   }

   function registerInventoryToolsInternal() {
     logger.info("Registering Inventory tools...");
     registerInventoryTools(toolManager);
     logger.info("Inventory tools registered successfully");
   }
   ```

## 關於向後兼容

目前系統同時支持新舊兩種架構:

- 舊架構: 透過 `routes/module-registry.js` 註冊
- 新架構: 透過 `routes/index.js` 和各模組的 `routes.js` 註冊

這種雙重註冊只是暫時措施，當所有模組都遷移到新架構後，應移除舊架構代碼。
