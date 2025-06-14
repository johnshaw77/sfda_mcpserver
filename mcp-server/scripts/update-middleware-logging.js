/**
 * middleware/logging.js 特別修改腳本
 * 替換所有 hybridLogger 為 logger
 */

import fs from "fs";
const path =
  "/Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/middleware/logging.js";

// 讀取檔案
console.log("修改 middleware/logging.js 中的日誌引用...");
let content = fs.readFileSync(path, "utf8");

// 替換引用
content = content.replace(
  `import hybridLogger from "../config/hybrid-logger.js";`,
  `import logger from "../config/logger.js";`,
);

// 替換所有 hybridLogger. 為 logger.
content = content.replace(/hybridLogger\./g, "logger.");

// 寫入檔案
fs.writeFileSync(path, content, "utf8");
console.log("middleware/logging.js 修改完成!");
