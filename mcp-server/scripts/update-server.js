/**
 * server.js 特別修改腳本
 * 移除多餘的 hybridLogger 引用
 */

import fs from "fs";
const path =
  "/Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/server.js";

// 讀取檔案
console.log("修改 server.js 中的日誌引用...");
let content = fs.readFileSync(path, "utf8");

// 替換引用
content = content.replace(
  `import logger from "./config/logger.js";
import hybridLogger from "./config/hybrid-logger.js";`,
  `import logger from "./config/logger.js";`,
);

// 替換初始化
content = content.replace(
  `// 確保混合日誌系統已初始化
await hybridLogger.init();`,
  `// 確保日誌系統已初始化
await logger.init();`,
);

// 替換所有 hybridLogger. 為 logger.
content = content.replace(/hybridLogger\./g, "logger.");

// 寫入檔案
fs.writeFileSync(path, content, "utf8");
console.log("server.js 修改完成!");
