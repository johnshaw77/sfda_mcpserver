# MCP Server 業務工具開發指南

> 📅 最後更新：2025 年 6 月 8 日  
> 🎯 適用於：業務開發人員、工具擴展開發者  
> 📝 文檔版本：v2.0

## 📋 概述

本指南旨在幫助團隊成員快速開發新的業務工具，無需深入了解 MCP 協議細節或底層架構實作。您只需要專注於業務邏輯的實現，框架會自動處理其他技術細節。

### 🎯 目標讀者

- **業務領域專家**：了解特定業務需求，需要將業務邏輯轉化為工具
- **後端開發人員**：熟悉 JavaScript/Node.js，但不熟悉 MCP 協議
- **系統整合人員**：需要快速擴展系統功能，與第三方 API 整合

---

## 🏗️ 系統架構概覽

### 現有工具模組

```
mcp-server/src/tools/
├── hr/                    # 人力資源工具 (5個)
│   ├── get-employee-info.js
│   ├── get-employee-list.js
│   ├── get-attendance-record.js
│   ├── get-salary-info.js
│   ├── get-department-list.js
│   └── index.js
├── finance/               # 財務管理工具 (1個)
│   ├── get-budget-status.js
│   └── index.js
├── task-management/       # 任務管理工具 (2個)
│   ├── create-task.js
│   ├── get-task-list.js
│   └── index.js
└── 未來模組/
    ├── sales/            # 銷售管理工具
    ├── inventory/        # 庫存管理工具
    ├── crm/              # 客戶關係管理工具
    └── reporting/        # 報表分析工具
```

### 工具自動化功能

開發者**不需要**手動處理以下功能，框架會自動提供：

✅ **自動參數驗證**  
✅ **錯誤處理與日誌**  
✅ **執行效能統計**  
✅ **快取機制**  
✅ **版本管理**  
✅ **API 端點註冊**  
✅ **健康檢查整合**  
✅ **Swagger/OpenAPI 文檔**  

---

## 🚀 快速開始：建立第一個工具

### 第一步：選擇業務領域

假設您要建立一個「庫存管理」工具模組：

```bash
# 1. 建立新的業務模組目錄
mkdir -p mcp-server/src/tools/inventory

# 2. 建立您的第一個工具檔案
touch mcp-server/src/tools/inventory/get-stock-level.js
touch mcp-server/src/tools/inventory/index.js
```

### 第二步：實作工具類別

建立 `get-stock-level.js`：

```javascript
import { BaseTool } from "../base-tool.js";
import { ToolExecutionError } from "../base-tool.js";
import logger from "../../config/logger.js";

/**
 * 庫存水位查詢工具
 */
export class GetStockLevelTool extends BaseTool {
  constructor() {
    super({
      // 工具基本資訊
      name: "get_stock_level",
      description: "查詢商品庫存水位，支援多種查詢條件",
      
      // 輸入參數定義
      inputSchema: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "商品編號（必填）",
            pattern: "^PROD[0-9]{4}$"  // 格式驗證
          },
          warehouseId: {
            type: "string", 
            description: "倉庫編號（選填）",
            default: "MAIN"
          },
          includeReserved: {
            type: "boolean",
            description: "是否包含預留庫存",
            default: false
          },
          includeHistory: {
            type: "boolean",
            description: "是否包含歷史變動",
            default: false
          }
        },
        required: ["productId"]
      }
    });
  }

  /**
   * 執行庫存查詢
   * 
   * ⭐ 重點：這是您唯一需要實作的方法！
   * 參數驗證、錯誤處理、日誌記錄都由父類別自動處理
   */
  async _execute(params, options) {
    const { productId, warehouseId, includeReserved, includeHistory } = params;

    try {
      // 📝 這裡是您的業務邏輯實作區域
      logger.info(`查詢商品庫存: ${productId}`, {
        toolName: this.name,
        warehouseId,
        includeReserved
      });

      // 1. 調用您的業務 API 或資料庫
      const stockData = await this._fetchStockData(productId, warehouseId);
      
      // 2. 處理業務邏輯
      if (includeReserved) {
        stockData.reservedStock = await this._getReservedStock(productId, warehouseId);
      }
      
      if (includeHistory) {
        stockData.history = await this._getStockHistory(productId, warehouseId);
      }

      // 3. 計算衍生數據
      stockData.availableStock = stockData.totalStock - (stockData.reservedStock || 0);
      stockData.stockStatus = this._calculateStockStatus(stockData);

      // 4. 回傳結果
      return {
        productId,
        warehouseId,
        timestamp: new Date().toISOString(),
        stockData
      };

    } catch (error) {
      // 🔥 業務錯誤處理（父類別會自動處理技術錯誤）
      if (error.message.includes("Product not found")) {
        throw new ToolExecutionError(
          `商品 ${productId} 不存在`,
          "validation_error"
        );
      }
      
      if (error.message.includes("Warehouse not found")) {
        throw new ToolExecutionError(
          `倉庫 ${warehouseId} 不存在`,
          "validation_error"
        );
      }

      // 重新拋出未知錯誤
      throw error;
    }
  }

  // 📝 業務邏輯輔助方法
  async _fetchStockData(productId, warehouseId) {
    // 模擬 API 調用或資料庫查詢
    // 在實際環境中，這裡會調用真實的庫存系統 API
    await new Promise(resolve => setTimeout(resolve, 100)); // 模擬延遲

    // 模擬資料
    const mockData = {
      "PROD0001": { totalStock: 150, minLevel: 20, maxLevel: 500 },
      "PROD0002": { totalStock: 85, minLevel: 15, maxLevel: 300 },
      "PROD0003": { totalStock: 0, minLevel: 10, maxLevel: 200 }
    };

    if (!mockData[productId]) {
      throw new Error("Product not found");
    }

    return {
      ...mockData[productId],
      unit: "件",
      lastUpdated: new Date().toISOString()
    };
  }

  async _getReservedStock(productId, warehouseId) {
    // 查詢預留庫存
    return Math.floor(Math.random() * 20);
  }

  async _getStockHistory(productId, warehouseId) {
    // 查詢庫存變動歷史
    return [
      { date: "2025-06-07", change: -5, reason: "銷售出貨", balance: 150 },
      { date: "2025-06-06", change: +100, reason: "進貨入庫", balance: 155 },
      { date: "2025-06-05", change: -10, reason: "銷售出貨", balance: 55 }
    ];
  }

  _calculateStockStatus(stockData) {
    const { totalStock, minLevel, maxLevel } = stockData;
    
    if (totalStock <= 0) return "缺貨";
    if (totalStock <= minLevel) return "庫存不足";
    if (totalStock >= maxLevel) return "庫存過剩";
    return "正常";
  }
}
```

### 第三步：註冊工具模組

建立 `inventory/index.js`：

```javascript
/**
 * 庫存管理工具模組索引
 */

import { GetStockLevelTool } from "./get-stock-level.js";
// 未來可以新增更多工具
// import { UpdateStockTool } from "./update-stock.js";
// import { GetInventoryReportTool } from "./get-inventory-report.js";

/**
 * 所有可用的庫存管理工具
 */
export const inventoryTools = [
  GetStockLevelTool,
  // UpdateStockTool,
  // GetInventoryReportTool
];

/**
 * 註冊所有庫存管理工具到工具管理器
 */
export function registerInventoryTools(toolManager) {
  inventoryTools.forEach(ToolClass => {
    const tool = new ToolClass();
    toolManager.registerTool(tool);
  });
}
```

### 第四步：整合到主系統

編輯 `tools/index.js`，新增您的模組：

```javascript
// ...existing imports...
import { registerInventoryTools } from "./inventory/index.js";

/**
 * 註冊所有工具模組
 */
export function registerAllTools(toolManager) {
  // 現有模組
  registerHRTools(toolManager);              // 5 個 HR 工具
  registerFinanceTools(toolManager);         // 1 個財務工具  
  registerTaskManagementTools(toolManager);  // 2 個任務管理工具
  
  // 🆕 新增您的模組
  registerInventoryTools(toolManager);       // 1 個庫存管理工具
  
  logger.info("All tools registered successfully", {
    totalModules: 4,  // 更新模組數量
    totalTools: toolManager.getToolsCount()
  });
}
```

### 第五步：測試您的工具

```bash
# 1. 重啟伺服器
cd mcp-server
npm start

# 2. 測試工具端點
curl -X POST http://localhost:8080/tools/get_stock_level \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PROD0001",
    "warehouseId": "MAIN", 
    "includeReserved": true,
    "includeHistory": true
  }' | jq

# 3. 檢查工具是否正確註冊
curl http://localhost:8080/tools | jq '.[] | select(.name == "get_stock_level")'
```

---

## 🛠️ 深入開發指南

### 參數驗證最佳實踐

```javascript
// ✅ 良好的參數定義
inputSchema: {
  type: "object",
  properties: {
    employeeId: {
      type: "string",
      description: "員工編號",
      pattern: "^[A-Z][0-9]{6}$",      // 格式驗證
      examples: ["A123456", "B789012"]  // 提供範例
    },
    dateRange: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          format: "date",               // 日期格式
          description: "開始日期 (YYYY-MM-DD)"
        },
        endDate: {
          type: "string", 
          format: "date",
          description: "結束日期 (YYYY-MM-DD)"
        }
      },
      required: ["startDate"]
    },
    limit: {
      type: "integer",
      minimum: 1,                       // 數值範圍
      maximum: 100,
      default: 20,
      description: "每頁筆數"
    },
    categories: {
      type: "array",
      items: {
        type: "string",
        enum: ["A", "B", "C"]          // 枚舉值限制
      },
      description: "類別篩選"
    }
  },
  required: ["employeeId"],             // 必填欄位
  additionalProperties: false           // 不允許額外欄位
}
```

### 錯誤處理策略

```javascript
async _execute(params, options) {
  try {
    // 業務邏輯...
    
  } catch (error) {
    // 🔥 根據錯誤類型提供友善訊息
    
    // 1. 業務驗證錯誤
    if (error.code === 'EMPLOYEE_NOT_FOUND') {
      throw new ToolExecutionError(
        `員工編號 ${params.employeeId} 不存在，請確認編號正確`,
        "validation_error",
        { employeeId: params.employeeId }
      );
    }
    
    // 2. 權限錯誤
    if (error.code === 'ACCESS_DENIED') {
      throw new ToolExecutionError(
        "您沒有權限查詢此資料，請聯絡系統管理員",
        "permission_error"
      );
    }
    
    // 3. API 調用錯誤
    if (error.code === 'API_TIMEOUT') {
      throw new ToolExecutionError(
        "外部系統回應超時，請稍後重試",
        "api_error",
        { timeout: error.timeout }
      );
    }
    
    // 4. 網路錯誤
    if (error.code === 'ECONNREFUSED') {
      throw new ToolExecutionError(
        "無法連接到後端服務，請檢查網路連線",
        "network_error"
      );
    }
    
    // 5. 未預期錯誤
    logger.error("Unexpected error in tool execution", {
      toolName: this.name,
      error: error.message,
      stack: error.stack,
      params
    });
    
    throw new ToolExecutionError(
      "系統發生未預期錯誤，請聯絡技術支援",
      "execution_error"
    );
  }
}
```

### 效能優化技巧

```javascript
// 1. 使用內建快取機制
async _execute(params, options) {
  // 檢查快取（框架自動處理）
  const cacheKey = `${this.name}_${JSON.stringify(params)}`;
  
  // 2. 批次查詢
  if (params.employeeIds && params.employeeIds.length > 1) {
    return await this._batchQuery(params.employeeIds);
  }
  
  // 3. 並行調用
  const [basicInfo, detailInfo] = await Promise.all([
    this._getBasicInfo(params.employeeId),
    this._getDetailInfo(params.employeeId)
  ]);
  
  return { basicInfo, detailInfo };
}

// 4. 實作批次查詢
async _batchQuery(employeeIds) {
  const results = await Promise.allSettled(
    employeeIds.map(id => this._getSingleEmployee(id))
  );
  
  return {
    successful: results.filter(r => r.status === 'fulfilled').map(r => r.value),
    failed: results.filter(r => r.status === 'rejected').map(r => ({
      error: r.reason.message
    }))
  };
}
```

### 日誌記錄最佳實踐

```javascript
async _execute(params, options) {
  // 🟢 開始執行日誌
  logger.info("Tool execution started", {
    toolName: this.name,
    userId: options.userId,
    requestId: options.requestId,
    params: this._sanitizeParams(params)  // 移除敏感資料
  });

  try {
    // 🟡 中間步驟日誌
    logger.debug("Fetching data from external API", {
      toolName: this.name,
      endpoint: apiEndpoint,
      timeout: apiTimeout
    });
    
    const result = await externalAPI.fetch(params);
    
    // 🟢 成功執行日誌
    logger.info("Tool execution completed successfully", {
      toolName: this.name,
      executionTime: Date.now() - startTime,
      resultCount: result.length
    });
    
    return result;
    
  } catch (error) {
    // 🔴 錯誤日誌
    logger.error("Tool execution failed", {
      toolName: this.name,
      error: error.message,
      errorType: error.type,
      params: this._sanitizeParams(params)
    });
    
    throw error;
  }
}

// 移除參數中的敏感資料
_sanitizeParams(params) {
  const sanitized = { ...params };
  
  // 移除密碼、憑證等敏感欄位
  delete sanitized.password;
  delete sanitized.apiKey;
  delete sanitized.token;
  
  // 隱藏敏感資訊
  if (sanitized.socialSecurityNumber) {
    sanitized.socialSecurityNumber = "***-**-****";
  }
  
  return sanitized;
}
```

---

## 📁 工具模組模板

### 模組目錄結構

```
src/tools/your-module/
├── index.js                    # 模組註冊檔案
├── get-xxx-info.js            # 查詢類工具
├── create-xxx.js              # 創建類工具
├── update-xxx.js              # 更新類工具
├── delete-xxx.js              # 刪除類工具
├── utils/                      # 輔助工具
│   ├── validators.js          # 參數驗證工具
│   ├── formatters.js          # 資料格式化工具
│   └── api-client.js          # API 客戶端工具
└── tests/                      # 測試檔案
    ├── get-xxx-info.test.js
    └── integration.test.js
```

### 查詢類工具模板

```javascript
// get-xxx-info.js
import { BaseTool } from "../base-tool.js";
import { ToolExecutionError } from "../base-tool.js";
import logger from "../../config/logger.js";

export class GetXxxInfoTool extends BaseTool {
  constructor() {
    super({
      name: "get_xxx_info",
      description: "查詢 XXX 資訊",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "XXX 編號",
            pattern: "^[A-Z]{3}[0-9]{4}$"
          },
          includeDetails: {
            type: "boolean",
            default: false,
            description: "是否包含詳細資訊"
          }
        },
        required: ["id"]
      }
    });
  }

  async _execute(params, options) {
    const { id, includeDetails } = params;

    try {
      // 1. 基本資訊查詢
      const basicInfo = await this._fetchBasicInfo(id);
      
      if (!basicInfo) {
        throw new ToolExecutionError(
          `XXX ${id} 不存在`,
          "validation_error"
        );
      }

      // 2. 詳細資訊查詢（選用）
      if (includeDetails) {
        basicInfo.details = await this._fetchDetailInfo(id);
      }

      return {
        id,
        timestamp: new Date().toISOString(),
        data: basicInfo
      };

    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      throw new ToolExecutionError(
        "查詢失敗，請稍後重試",
        "execution_error"
      );
    }
  }

  async _fetchBasicInfo(id) {
    // 實作您的查詢邏輯
  }

  async _fetchDetailInfo(id) {
    // 實作詳細資訊查詢邏輯
  }
}
```

### 創建類工具模板

```javascript
// create-xxx.js
import { BaseTool } from "../base-tool.js";
import { ToolExecutionError } from "../base-tool.js";
import logger from "../../config/logger.js";

export class CreateXxxTool extends BaseTool {
  constructor() {
    super({
      name: "create_xxx",
      description: "創建新的 XXX",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            description: "XXX 名稱"
          },
          category: {
            type: "string",
            enum: ["A", "B", "C"],
            description: "XXX 類別"
          },
          description: {
            type: "string",
            maxLength: 500,
            description: "描述"
          }
        },
        required: ["name", "category"]
      }
    });
  }

  async _execute(params, options) {
    const { name, category, description } = params;

    try {
      // 1. 檢查重複
      const existing = await this._checkDuplicate(name);
      if (existing) {
        throw new ToolExecutionError(
          `XXX "${name}" 已存在`,
          "validation_error"
        );
      }

      // 2. 創建記錄
      const newXxx = await this._createRecord({
        name,
        category,
        description,
        createdAt: new Date().toISOString(),
        createdBy: options.userId
      });

      // 3. 記錄操作日誌
      logger.info("XXX created successfully", {
        toolName: this.name,
        xxxId: newXxx.id,
        name,
        category
      });

      return {
        success: true,
        data: newXxx
      };

    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      throw new ToolExecutionError(
        "創建失敗，請稍後重試",
        "execution_error"
      );
    }
  }

  async _checkDuplicate(name) {
    // 實作重複檢查邏輯
  }

  async _createRecord(data) {
    // 實作創建邏輯
  }
}
```

---

## 🧪 測試指南

### 單元測試模板

```javascript
// tests/get-xxx-info.test.js
import { GetXxxInfoTool } from "../get-xxx-info.js";
import { ToolExecutionError } from "../../base-tool.js";

describe("GetXxxInfoTool", () => {
  let tool;

  beforeEach(() => {
    tool = new GetXxxInfoTool();
  });

  describe("參數驗證", () => {
    test("應該拒絕無效的 ID 格式", async () => {
      const params = { id: "invalid" };
      
      await expect(tool.execute(params))
        .rejects
        .toThrow(ToolExecutionError);
    });

    test("應該接受有效的參數", async () => {
      const params = { id: "ABC1234" };
      
      await expect(tool.execute(params))
        .resolves
        .toHaveProperty("data");
    });
  });

  describe("業務邏輯", () => {
    test("應該回傳基本資訊", async () => {
      const params = { id: "ABC1234" };
      const result = await tool.execute(params);
      
      expect(result).toHaveProperty("id", "ABC1234");
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("timestamp");
    });

    test("應該包含詳細資訊（當請求時）", async () => {
      const params = { id: "ABC1234", includeDetails: true };
      const result = await tool.execute(params);
      
      expect(result.data).toHaveProperty("details");
    });
  });

  describe("錯誤處理", () => {
    test("應該處理不存在的 ID", async () => {
      const params = { id: "XYZ9999" };
      
      await expect(tool.execute(params))
        .rejects
        .toThrow("XXX XYZ9999 不存在");
    });
  });
});
```

### 整合測試模板

```javascript
// tests/integration.test.js
import request from "supertest";
import app from "../../../server.js";

describe("XXX 工具整合測試", () => {
  describe("GET /tools", () => {
    test("應該列出 XXX 工具", async () => {
      const response = await request(app)
        .get("/tools")
        .expect(200);

      const xxxTools = response.body.filter(
        tool => tool.name.startsWith("xxx_")
      );
      
      expect(xxxTools.length).toBeGreaterThan(0);
    });
  });

  describe("POST /tools/get_xxx_info", () => {
    test("應該成功查詢 XXX 資訊", async () => {
      const response = await request(app)
        .post("/tools/get_xxx_info")
        .send({ id: "ABC1234" })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("result");
    });

    test("應該處理無效請求", async () => {
      const response = await request(app)
        .post("/tools/get_xxx_info")
        .send({ id: "invalid" })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
    });
  });
});
```

---

## 📚 實際範例解析

### HR 工具範例分析

以現有的 `get-employee-info.js` 為例：

```javascript
// 📝 重點 1：清晰的工具定義
export class GetEmployeeInfoTool extends BaseTool {
  constructor() {
    super({
      name: "get_employee_info",           // ✅ 清楚的命名
      description: "查詢員工基本資訊",      // ✅ 簡潔的描述
      
      inputSchema: {
        type: "object",
        properties: {
          employeeId: {
            type: "string",
            pattern: "^[A-Z][0-9]{6}$",   // ✅ 嚴格的格式驗證
            description: "員工編號 (A123456 格式)"
          },
          includeDetails: {
            type: "boolean",
            default: true,                  // ✅ 合理的預設值
            description: "是否包含詳細資訊"
          },
          fields: {
            type: "array",
            items: {
              type: "string",
              enum: ["basic", "contact", "department", "position"]
            },
            default: ["basic", "contact"], // ✅ 靈活的欄位選擇
            description: "指定返回欄位"
          }
        },
        required: ["employeeId"]           // ✅ 明確的必填欄位
      }
    });
  }

  // 📝 重點 2：專注於業務邏輯
  async _execute(params, options) {
    const { employeeId, includeDetails, fields } = params;

    try {
      // ✅ 清楚的業務流程
      logger.info(`查詢員工資訊: ${employeeId}`);
      
      // 1. 獲取資料
      const employeeData = await this._fetchEmployeeData(
        employeeId, 
        includeDetails, 
        fields
      );
      
      // 2. 驗證結果
      if (!employeeData) {
        throw new ToolExecutionError(
          `員工編號 ${employeeId} 不存在`,
          "validation_error"
        );
      }

      // 3. 處理欄位篩選
      const filteredData = this._filterFields(employeeData, fields);
      
      // 4. 回傳標準化結果
      return {
        employeeId,
        timestamp: new Date().toISOString(),
        data: filteredData
      };

    } catch (error) {
      // ✅ 適當的錯誤處理
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      
      logger.error("員工資訊查詢失敗", { employeeId, error: error.message });
      throw new ToolExecutionError(
        "查詢失敗，請稍後重試",
        "execution_error"
      );
    }
  }

  // 📝 重點 3：清楚的輔助方法
  async _fetchEmployeeData(employeeId, includeDetails, fields) {
    // 在實際環境中，這裡會調用真實的 HR API
    // 模擬資料庫查詢...
  }

  _filterFields(data, fields) {
    // 根據 fields 參數篩選回傳資料
    const result = {};
    fields.forEach(field => {
      if (data[field]) {
        result[field] = data[field];
      }
    });
    return result;
  }
}
```

**關鍵學習點**：

1. **單一職責**：每個工具只做一件事情
2. **清楚介面**：參數定義完整且有驗證
3. **錯誤處理**：友善的錯誤訊息
4. **業務邏輯**：專注於業務需求，不處理技術細節
5. **可測試性**：方法分離，容易進行單元測試

---

## 🔧 常見問題與解決方案

### Q1: 如何處理外部 API 調用？

```javascript
// ✅ 建議的作法
async _fetchFromExternalAPI(params) {
  const timeout = 30000; // 30 秒超時
  
  try {
    const response = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}`
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
    
  } catch (error) {
    if (error.name === "TimeoutError") {
      throw new ToolExecutionError(
        "外部系統回應超時，請稍後重試",
        "api_error"
      );
    }
    
    if (error.name === "TypeError") {
      throw new ToolExecutionError(
        "無法連接到外部系統，請檢查網路連線",
        "network_error"
      );
    }
    
    throw new ToolExecutionError(
      `外部 API 調用失敗: ${error.message}`,
      "api_error"
    );
  }
}
```

### Q2: 如何實作分頁功能？

```javascript
// ✅ 標準分頁實作
inputSchema: {
  type: "object",
  properties: {
    page: {
      type: "integer",
      minimum: 1,
      default: 1,
      description: "頁數（從 1 開始）"
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 20,
      description: "每頁筆數（1-100）"
    },
    // ... 其他參數
  }
},

async _execute(params) {
  const { page, limit, ...filters } = params;
  
  // 計算偏移量
  const offset = (page - 1) * limit;
  
  // 查詢資料
  const [data, total] = await Promise.all([
    this._fetchData(filters, offset, limit),
    this._countTotal(filters)
  ]);
  
  // 計算分頁資訊
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    }
  };
}
```

### Q3: 如何處理檔案上傳？

```javascript
// ✅ 檔案上傳工具
export class UploadFileTool extends BaseTool {
  constructor() {
    super({
      name: "upload_file",
      description: "上傳檔案到系統",
      inputSchema: {
        type: "object",
        properties: {
          fileData: {
            type: "string",
            description: "Base64 編碼的檔案內容"
          },
          fileName: {
            type: "string",
            pattern: "^[a-zA-Z0-9_.-]+$",
            description: "檔案名稱"
          },
          fileType: {
            type: "string",
            enum: ["image/jpeg", "image/png", "application/pdf", "text/plain"],
            description: "檔案類型"
          },
          category: {
            type: "string",
            description: "檔案分類"
          }
        },
        required: ["fileData", "fileName", "fileType"]
      }
    });
  }

  async _execute(params) {
    const { fileData, fileName, fileType, category } = params;

    try {
      // 1. 驗證檔案大小
      const fileSize = this._getFileSize(fileData);
      if (fileSize > 10 * 1024 * 1024) { // 10MB 限制
        throw new ToolExecutionError(
          "檔案大小超過 10MB 限制",
          "validation_error"
        );
      }

      // 2. 生成唯一檔案名
      const uniqueFileName = this._generateUniqueFileName(fileName);
      
      // 3. 儲存檔案
      const filePath = await this._saveFile(fileData, uniqueFileName, fileType);
      
      // 4. 記錄到資料庫
      const fileRecord = await this._createFileRecord({
        originalName: fileName,
        fileName: uniqueFileName,
        filePath,
        fileType,
        fileSize,
        category,
        uploadedAt: new Date().toISOString()
      });

      return {
        fileId: fileRecord.id,
        fileName: uniqueFileName,
        fileUrl: `/files/${uniqueFileName}`,
        fileSize,
        uploadedAt: fileRecord.uploadedAt
      };

    } catch (error) {
      logger.error("檔案上傳失敗", { fileName, error: error.message });
      
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      
      throw new ToolExecutionError(
        "檔案上傳失敗，請稍後重試",
        "execution_error"
      );
    }
  }

  _getFileSize(base64Data) {
    // 計算 Base64 編碼的檔案大小
    return Math.round((base64Data.length * 3) / 4);
  }

  _generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2);
    const ext = originalName.split(".").pop();
    return `${timestamp}_${randomStr}.${ext}`;
  }

  async _saveFile(fileData, fileName, fileType) {
    // 實作檔案儲存邏輯（本地或雲端）
  }

  async _createFileRecord(fileInfo) {
    // 實作資料庫記錄創建
  }
}
```

### Q4: 如何實作資料驗證？

```javascript
// ✅ 自訂驗證邏輯
export class CreateOrderTool extends BaseTool {
  constructor() {
    super({
      name: "create_order",
      description: "創建新訂單",
      inputSchema: {
        type: "object",
        properties: {
          customerId: {
            type: "string",
            pattern: "^CUST[0-9]{6}$"
          },
          items: {
            type: "array",
            minItems: 1,
            maxItems: 50,
            items: {
              type: "object",
              properties: {
                productId: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
                unitPrice: { type: "number", minimum: 0 }
              },
              required: ["productId", "quantity", "unitPrice"]
            }
          },
          deliveryAddress: {
            type: "object",
            properties: {
              street: { type: "string", minLength: 1 },
              city: { type: "string", minLength: 1 },
              postalCode: { type: "string", pattern: "^[0-9]{5}$" }
            },
            required: ["street", "city", "postalCode"]
          }
        },
        required: ["customerId", "items", "deliveryAddress"]
      }
    });
  }

  async _execute(params) {
    // 1. JSON Schema 驗證已由框架完成
    
    // 2. 業務邏輯驗證
    await this._validateBusinessRules(params);
    
    // 3. 創建訂單
    const order = await this._createOrder(params);
    
    return order;
  }

  async _validateBusinessRules(params) {
    const { customerId, items } = params;

    // 驗證客戶是否存在且狀態正常
    const customer = await this._getCustomer(customerId);
    if (!customer) {
      throw new ToolExecutionError(
        `客戶 ${customerId} 不存在`,
        "validation_error"
      );
    }
    
    if (customer.status !== "active") {
      throw new ToolExecutionError(
        `客戶 ${customerId} 狀態異常，無法下單`,
        "validation_error"
      );
    }

    // 驗證商品是否存在且有庫存
    for (const item of items) {
      const product = await this._getProduct(item.productId);
      if (!product) {
        throw new ToolExecutionError(
          `商品 ${item.productId} 不存在`,
          "validation_error"
        );
      }
      
      if (product.stock < item.quantity) {
        throw new ToolExecutionError(
          `商品 ${item.productId} 庫存不足（需要 ${item.quantity}，可用 ${product.stock}）`,
          "validation_error"
        );
      }
      
      // 價格驗證
      if (Math.abs(item.unitPrice - product.price) > 0.01) {
        throw new ToolExecutionError(
          `商品 ${item.productId} 價格已變更，請重新確認`,
          "validation_error"
        );
      }
    }

    // 驗證訂單總金額
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice), 
      0
    );
    
    if (totalAmount > customer.creditLimit) {
      throw new ToolExecutionError(
        `訂單金額超過客戶信用額度（${customer.creditLimit}）`,
        "validation_error"
      );
    }
  }
}
```

---

## 🎯 部署與維護

### 工具版本管理

```javascript
// ✅ 使用內建版本管理
export class GetEmployeeInfoTool extends BaseTool {
  constructor() {
    super({
      name: "get_employee_info",
      description: "查詢員工基本資訊",
      version: "2.1.0",        // 📝 設定工具版本
      
      // 版本異動記錄
      changelog: {
        "2.1.0": "新增部門層級權限檢查",
        "2.0.0": "重構參數結構，支援欄位篩選", 
        "1.0.0": "初始版本"
      },
      
      inputSchema: {
        // ... schema 定義
      }
    });
  }
}
```

### 監控和告警

```javascript
// ✅ 工具執行監控
async _execute(params, options) {
  const startTime = Date.now();
  
  try {
    // 業務邏輯...
    const result = await this._performBusinessLogic(params);
    
    // 📊 成功統計
    const executionTime = Date.now() - startTime;
    this._recordMetrics("success", executionTime);
    
    return result;
    
  } catch (error) {
    // 📊 失敗統計
    const executionTime = Date.now() - startTime;
    this._recordMetrics("error", executionTime, error.type);
    
    throw error;
  }
}

_recordMetrics(status, executionTime, errorType = null) {
  // 框架會自動記錄以下指標：
  // - 工具調用次數
  // - 平均執行時間
  // - 成功率/失敗率
  // - 錯誤類型分布
  
  logger.info("Tool execution metrics", {
    toolName: this.name,
    status,
    executionTime,
    errorType
  });
}
```

### 效能調優

```javascript
// ✅ 效能最佳化技巧

// 1. 使用快取
async _execute(params) {
  const cacheKey = this._generateCacheKey(params);
  
  // 檢查快取
  let result = await globalToolCache.get(cacheKey);
  if (result) {
    logger.debug("Cache hit", { toolName: this.name, cacheKey });
    return result;
  }
  
  // 執行查詢
  result = await this._performQuery(params);
  
  // 儲存快取（5 分鐘）
  await globalToolCache.set(cacheKey, result, 300);
  
  return result;
}

// 2. 批次處理
async _batchExecute(paramsList) {
  // 將多個請求合併為單次查詢
  const ids = paramsList.map(params => params.id);
  const batchResult = await this._batchQuery(ids);
  
  // 將結果分發給各個請求
  return paramsList.map(params => ({
    ...params,
    result: batchResult[params.id]
  }));
}

// 3. 並行查詢
async _execute(params) {
  // 同時執行多個獨立查詢
  const [basicInfo, permissions, preferences] = await Promise.all([
    this._getBasicInfo(params.id),
    this._getPermissions(params.id),
    this._getPreferences(params.id)
  ]);
  
  return { basicInfo, permissions, preferences };
}
```

---

## 📋 檢核清單

### 🚀 開發前檢核

- [ ] 確認業務需求和功能範圍
- [ ] 設計輸入參數結構
- [ ] 規劃錯誤處理策略
- [ ] 評估效能需求
- [ ] 考慮安全性要求

### 🛠️ 開發中檢核

- [ ] 實作工具類別並繼承 `BaseTool`
- [ ] 定義完整的 `inputSchema`
- [ ] 實作 `_execute` 方法
- [ ] 新增適當的錯誤處理
- [ ] 撰寫日誌記錄
- [ ] 實作輔助方法
- [ ] 新增註解說明

### 🧪 測試檢核

- [ ] 撰寫單元測試
- [ ] 測試參數驗證
- [ ] 測試錯誤情況
- [ ] 進行整合測試
- [ ] 效能測試
- [ ] 安全性測試

### 🚀 部署檢核

- [ ] 更新 `index.js` 註冊新工具
- [ ] 檢查工具列表 API
- [ ] 測試 API 端點
- [ ] 檢查日誌輸出
- [ ] 驗證監控指標
- [ ] 更新文檔

---

## 📞 獲取支援

### 開發支援

1. **查看現有範例**：參考 `src/tools/hr/` 目錄下的工具實作
2. **閱讀 API 文檔**：查看 `docs/api-spec.md`
3. **檢查日誌**：使用 `logs/` 目錄下的日誌檔案除錯
4. **運行測試**：執行 `npm test` 檢查系統狀態

### 技術問題

- **參數驗證問題**：檢查 `inputSchema` 定義
- **錯誤處理問題**：參考 `base-tool.js` 中的錯誤類型
- **效能問題**：使用內建的快取和統計功能
- **整合問題**：檢查工具註冊和路由設定

### 最佳實踐建議

1. **保持簡單**：一個工具只做一件事
2. **驗證輸入**：使用 JSON Schema 進行嚴格驗證
3. **友善錯誤**：提供清楚的錯誤訊息
4. **記錄日誌**：充分記錄執行過程
5. **測試覆蓋**：確保充分的測試覆蓋率

---

**🎉 恭喜！您已經準備好開發出色的業務工具了！**

記住：框架處理技術細節，您專注於業務價值！

---

_最後更新：2025 年 1 月 27 日_  
_文檔版本：v2.0_  
_作者：MCP Server 開發團隊_
