# MCP Server API 規格文件

> 📅 最後更新：2025 年 6 月 7 日  
> 🎯 版本：v1.0.0

## 概述

本文件定義 MCP Server 提供的完整 HTTP API 規格，包括工具管理、健康檢查、即時通訊等功能。  
所有 API 均採用 JSON 格式傳遞資料。

**基礎 URL**: `http://localhost:8080`

---

## 認證

目前版本無需認證（僅限內網存取）。

---

## API 總覽

### 核心端點

| 方法 | 路徑          | 說明                    |
| ---- | ------------- | ----------------------- |
| GET  | /             | 服務器資訊              |
| GET  | /health       | 健康檢查                |
| GET  | /tools        | 取得工具清單            |
| GET  | /tools/stats  | 所有工具統計資訊        |
| GET  | /tools/health | 工具健康檢查            |
| POST | /mcp          | MCP 協議端點 (JSON-RPC) |
| GET  | /sse          | 訂閱事件流（SSE）       |
| GET  | /sse/stats    | SSE 連接統計            |

### 模組化業務端點（推薦使用）

| 方法 | 路徑                   | 說明                     |
| ---- | ---------------------- | ------------------------ |
| GET  | /api/hr/tools          | 人資模組工具列表查詢     |
| POST | /api/hr/:toolName      | 人資模組工具調用         |
| GET  | /api/finance/tools     | 財務模組工具列表查詢     |
| POST | /api/finance/:toolName | 財務模組工具調用         |
| GET  | /api/tasks/tools       | 任務管理模組工具列表查詢 |
| POST | /api/tasks/:toolName   | 任務管理模組工具調用     |
| GET  | /tools/:toolName/stats | 特定工具統計資訊         |

### 相容性端點（向後相容）

| 方法 | 路徑             | 說明                 |
| ---- | ---------------- | -------------------- |
| POST | /tools/:toolName | 調用指定工具（測試） |

---

## API 詳細規格

### 1. 服務器資訊

- **路徑**：`GET /`
- **說明**：取得服務器基本資訊和可用端點
- **回應範例**：
  ```json
  {
    "message": "MCP Server is running",
    "version": "1.0.0",
    "endpoints": {
      "health": "/health",
      "tools": "/tools",
      "toolTest": "/tools/:toolName",
      "toolStats": "/tools/stats",
      "toolHealth": "/tools/health",
      "mcp": "/mcp",
      "sse": "/sse",
      "sseStats": "/sse/stats",
      "hrApi": "/api/hr/:toolName",
      "financeApi": "/api/finance/:toolName",
      "tasksApi": "/api/tasks/:toolName"
    },
    "modules": {
      "hr": {
        "endpoint": "/api/hr/:toolName",
        "tools": [
          "get_employee_info",
          "get_employee_list",
          "get_attendance_record",
          "get_salary_info",
          "get_department_list"
        ]
      },
      "finance": {
        "endpoint": "/api/finance/:toolName",
        "tools": ["get_budget_status"]
      },
      "tasks": {
        "endpoint": "/api/tasks/:toolName",
        "tools": ["create_task", "get_task_list"]
      }
    },
    "mcp": {
      "protocolVersion": "2024-11-05",
      "supported": true
    },
    "toolsRegistered": 8
  }
  ```

### 2. 健康檢查

- **路徑**：`GET /health`
- **說明**：確認 MCP Server 存活狀態及系統資訊
- **回應範例**：
  ```json
  {
    "status": "ok",
    "timestamp": "2025-06-07T00:00:00.000Z",
    "version": "1.0.0",
    "environment": "development",
    "mcp": {
      "protocolVersion": "2024-11-05",
      "initialized": true,
      "connections": 0
    }
  }
  ```

### 3. 工具管理

#### 3.1 取得工具清單

- **路徑**：`GET /tools`
- **說明**：列出所有可用工具及其規格
- **回應範例**：
  ```json
  {
    "tools": [
      {
        "name": "get_employee_info",
        "description": "查詢員工基本資訊，包括個人資料、部門、職位、聯絡方式等",
        "inputSchema": {
          "type": "object",
          "properties": {
            "employeeId": {
              "type": "string",
              "description": "員工編號（A開頭，後接6位數字）"
            },
            "fields": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["basic", "contact", "department", "position"]
              },
              "description": "要查詢的欄位類型"
            },
            "includeDetails": {
              "type": "boolean",
              "description": "是否包含詳細資訊"
            }
          },
          "required": ["employeeId"]
        }
      }
    ],
    "count": 4
  }
  ```

#### 3.2 調用工具（測試端點）

- **路徑**：`POST /tools/:toolName`
- **說明**：調用指定工具進行測試
- **參數**：
  - `:toolName` - 工具名稱（如：get_employee_info）
  - Body: 工具所需的參數
- **請求範例**：
  ```json
  {
    "employeeId": "A123456",
    "fields": ["basic", "contact"],
    "includeDetails": true
  }
  ```
- **成功回應範例**：
  ```json
  {
    "success": true,
    "toolName": "get_employee_info",
    "result": {
      "employeeId": "A123456",
      "basic": {
        "name": "張三",
        "gender": "男",
        "age": 30
      },
      "contact": {
        "email": "zhang.san@company.com",
        "phone": "0912-345-678"
      }
    },
    "timestamp": "2025-06-07T00:00:00.000Z"
  }
  ```
- **錯誤回應範例**：
  ```json
  {
    "success": false,
    "toolName": "get_employee_info",
    "error": {
      "message": "Employee not found: A999999",
      "type": "not_found",
      "details": null
    },
    "timestamp": "2025-06-07T00:00:00.000Z"
  }
  ```

#### 3.3 工具統計資訊

- **路徑**：`GET /tools/stats`
- **說明**：取得所有工具的使用統計
- **回應範例**：
  ```json
  {
    "totalTools": 4,
    "totalExecutions": 25,
    "successRate": 96.0,
    "tools": {
      "get_employee_info": {
        "executions": 15,
        "successes": 14,
        "failures": 1,
        "successRate": 93.33,
        "averageExecutionTime": 245
      }
    }
  }
  ```

#### 3.4 特定工具統計

- **路徑**：`GET /tools/:toolName/stats`
- **說明**：取得指定工具的詳細統計
- **回應範例**：
  ```json
  {
    "toolName": "get_employee_info",
    "executions": 15,
    "successes": 14,
    "failures": 1,
    "successRate": 93.33,
    "averageExecutionTime": 245,
    "lastExecution": "2025-06-07T00:00:00.000Z"
  }
  ```

#### 3.5 工具健康檢查

- **路従**：`GET /tools/health`
- **說明**：檢查所有工具的健康狀態
- **回應範例**：
  ```json
  {
    "status": "healthy",
    "checkedAt": "2025-06-07T00:00:00.000Z",
    "tools": {
      "get_employee_info": "healthy",
      "get_employee_list": "healthy",
      "get_attendance_record": "healthy",
      "get_salary_info": "healthy"
    },
    "summary": {
      "total": 4,
      "healthy": 4,
      "unhealthy": 0
    }
  }
  ```

### 3.6 模組化工具調用 (推薦使用)

以下為新版模組化 API 端點，按業務邏輯分類工具調用，提供更清晰的 API 架構。

#### 3.6.1 人資模組工具

**工具列表查詢：**

- **路徑**：`GET /api/hr/tools`
- **說明**：取得人資模組所有可用工具的詳細資訊（包含描述和輸入架構）
- **回應範例**：
  ```json
  {
    "module": "hr",
    "tools": [
      {
        "name": "get_employee_info",
        "description": "查詢員工基本資訊，包括個人資料、部門、職位、聯絡方式等",
        "inputSchema": {
          "type": "object",
          "properties": {
            "employeeId": {
              "type": "string",
              "description": "員工編號（A開頭，後接6位數字）"
            }
          },
          "required": ["employeeId"]
        }
      }
    ],
    "count": 5,
    "timestamp": "2025-06-07T00:00:00.000Z"
  }
  ```

**工具調用：**

- **路徑**：`POST /api/hr/:toolName`
- **說明**：調用人資模組相關工具
- **可用工具**：

  - `get_employee_info` - 員工資訊查詢
  - `get_employee_list` - 員工列表查詢
  - `get_attendance_record` - 出勤記錄查詢
  - `get_salary_info` - 薪資資訊查詢
  - `get_department_list` - 部門列表查詢

- **請求範例**：

  ```bash
  POST /api/hr/get_employee_info
  Content-Type: application/json

  {
    "employeeId": "A123456",
    "fields": ["basic", "contact"],
    "includeDetails": true
  }
  ```

- **成功回應範例**：
  ```json
  {
    "success": true,
    "module": "hr",
    "toolName": "get_employee_info",
    "result": {
      "employeeId": "A123456",
      "basic": {
        "name": "張小明",
        "gender": "男",
        "age": 30
      },
      "contact": {
        "email": "zhang.ming@company.com",
        "phone": "0912-345-678"
      }
    },
    "timestamp": "2025-06-07T00:00:00.000Z"
  }
  ```

#### 3.6.2 財務模組工具

**工具列表查詢：**

- **路徑**：`GET /api/finance/tools`
- **說明**：取得財務模組所有可用工具的詳細資訊（包含描述和輸入架構）
- **回應範例**：
  ```json
  {
    "module": "finance",
    "tools": [
      {
        "name": "get_budget_status",
        "description": "查詢預算執行狀況和財務相關資訊",
        "inputSchema": {
          "type": "object",
          "properties": {
            "budgetType": {
              "type": "string",
              "description": "預算類型"
            }
          }
        }
      }
    ],
    "count": 1,
    "timestamp": "2025-06-07T00:00:00.000Z"
  }
  ```

**工具調用：**

- **路徑**：`POST /api/finance/:toolName`
- **說明**：調用財務模組相關工具
- **可用工具**：

  - `get_budget_status` - 預算執行狀況查詢

- **請求範例**：

  ```bash
  POST /api/finance/get_budget_status
  Content-Type: application/json

  {
    "budgetType": "department",
    "fiscalYear": 2025
  }
  ```

#### 3.6.3 任務管理模組工具

**工具列表查詢：**

- **路徑**：`GET /api/tasks/tools`
- **說明**：取得任務管理模組所有可用工具的詳細資訊（包含描述和輸入架構）
- **回應範例**：
  ```json
  {
    "module": "tasks",
    "tools": [
      {
        "name": "create_task",
        "description": "創建新的工作任務，支援多種任務類型和自定義屬性",
        "inputSchema": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "任務標題"
            }
          },
          "required": ["title"]
        }
      }
    ],
    "count": 2,
    "timestamp": "2025-06-07T00:00:00.000Z"
  }
  ```

**工具調用：**

- **路徑**：`POST /api/tasks/:toolName`
- **說明**：調用任務管理模組相關工具
- **可用工具**：

  - `create_task` - 工作任務創建
  - `get_task_list` - 任務列表查詢

- **請求範例**：

  ```bash
  POST /api/tasks/create_task
  Content-Type: application/json

  {
    "title": "系統維護任務",
    "description": "定期系統維護和更新",
    "type": "maintenance",
    "assignee_id": "user001",
    "due_date": "2025-12-31",
    "department": "IT"
  }
  ```

#### 3.6.4 模組化端點錯誤處理

當工具名稱不存在時，會返回該模組可用的工具清單：

```json
{
  "success": false,
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "HR tool 'invalid_tool' not found. Available tools: get_employee_info, get_employee_list, get_attendance_record, get_salary_info, get_department_list"
  }
}
```

### 4. MCP 協議

#### 4.1 JSON-RPC 端點

- **路徑**：`POST /mcp`
- **說明**：MCP 協議的 JSON-RPC 2.0 端點
- **Content-Type**: `application/json`
- **支援的方法**：

  - `initialize` - 初始化連接
  - `tools/list` - 列出工具
  - `tools/call` - 調用工具
  - `resources/list` - 列出資源
  - `prompts/list` - 列出提示

- **初始化請求範例**：

  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {
        "tools": {},
        "resources": {},
        "prompts": {}
      },
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }
  ```

- **工具調用請求範例**：
  ```json
  {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_employee_info",
      "arguments": {
        "employeeId": "A123456"
      }
    }
  }
  ```

### 5. 即時通訊 (SSE)

#### 5.1 訂閱事件流

- **路徑**：`GET /sse`
- **說明**：建立 Server-Sent Events 連接，接收即時事件
- **Content-Type**: `text/event-stream`
- **事件類型**：

  - `welcome` - 連接歡迎訊息
  - `tool_execution` - 工具執行事件
  - `system_status` - 系統狀態更新

- **連接範例**：

  ```javascript
  const eventSource = new EventSource("http://localhost:8080/sse");

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data);
    console.log("收到事件:", data);
  };
  ```

#### 5.2 SSE 連接統計

- **路徑**：`GET /sse/stats`
- **說明**：取得 SSE 連接統計資訊
- **回應範例**：
  ```json
  {
    "totalConnections": 2,
    "activeConnections": 1,
    "totalMessagesSent": 25,
    "uptime": 3600000
  }
  ```

---

## 錯誤碼

| 狀態碼 | 說明           |
| ------ | -------------- |
| 200    | 請求成功       |
| 400    | 請求參數錯誤   |
| 404    | 資源不存在     |
| 500    | 伺服器內部錯誤 |

### 錯誤回應格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤描述",
    "details": "詳細資訊（可選）"
  },
  "timestamp": "2025-06-07T00:00:00.000Z"
}
```

---

## 範例與測試

### 模組化端點使用範例

```bash
# 取得人資模組工具列表
curl -X GET http://localhost:8080/api/hr/tools

# 取得財務模組工具列表
curl -X GET http://localhost:8080/api/finance/tools

# 取得任務管理模組工具列表
curl -X GET http://localhost:8080/api/tasks/tools

# 調用人資模組工具
curl -X POST http://localhost:8080/api/hr/get_employee_info \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "A123456"}'

# 調用財務模組工具
curl -X POST http://localhost:8080/api/finance/get_budget_status \
  -H "Content-Type: application/json" \
  -d '{"budgetType": "department", "fiscalYear": 2025}'

# 調用任務管理模組工具
curl -X POST http://localhost:8080/api/tasks/get_task_list \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "limit": 10}'
```

### 使用 curl 測試

```bash
# 健康檢查
curl -X GET http://localhost:8080/health

# 取得工具列表
curl -X GET http://localhost:8080/tools

# 調用員工資訊查詢工具
curl -X POST http://localhost:8080/tools/get_employee_info \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "A123456"}'

# 取得工具統計
curl -X GET http://localhost:8080/tools/stats
```

### 使用 JavaScript Fetch

```javascript
// 取得工具列表
const response = await fetch("http://localhost:8080/tools");
const tools = await response.json();

// 調用工具
const result = await fetch("http://localhost:8080/tools/get_employee_info", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    employeeId: "A123456",
    fields: ["basic", "contact"],
  }),
});
const data = await result.json();
```

---

## 注意事項

1. **網路安全**：目前版本僅適用於內網環境，生產環境需要加入認證機制
2. **請求限制**：無特殊限制，但建議避免過於頻繁的請求
3. **資料格式**：所有日期時間使用 ISO 8601 格式
4. **錯誤處理**：請妥善處理 HTTP 狀態碼和錯誤回應
5. **SSE 連接**：長時間連接建議加入重連機制
   {
   "name": "get_employee_info",
   "description": "查詢員工基本信息",
   "params": [{ "name": "employeeId", "type": "string", "required": true }],
   "returns": { "type": "object", "description": "員工資料" }
   },
   {
   "name": "get_budget_status",
   "description": "查詢預算執行狀況",
   "params": [
   { "name": "department", "type": "string", "required": true },
   { "name": "year", "type": "number", "required": true }
   ],
   "returns": { "type": "object", "description": "預算報告" }
   }
   ]

```

---

### 3. 調用指定工具

- **路徑**：`POST /tools/:toolName`
- **說明**：呼叫指定工具，傳入參數取得結果
- **請求範例**：

```

POST /tools/get_employee_info
Content-Type: application/json

{
"employeeId": "A123456"
}

````

- **回應範例**：
```json
{
  "success": true,
  "data": {
    "employeeId": "A123456",
    "name": "王小明",
    "department": "人資部",
    "title": "專員"
  }
}
````

- **錯誤回應範例**：
  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "找不到該員工"
    }
  }
  ```

---

### 4. 事件流（SSE）

- **路徑**：`GET /sse`
- **說明**：訂閱服務端推播事件（如工具狀態、通知等）
- **回應格式**：標準 Server-Sent Events
- **事件範例**：
  ```
  event: tool_update
  data: {"tool":"get_employee_info","status":"updated"}
  ```

---

## 資料格式與錯誤處理

- **所有回應皆為 JSON 格式**
- **錯誤格式**（範例）：
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_PARAMS",
      "message": "參數缺少 employeeId"
    }
  }
  ```

---

## 版本資訊

- **API 版本**：v1
- **最後更新**：2024-06-06

---

## 聯絡窗口

如有 API 使用問題，請聯繫 XXX（聯絡方式）。

---
