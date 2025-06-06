# api-client.js 的角色與職責分工

「MCP Server」和「AI 主系統後端」的職責分工，以及**api-client.js**的角色：

---

## 一、職責分界說明

### 1. AI 主系統後端

- **主要任務**：處理與 AI 對話相關的業務邏輯、用戶狀態管理、上下文維護、調用 MCP Server。
- **面向**：主要服務於「AI 前端」或「AI 對話系統」。
- **與企業 API 互動**：**不直接調用企業後端 API**，而是**透過 MCP Server** 來存取資料。

### 2. MCP Server

- **主要任務**：作為「AI 主系統」和「企業後端 API」的中介層，將企業各種異質 API 包裝成標準化工具，並統一錯誤處理、格式轉換。
- **面向**：主要服務於「AI 主系統」或其他需要企業資料的應用。
- **與企業 API 互動**：**直接調用企業後端 API**，並將結果回傳給 AI 主系統。

### 3. api-client.js

- **角色**：專門負責 MCP Server 內部所有與企業後端 API 的 HTTP 請求。
- **存在意義**：讓 MCP Server 能輕鬆呼叫企業後端 API，並統一處理逾時、錯誤、日誌等細節。

---

## 二、流程圖解

```
[AI前端] → [AI主系統後端] → [MCP Server] → [企業後端API]
```

- AI 主系統後端負責「AI」相關邏輯，當需要企業資料時，**呼叫 MCP Server**。
- MCP Server 透過 api-client.js 去呼叫企業 API，把結果轉成標準格式回給 AI 主系統後端。

---

## 三、為什麼要有 MCP Server？

1. **標準化**：企業 API 格式、錯誤處理、參數命名都不一樣，MCP Server 統一包裝。
2. **隔離**：AI 主系統不需知道企業 API 的細節，降低耦合。
3. **擴充性**：未來要接更多企業系統（如 OA、CRM），只需在 MCP Server 加工具即可。
4. **安全性**：可以集中做存取控管、日誌紀錄。

---

## 四、比喻

- **MCP Server**像是「企業 API 的統一櫃台」，你（AI 主系統）只需要跟櫃台說需求，櫃台會幫你處理好所有細節。
- **api-client.js**就是櫃台裡負責「打電話」給各部門（企業 API）的那個人。

---

## 五、簡單對照表

| 功能          | AI 主系統後端 | MCP Server (api-client.js) |
| ------------- | ------------- | -------------------------- |
| AI 對話邏輯   | ✅            |                            |
| 用戶管理      | ✅            |                            |
| 調用企業 API  | ❌ (直接呼叫) | ✅ (透過 api-client.js)    |
| 統一 API 格式 | ❌            | ✅                         |
| 工具定義      | ❌            | ✅                         |

---

## 六、結論

- **AI 主系統後端只需要跟 MCP Server 溝通**，不用直接處理企業 API 細節。
- **MCP Server 內部用 api-client.js 跟企業 API 溝通**，對外只暴露統一的工具介面。

---

如果你想要「AI 主系統後端」直接呼叫企業 API，那 MCP Server 就可以不用存在，但這樣會失去上述的好處（標準化、隔離、易擴充）。  
**有 MCP Server，能讓你的 AI 主系統更乾淨、更可維護、更容易擴展。**

---

## api-client.js 範例程式碼

```javascript
// src/services/api-client.js

const axios = require("axios");

const BASE_URL = process.env.MAIN_SYSTEM_URL || "http://localhost:3000/api/mcp";
const TIMEOUT = parseInt(process.env.API_TIMEOUT, 10) || 30000;

/**
 * 發送 HTTP 請求到企業後端 API
 * @param {string} method - HTTP 方法（GET、POST、PUT、DELETE）
 * @param {string} path - API 路徑（相對於 BASE_URL）
 * @param {object} params - 查詢參數（GET 用）
 * @param {object} data - 請求主體資料（POST/PUT 用）
 * @returns {Promise<object>} - 回傳企業後端 API 的資料
 */
async function request({ method = "GET", path, params = {}, data = {} }) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${path}`,
      params,
      data,
      timeout: TIMEOUT,
    });
    return response.data;
  } catch (err) {
    // 統一錯誤處理與日誌
    console.error(`[API-CLIENT] ${method} ${path} error:`, err.message);
    throw {
      code: err.code || "API_ERROR",
      message: err.response?.data?.message || err.message,
      status: err.response?.status || 500,
    };
  }
}

// 範例：查詢員工資訊
async function getEmployeeInfo(employeeId) {
  return request({
    method: "GET",
    path: `/hr/employees/${employeeId}`,
  });
}

// 範例：取得部門列表
async function getDepartmentList() {
  return request({
    method: "GET",
    path: "/hr/departments",
  });
}

// ...可依需求新增更多 API 封裝方法

module.exports = {
  request,
  getEmployeeInfo,
  getDepartmentList,
  // 其他 API 方法...
};
```
