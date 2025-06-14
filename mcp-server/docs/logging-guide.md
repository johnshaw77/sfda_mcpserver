# MCP 伺服器日誌系統使用指南

## 概述

MCP 伺服器使用統一的混合式日誌系統（HybridLogger），支援多種日誌功能：

- 檔案日誌（不同等級分檔）
- 資料庫日誌（SQLite 支援查詢）
- 結構化日誌（JSON 格式）
- 日誌輪轉機制
- 開發環境控制台輸出
- API 存取日誌
- 工具調用日誌

## 使用方法

在專案中使用日誌系統的標準方法：

```javascript
import logger from "../config/logger.js";

// 使用不同日誌等級
logger.error("發生錯誤", { details: error });
logger.warn("警告訊息", { source: "module-name" });
logger.info("一般訊息");
logger.debug("除錯資訊", { data: someObject });
logger.trace("追蹤資訊", { details: "詳細追蹤資料" });

// 也支援動態日誌等級
logger.log("info", "日誌訊息", { meta: "資料" });
```

## 特殊用途日誌方法

```javascript
// 記錄工具調用
logger.toolCall("工具名稱", params, result, duration, clientId);

// 記錄 API 存取
logger.apiAccess(req, res, duration);

// 記錄系統事件
logger.systemEvent("事件名稱", { eventData: "資料" });
```

## 日誌等級

日誌系統支援以下等級（從高到低）：

1. `error` - 錯誤訊息
2. `warn` - 警告訊息
3. `info` - 一般資訊
4. `debug` - 除錯資訊
5. `trace` - 詳細追蹤資訊

設定較低等級（如 `debug`）時，會同時記錄所有更高等級的日誌。

## 注意事項

1. 專案中已統一日誌系統，不再需要同時導入 `hybrid-logger.js` 和 `logger.js`
2. 為了代碼一致性，建議統一使用 `import logger from "../config/logger.js"`
3. 日誌系統在 `server.js` 中已自動初始化，不需要手動初始化
4. 在命令列可通過環境變數設定日誌等級：`LOG_LEVEL=debug node src/server.js`

## 日誌檔案位置

- 一般日誌：`/logs/combined.log`
- 錯誤日誌：`/logs/error.log`
- 工具調用日誌：`/logs/tool-calls.log`
- API 存取日誌：`/logs/access.log`
- 資料庫日誌：`/logs/logs.db`
