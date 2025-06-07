# MCP Server 工具使用範例

> 📅 最後更新：2025 年 6 月 7 日  
> 🎯 適用於：開發者、測試人員、系統整合人員

## 📋 概述

本文件提供 MCP Server 所有工具的詳細使用範例，包括：

- 完整的 cURL 命令範例
- JavaScript/Node.js 程式碼範例
- 錯誤處理示例
- 最佳實踐建議

---

## 🔧 通用測試指令

### 基礎健康檢查

```bash
# 檢查服務狀態
curl http://localhost:8080/health

# 取得所有可用工具
curl http://localhost:8080/tools | jq

# 檢查工具統計
curl http://localhost:8080/tools/stats | jq
```

---

## 🏢 員工相關工具

### 1. get_employee_info - 查詢員工資訊

**用途**：根據員工編號查詢員工詳細資訊

#### cURL 範例

```bash
# 基本查詢
curl -X POST http://localhost:8080/tools/get_employee_info \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001"
  }' | jq

# 查詢多個欄位
curl -X POST http://localhost:8080/tools/get_employee_info \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "include_details": true
  }' | jq
```

#### JavaScript 範例

```javascript
const axios = require("axios");

async function getEmployeeInfo(employeeId) {
  try {
    const response = await axios.post(
      "http://localhost:8080/tools/get_employee_info",
      {
        employee_id: employeeId,
      }
    );

    console.log("員工資訊:", response.data);
    return response.data;
  } catch (error) {
    console.error("查詢失敗:", error.response?.data || error.message);
    throw error;
  }
}

// 使用範例
getEmployeeInfo("EMP001")
  .then((info) => {
    console.log(`員工 ${info.name} 任職於 ${info.department}`);
  })
  .catch((err) => {
    console.error("處理失敗:", err);
  });
```

#### 預期回應

```json
{
  "employee_id": "EMP001",
  "name": "王大明",
  "department": "資訊技術部",
  "position": "軟體工程師",
  "email": "wang.daming@company.com",
  "phone": "02-2345-6789",
  "hire_date": "2023-01-15",
  "manager": "張經理",
  "location": "台北總部",
  "skills": ["JavaScript", "Node.js", "MCP Protocol"],
  "status": "active"
}
```

---

### 2. get_department_list - 取得部門列表

**用途**：取得公司所有部門的基本資訊

#### cURL 範例

```bash
# 取得所有部門
curl -X POST http://localhost:8080/tools/get_department_list \
  -H "Content-Type: application/json" \
  -d '{}' | jq

# 取得部門詳細資訊
curl -X POST http://localhost:8080/tools/get_department_list \
  -H "Content-Type: application/json" \
  -d '{
    "include_stats": true
  }' | jq
```

#### JavaScript 範例

```javascript
async function getDepartmentList(includeStats = false) {
  try {
    const response = await axios.post(
      "http://localhost:8080/tools/get_department_list",
      {
        include_stats: includeStats,
      }
    );

    return response.data.departments;
  } catch (error) {
    console.error("取得部門列表失敗:", error.message);
    throw error;
  }
}

// 使用範例
getDepartmentList(true).then((departments) => {
  departments.forEach((dept) => {
    console.log(`${dept.name}: ${dept.employee_count} 人`);
  });
});
```

---

## 📰 新聞相關工具

### 3. get_company_news - 取得公司新聞

**用途**：查詢公司內部新聞和公告

#### cURL 範例

```bash
# 取得最新新聞
curl -X POST http://localhost:8080/tools/get_company_news \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 5
  }' | jq

# 按類別查詢
curl -X POST http://localhost:8080/tools/get_company_news \
  -H "Content-Type: application/json" \
  -d '{
    "category": "技術公告",
    "limit": 10
  }' | jq

# 按日期範圍查詢
curl -X POST http://localhost:8080/tools/get_company_news \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-06-01",
    "end_date": "2025-06-07",
    "priority": "high"
  }' | jq
```

#### JavaScript 範例

```javascript
async function getCompanyNews(options = {}) {
  const defaultOptions = {
    limit: 10,
    category: null,
    priority: null,
  };

  const params = { ...defaultOptions, ...options };

  try {
    const response = await axios.post(
      "http://localhost:8080/tools/get_company_news",
      params
    );
    return response.data.news;
  } catch (error) {
    console.error("取得新聞失敗:", error.message);
    throw error;
  }
}

// 使用範例 - 取得技術類新聞
getCompanyNews({ category: "技術公告", limit: 3 }).then((news) => {
  news.forEach((item) => {
    console.log(`[${item.category}] ${item.title}`);
    console.log(`發布日期: ${item.publish_date}`);
    console.log(`閱讀數: ${item.views}`);
    console.log("---");
  });
});
```

---

## 🤖 AI 聊天工具

### 4. ai_chat - AI 對話

**用途**：與 AI 助手進行對話，處理各種企業問題

#### cURL 範例

```bash
# 基本對話
curl -X POST http://localhost:8080/tools/ai_chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "請幫我查詢王大明的聯絡資訊",
    "context": "employee_query"
  }' | jq

# 指定助手類型
curl -X POST http://localhost:8080/tools/ai_chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "本月的部門預算使用情況如何？",
    "assistant_type": "financial",
    "department": "資訊技術部"
  }' | jq
```

#### JavaScript 範例

```javascript
async function aiChat(message, options = {}) {
  const params = {
    message,
    context: options.context || "general",
    assistant_type: options.assistantType || "general",
    ...options,
  };

  try {
    const response = await axios.post(
      "http://localhost:8080/tools/ai_chat",
      params
    );
    return response.data;
  } catch (error) {
    console.error("AI 對話失敗:", error.message);
    throw error;
  }
}

// 使用範例 - 員工查詢
aiChat("請查詢李小華的部門和職位", {
  context: "employee_query",
  assistantType: "hr",
}).then((response) => {
  console.log("AI 回應:", response.response);
  if (response.actions_taken) {
    console.log("執行的動作:", response.actions_taken);
  }
});
```

---

## 📊 統計和監控工具

### 5. get_system_stats - 系統統計

**用途**：取得系統運行統計資訊

#### cURL 範例

```bash
# 基本統計
curl -X POST http://localhost:8080/tools/get_system_stats \
  -H "Content-Type: application/json" \
  -d '{}' | jq

# 詳細統計
curl -X POST http://localhost:8080/tools/get_system_stats \
  -H "Content-Type: application/json" \
  -d '{
    "include_tools": true,
    "include_performance": true
  }' | jq
```

---

## ⚡ SSE 事件流測試

### 訂閱即時事件

```bash
# 訂閱所有事件
curl -N http://localhost:8080/sse

# 使用過濾器
curl -N "http://localhost:8080/sse?filter=tool_calls,system_alerts"

# 指定事件 ID
curl -N -H "Last-Event-ID: 12345" http://localhost:8080/sse
```

### JavaScript SSE 客戶端

```javascript
// SSE 連接範例
function connectToEventStream() {
  const eventSource = new EventSource("http://localhost:8080/sse");

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data);
    console.log("收到事件:", data);
  };

  eventSource.onerror = function (error) {
    console.error("SSE 連接錯誤:", error);
  };

  // 監聽特定事件類型
  eventSource.addEventListener("tool_call", function (event) {
    const data = JSON.parse(event.data);
    console.log("工具調用事件:", data);
  });

  return eventSource;
}

// 使用範例
const eventStream = connectToEventStream();

// 5 分鐘後關閉連接
setTimeout(() => {
  eventStream.close();
  console.log("SSE 連接已關閉");
}, 5 * 60 * 1000);
```

---

## 🔥 MCP 協議測試

### JSON-RPC 2.0 調用

```bash
# MCP 協議端點
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }' | jq

# 調用特定工具
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_employee_info",
      "arguments": {
        "employee_id": "EMP001"
      }
    },
    "id": 2
  }' | jq
```

---

## 🚨 錯誤處理範例

### 常見錯誤情況

```javascript
// 錯誤處理的完整範例
async function robustToolCall(toolName, params) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await axios.post(
        `http://localhost:8080/tools/${toolName}`,
        params,
        {
          timeout: 30000, // 30 秒超時
        }
      );

      return response.data;
    } catch (error) {
      attempt++;

      if (error.response) {
        // 伺服器回應錯誤
        const { status, data } = error.response;

        switch (status) {
          case 400:
            console.error("請求參數錯誤:", data.error);
            throw new Error(`參數錯誤: ${data.error}`);

          case 404:
            console.error("工具不存在:", toolName);
            throw new Error(`工具 ${toolName} 不存在`);

          case 500:
            console.error("伺服器內部錯誤:", data.error);
            if (attempt === maxRetries) {
              throw new Error("伺服器錯誤，請稍後重試");
            }
            break;

          default:
            console.error("未預期的錯誤:", status, data);
            throw error;
        }
      } else if (error.code === "ECONNREFUSED") {
        console.error("無法連接到伺服器");
        throw new Error("伺服器連接失敗");
      } else if (error.code === "TIMEOUT") {
        console.warn(`第 ${attempt} 次嘗試超時`);
        if (attempt === maxRetries) {
          throw new Error("請求超時");
        }
      } else {
        throw error;
      }

      // 重試前等待
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 指數退避
        console.log(`等待 ${delay}ms 後重試...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
```

---

## 📈 效能測試

### 壓力測試腳本

```bash
#!/bin/bash

# 並發測試腳本
echo "開始效能測試..."

# 測試健康檢查端點
ab -n 1000 -c 10 http://localhost:8080/health

# 測試工具列表端點
ab -n 500 -c 5 http://localhost:8080/tools

# 測試具體工具調用
for i in {1..100}; do
  curl -X POST http://localhost:8080/tools/get_employee_info \
    -H "Content-Type: application/json" \
    -d '{"employee_id": "EMP001"}' &
done

wait
echo "效能測試完成"
```

---

## 🔍 除錯工具

### 日誌查看

```bash
# 查看即時日誌
tail -f logs/mcp-server.log

# 查看錯誤日誌
grep ERROR logs/mcp-server.log

# 查看特定工具的日誌
grep "get_employee_info" logs/mcp-server.log
```

### 監控指標

```bash
# 查看 Prometheus 指標
curl http://localhost:8080/metrics

# 查看工具統計
curl http://localhost:8080/tools/stats | jq '.tools[] | select(.name == "get_employee_info")'
```

---

## 💡 最佳實踐

### 1. 錯誤處理

- 總是實作重試機制
- 使用適當的超時設定
- 記錄詳細的錯誤資訊

### 2. 效能優化

- 使用連接池
- 實作請求快取
- 監控回應時間

### 3. 安全考量

- 驗證輸入參數
- 記錄敏感操作
- 使用 HTTPS

### 4. 監控和除錯

- 啟用詳細日誌
- 監控關鍵指標
- 設定告警機制

---

## 📚 相關文檔

- [API 規格文檔](./api-spec.md)
- [開發者指南](./developer-guide.md)
- [部署指南](./deployment.md)
- [故障排除](./troubleshooting.md)
