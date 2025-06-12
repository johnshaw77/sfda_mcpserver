# 如何註冊新的工具到 MCP
2025-06-12

以 客訴 工具為例，以下是註冊新工具到 MCP 的步驟：

### 更新您的客訴工具，確保它們繼承自 BaseTool
確保客訴工具使用了正確的 BaseTool 類別
建立工具註冊檔案
將工具註冊到 MCP 系統
步驟 1：更新您的客訴工具，確保它們繼承自 BaseTool

```javascript
import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import complaintsService from "../../services/complaints/complaints-service.js";
import logger from "../../config/logger.js";

export class GetComplaintsListTool extends BaseTool {
  constructor() {
    super(
      "get_complaints_list",
      "查詢客訴列表，可根據狀態、優先級、客訴類型等條件篩選",
      {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "客訴狀態（選填）",
            enum: ["待處理", "處理中", "已解決", "已關閉", "已駁回"]
          },
          priorityLevel: {
            type: "string",
            description: "優先級（選填）",
            enum: ["低", "中", "高", "緊急"]
          },
          complaintType: {
            type: "string",
            description: "客訴類型（選填）"
          },
          customerName: {
            type: "string",
            description: "客戶名稱（選填，支援模糊查詢）"
          },
          startDate: {
            type: "string",
            description: "開始日期（選填，格式：YYYY-MM-DD）"
          },
          endDate: {
            type: "string",
            description: "結束日期（選填，格式：YYYY-MM-DD）"
          }
        },
        required: []
      }
    );
  }

  async _execute(params) {
    try {
      logger.info("開始查詢客訴列表", { params });
      const complaints = await complaintsService.getComplaintsList(params);
      
      if (complaints.length === 0) {
        return {
          message: "沒有符合條件的客訴記錄",
          data: []
        };
      }
      
      return {
        message: `成功查詢到 ${complaints.length} 筆客訴記錄`,
        data: complaints
      };
    } catch (error) {
      logger.error("查詢客訴列表失敗", { error: error.message });
      throw new ToolExecutionError(
        `查詢客訴列表失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR
      );
    }
  }
}
```

### 步驟 2：建立工具註冊檔案
```javascript
import { GetComplaintsListTool } from "./get-complaints-list.js";
import { GetComplaintDetailTool } from "./get-complaint-detail.js";
import { GetComplaintsStatisticsTool } from "./get-complaints-statistics.js";
import { UpdateComplaintStatusTool } from "./update-complaint-status.js";

// 建立工具實例
const getComplaintsListTool = new GetComplaintsListTool();
const getComplaintDetailTool = new GetComplaintDetailTool();
const getComplaintsStatisticsTool = new GetComplaintsStatisticsTool();
const updateComplaintStatusTool = new UpdateComplaintStatusTool();

// 導出所有客訴工具
export const complaintsTools = [
  getComplaintsListTool,
  getComplaintDetailTool,
  getComplaintsStatisticsTool,
  updateComplaintStatusTool
];

// 單獨導出每個工具（方便單獨使用）
export {
  getComplaintsListTool,
  getComplaintDetailTool,
  getComplaintsStatisticsTool,
  updateComplaintStatusTool
};
```

### 步驟 3：在主工具註冊檔案中引入客訴工具
```javascript
import { hrTools } from "./hr/index.js";
import { financeTools } from "./finance/index.js";
import { taskManagementTools } from "./task-management/index.js";
import { complaintsTools } from "./complaints/index.js";  // 引入客訴工具
import logger from "../config/logger.js";

// 合併所有工具
const allTools = [
  ...hrTools,
  ...financeTools,
  ...taskManagementTools,
  ...complaintsTools  // 添加客訴工具
];

// 建立工具映射（方便通過名稱查找）
const toolsMap = new Map();
allTools.forEach(tool => {
  toolsMap.set(tool.name, tool);
});

// 工具註冊時的日誌
logger.info(`已註冊 ${allTools.length} 個工具：${allTools.map(t => t.name).join(", ")}`);

export { allTools, toolsMap };
```

### 步驟 4：確保在 MCP 服務中使用這些工具
```javascript
import { toolsMap } from "../tools/index.js";
import logger from "../config/logger.js";

export async function executeTool(toolName, params) {
  const tool = toolsMap.get(toolName);
  
  if (!tool) {
    logger.error(`找不到工具: ${toolName}`);
    throw new Error(`找不到工具: ${toolName}`);
  }
  
  logger.info(`執行工具: ${toolName}`, { params });
  return await tool.execute(params);
}
```

需要確保每個客訴工具類（例如 GetComplaintsListTool）都繼承自 BaseTool 並實現了必要的方法，特別是 _execute 方法。

這樣才能確保它們能夠正確地被 MCP 系統識別和執行。