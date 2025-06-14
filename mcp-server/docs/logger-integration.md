# 日誌系統整合說明

## 變更摘要

在此次更新中，我們整合了 MCP 伺服器的日誌系統，將原本分開的 `hybrid-logger.js` 和 `logger.js` 合併為單一的日誌模組。

### 主要變更

1. 將 `hybrid-logger.js` 的功能整合到 `logger.js` 中
2. 修復了日誌系統中的錯誤，確保 `this.levels` 在使用前先定義
3. 更新了所有引用 `hybrid-logger.js` 的檔案，改為使用 `logger.js`
4. 將 `hybridLogger` 變數改名為 `logger`
5. 在 `base-tool.js` 中將 `this.hybridLogger` 改為 `this.logger`
6. 修復了工具目錄中的日誌引入路徑問題
7. 刪除了 `hybrid-logger.js` 檔案

### 架構改進

- **統一日誌介面**：所有模組現在都透過 `logger` 進行日誌記錄
- **消除重複初始化**：避免同時初始化兩個日誌系統
- **更簡潔的導入方式**：統一使用 `import logger from "../config/logger.js";`
- **減少混淆**：避免在專案中同時使用兩種不同名稱的日誌系統

### 使用方式

```javascript
import logger from "../config/logger.js";

// 基本日誌方法
logger.error("錯誤訊息", { context: "額外資訊" });
logger.warn("警告訊息");
logger.info("一般訊息");
logger.debug("除錯訊息");
logger.trace("追蹤訊息");

// 特殊用途日誌方法
logger.toolCall(toolName, params, result, duration, clientId);
logger.apiAccess(req, res, duration);
logger.systemEvent(event, data);

// 其他功能
logger.setLogLevel("info");
logger.rotateAllLogs();
```

## 注意事項

- 如有新工具需要使用日誌系統，請使用正確的相對路徑導入 `logger.js`
  - 第一層目錄使用 `import logger from "../config/logger.js";`
  - 第二層目錄使用 `import logger from "../../config/logger.js";`
