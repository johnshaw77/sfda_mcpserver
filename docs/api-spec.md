api-spec.md（API 規格文件）主要用來描述 MCP Server 對外暴露的 API 介面，讓前端、AI 主系統後端、測試人員或其他開發者可以根據這份文件，正確呼叫 MCP Server 的各項服務。

api-spec.md 內容範例
以下是一份典型的 MCP Server API 規格文件內容架構與範例：

# MCP Server API 規格文件

## 概述

本文件定義 MCP Server 提供的 HTTP API，包括工具列表查詢、工具調用、健康檢查等。  
所有 API 均採用 JSON 格式傳遞資料。

---

## 認證

目前無認證（僅限內網存取）。

---

## API 一覽

| 方法 | 路徑             | 說明              |
| ---- | ---------------- | ----------------- |
| GET  | /health          | 健康檢查          |
| GET  | /tools           | 取得工具清單      |
| POST | /tools/:toolName | 調用指定工具      |
| GET  | /sse             | 訂閱事件流（SSE） |

---

## API 詳細規格

### 1. 健康檢查

- **路徑**：`GET /health`
- **說明**：確認 MCP Server 存活狀態
- **回應範例**：
  ```json
  { "status": "ok", "timestamp": "2024-06-06T12:00:00Z" }
  ```

---

### 2. 取得工具清單

- **路徑**：`GET /tools`
- **說明**：列出所有可用工具及其規格
- **回應範例**：
  ```json
  [
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
  ```

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
  ```
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
