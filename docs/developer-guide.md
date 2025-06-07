# MCP Server 開發者指南

> 專為開發人員設計的完整指南，涵蓋專案架構、開發流程、工具擴展與最佳實踐

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-35%20passed-green.svg)](tests/)

---

## 📋 目錄

- [快速開始](#快速開始)
- [專案架構](#專案架構)
- [開發環境設定](#開發環境設定)
- [工具開發指南](#工具開發指南)
- [API 開發規範](#api-開發規範)
- [測試指南](#測試指南)
- [部署指南](#部署指南)
- [故障排除](#故障排除)
- [最佳實踐](#最佳實踐)

---

## 🚀 快速開始

### 環境需求

- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **Git**: 最新版本
- **Docker**: 可選，建議安裝

### 快速設定

```bash
# 1. 克隆專案
git clone <repository-url>
cd sfda_mcpserver

# 2. 安裝依賴
cd mcp-server
npm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env 文件配置相關參數

# 4. 啟動開發服務器
npm run dev

# 5. 驗證安裝
curl http://localhost:8080/health
```

---

## 🏗️ 專案架構

### 目錄結構

```
mcp-server/
├── src/
│   ├── server.js              # 主服務器文件
│   ├── config/                # 配置管理
│   │   ├── config.js          # 應用配置
│   │   └── logger.js          # 日誌配置
│   ├── services/              # 服務層
│   │   ├── api-client.js      # HTTP 客戶端封裝
│   │   ├── mcp-protocol.js    # MCP 協議處理
│   │   └── sse-manager.js     # SSE 連接管理
│   └── tools/                 # 工具模組
│       ├── index.js           # 工具註冊器
│       ├── base-tool.js       # 基礎工具類
│       ├── tool-manager.js    # 工具管理器
│       └── hr/                # HR 工具模組
│           ├── index.js       # HR 工具註冊
│           ├── get-employee-info.js
│           ├── get-employee-list.js
│           ├── get-attendance-record.js
│           └── get-salary-info.js
├── tests/                     # 測試文件
├── coverage/                  # 測試覆蓋率報告
├── package.json
├── .env.example              # 環境變數範本
├── Dockerfile               # Docker 配置
└── README.md
```

### 核心組件說明

#### 1. 服務器核心 (`server.js`)

- Express.js 應用程式主入口
- 路由定義與中間件配置
- 錯誤處理與優雅關閉

#### 2. 配置管理 (`config/`)

- **config.js**: 環境變數管理與驗證
- **logger.js**: Winston 日誌配置

#### 3. 服務層 (`services/`)

- **api-client.js**: 企業 API 的 HTTP 客戶端
- **mcp-protocol.js**: MCP JSON-RPC 協議處理
- **sse-manager.js**: 即時通訊連接管理

#### 4. 工具系統 (`tools/`)

- **tool-manager.js**: 工具生命週期管理
- **base-tool.js**: 工具基礎類別
- **各類工具模組**: 按業務域分組的工具實作

---

## 🛠️ 開發環境設定

### 開發工具配置

1. **ESLint 配置**

   ```bash
   npm run lint          # 檢查程式碼風格
   npm run lint:fix      # 自動修復
   ```

2. **程式碼格式化**

   ```bash
   npm run format        # 使用 Prettier 格式化
   ```

3. **測試執行**
   ```bash
   npm test              # 執行所有測試
   npm run test:watch    # 監視模式
   npm run test:coverage # 生成覆蓋率報告
   ```

### 開發伺服器

```bash
# 開發模式 (熱重載)
npm run dev

# 生產模式
npm start

# 偵錯模式
DEBUG=* npm run dev
```

### 環境變數配置

參考 `.env.example` 設定開發環境：

```bash
# MCP Server 配置
MCP_PORT=8080
NODE_ENV=development

# 企業系統 API 配置
MAIN_SYSTEM_URL=http://localhost:3000/api/mcp
API_TIMEOUT=30000

# 日誌配置
LOG_LEVEL=debug
LOGGING_ENABLED=true
```

---

## 🔧 工具開發指南

### 建立新工具的步驟

#### 1. 工具類別設計

繼承 `BaseTool` 基礎類別：

```javascript
// src/tools/finance/get-budget-status.js
import { BaseTool } from "../base-tool.js";

export class GetBudgetStatusTool extends BaseTool {
  constructor() {
    super({
      name: "get_budget_status",
      description: "取得部門預算狀態",
      inputSchema: {
        type: "object",
        properties: {
          departmentId: {
            type: "string",
            description: "部門編號",
          },
          year: {
            type: "string",
            description: "查詢年度，格式：YYYY",
          },
        },
        required: ["departmentId"],
      },
    });
  }

  async execute(params) {
    // 參數驗證由基礎類別處理
    const { departmentId, year = new Date().getFullYear().toString() } = params;

    try {
      // 調用企業 API
      const response = await this.apiClient.get("/finance/budget-status", {
        params: { departmentId, year },
      });

      return {
        success: true,
        data: {
          departmentId,
          year,
          budget: response.data.budget,
          spent: response.data.spent,
          remaining: response.data.remaining,
          utilizationRate: response.data.utilizationRate,
        },
      };
    } catch (error) {
      throw this.createToolError("API_ERROR", error.message, {
        departmentId,
        year,
      });
    }
  }
}
```

#### 2. 註冊新工具模組

```javascript
// src/tools/finance/index.js
import { toolManager } from "../tool-manager.js";
import { GetBudgetStatusTool } from "./get-budget-status.js";
import logger from "../../config/logger.js";

export function registerFinanceTools() {
  logger.info("Registering Finance tools...");

  // 註冊預算狀態查詢工具
  toolManager.register(new GetBudgetStatusTool());

  logger.info("Finance tools registration completed");
}
```

#### 3. 添加到主註冊器

```javascript
// src/tools/index.js
import { registerFinanceTools } from "./finance/index.js";

export function registerAllTools() {
  logger.info("Starting tool registration...");

  // 註冊 HR 工具
  registerHRTools();

  // 註冊財務工具
  registerFinanceTools();

  const totalTools = toolManager.tools.size;
  logger.info(`Tool registration completed. Total tools: ${totalTools}`);
}
```

### 工具測試

為每個工具建立對應的測試文件：

```javascript
// tests/tools/finance/get-budget-status.test.js
import { describe, test, expect, beforeEach } from "@jest/globals";
import { GetBudgetStatusTool } from "../../../src/tools/finance/get-budget-status.js";

describe("GetBudgetStatusTool", () => {
  let tool;

  beforeEach(() => {
    tool = new GetBudgetStatusTool();
  });

  test("應該正確建立工具實例", () => {
    expect(tool.name).toBe("get_budget_status");
    expect(tool.description).toContain("預算狀態");
  });

  test("應該驗證必要參數", async () => {
    await expect(tool.execute({})).rejects.toThrow("departmentId is required");
  });

  test("應該成功執行查詢", async () => {
    const result = await tool.execute({
      departmentId: "IT001",
      year: "2024",
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("budget");
    expect(result.data).toHaveProperty("spent");
    expect(result.data).toHaveProperty("remaining");
  });
});
```

---

## 🔌 API 開發規範

### RESTful API 設計

1. **路由規範**

   ```javascript
   // GET    /health          - 健康檢查
   // GET    /tools           - 工具列表
   // POST   /tools/:toolName - 執行工具
   // GET    /mcp            - MCP 協議端點
   // GET    /sse            - SSE 連接
   // GET    /sse/stats      - SSE 統計
   ```

2. **回應格式**

   ```javascript
   // 成功回應
   {
     "success": true,
     "data": { /* 結果資料 */ },
     "timestamp": "2024-06-07T10:30:00.000Z"
   }

   // 錯誤回應
   {
     "success": false,
     "error": {
       "code": "ERROR_CODE",
       "message": "錯誤訊息",
       "details": { /* 錯誤詳情 */ }
     }
   }
   ```

### 錯誤處理

使用統一的錯誤處理機制：

```javascript
// 在工具中拋出錯誤
throw this.createToolError("VALIDATION_ERROR", "Invalid parameter", {
  parameter: "employeeId",
  value: params.employeeId,
});

// 在路由中處理錯誤
app.use((error, req, res, next) => {
  logger.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: config.isDevelopment() ? error.message : "Internal server error",
    },
  });
});
```

---

## 🧪 測試指南

### 測試架構

使用 Jest 作為測試框架：

```bash
# 執行所有測試
npm test

# 執行特定測試文件
npm test -- server.test.js

# 監視模式
npm run test:watch

# 生成覆蓋率報告
npm run test:coverage
```

### 測試分類

1. **單元測試**: 測試個別函數與類別
2. **整合測試**: 測試 API 端點
3. **工具測試**: 測試 MCP 工具功能

### 測試範例

```javascript
describe("MCP Server API", () => {
  test("健康檢查端點", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body).toHaveProperty("mcp");
  });

  test("工具列表端點", async () => {
    const response = await request(app).get("/tools");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.tools)).toBe(true);
    expect(response.body.count).toBeGreaterThan(0);
  });
});
```

---

## 🚀 部署指南

### Docker 部署

```bash
# 建立映像檔
docker build -t mcp-server:latest .

# 執行容器
docker run -d --name mcp-server \
  --env-file .env \
  -p 8080:8080 \
  mcp-server:latest

# 檢查容器狀態
docker ps
docker logs mcp-server
```

### 生產環境配置

1. **環境變數設定**

   ```bash
   NODE_ENV=production
   LOG_LEVEL=info
   MCP_PORT=8080
   ```

2. **PM2 部署**

   ```bash
   npm install -g pm2
   pm2 start src/server.js --name mcp-server
   pm2 save
   pm2 startup
   ```

3. **Nginx 反向代理**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:8080;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

---

## 🔍 故障排除

### 常見問題

1. **服務啟動失敗**

   ```bash
   # 檢查埠號是否被佔用
   lsof -i :8080

   # 檢查環境變數配置
   node -e "console.log(process.env)"
   ```

2. **工具執行錯誤**

   ```bash
   # 查看詳細日誌
   DEBUG=* npm run dev

   # 檢查 API 連接
   curl -v http://localhost:8080/health
   ```

3. **測試失敗**

   ```bash
   # 清理快取重新測試
   npm test -- --clearCache

   # 查看詳細錯誤
   npm test -- --verbose
   ```

### 偵錯技巧

1. **使用 VS Code 偵錯器**

   ```json
   // .vscode/launch.json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug MCP Server",
     "program": "${workspaceFolder}/mcp-server/src/server.js",
     "env": {
       "NODE_ENV": "development",
       "DEBUG": "*"
     }
   }
   ```

2. **日誌偵錯**

   ```javascript
   import logger from "./config/logger.js";

   logger.debug("Debug message", { data: someData });
   logger.info("Info message");
   logger.warn("Warning message");
   logger.error("Error message", error);
   ```

---

## 💡 最佳實踐

### 程式碼風格

1. **使用 ES6+ 語法**

   ```javascript
   // ✅ 好的做法
   const { employeeId } = params;
   const result = await apiClient.get(`/employees/${employeeId}`);

   // ❌ 避免的做法
   var employeeId = params.employeeId;
   apiClient.get("/employees/" + employeeId).then(function (result) {
     // ...
   });
   ```

2. **錯誤處理**

   ```javascript
   // ✅ 好的做法
   try {
     const result = await someAsyncOperation();
     return { success: true, data: result };
   } catch (error) {
     logger.error("Operation failed:", error);
     throw this.createToolError("OPERATION_ERROR", error.message);
   }
   ```

3. **參數驗證**
   ```javascript
   // ✅ 在 inputSchema 中定義驗證規則
   inputSchema: {
     type: 'object',
     properties: {
       employeeId: {
         type: 'string',
         pattern: '^[A-Z][0-9]{6}$',
         description: '員工編號 (格式: A123456)'
       }
     },
     required: ['employeeId']
   }
   ```

### 效能優化

1. **API 快取**

   ```javascript
   // 實作簡單的記憶體快取
   const cache = new Map();
   const cacheKey = `employee_${employeeId}`;

   if (cache.has(cacheKey)) {
     return cache.get(cacheKey);
   }

   const result = await apiClient.get(`/employees/${employeeId}`);
   cache.set(cacheKey, result);
   ```

2. **請求限流**

   ```javascript
   // 使用 express-rate-limit
   import rateLimit from "express-rate-limit";

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 分鐘
     max: 100, // 限制每個 IP 100 次請求
   });

   app.use("/tools", limiter);
   ```

### 安全性

1. **輸入驗證**

   ```javascript
   // 驗證並清理使用者輸入
   const sanitizedInput = validator.escape(userInput);
   ```

2. **敏感資料處理**
   ```javascript
   // 在日誌中隱藏敏感資料
   const sanitizedParams = this._sanitizeParams(params);
   logger.info("Tool executed", { params: sanitizedParams });
   ```

---

## 📚 參考資源

- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Express.js 官方文檔](https://expressjs.com/)
- [Jest 測試框架](https://jestjs.io/)
- [Winston 日誌庫](https://github.com/winstonjs/winston)
- [Docker 官方文檔](https://docs.docker.com/)

---

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 遵循程式碼風格與測試要求
4. 提交變更 (`git commit -m 'Add amazing feature'`)
5. 推送分支 (`git push origin feature/amazing-feature`)
6. 建立 Pull Request

---

## 📄 授權條款

本專案採用 MIT 授權條款。詳見 [LICENSE](../LICENSE) 文件。

---

_最後更新: 2024-06-07_
