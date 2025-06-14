/**
 * base-tool.js 特別修改腳本
 * 替換 hybridLogger 為 logger
 */

// 修改 base-tool.js 中的日誌系統引用
const baseToolPath =
  "/Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/tools/base-tool.js";
import fs from "fs";

// 讀取檔案
console.log("修改 base-tool.js 中的日誌引用...");
let content = fs.readFileSync(baseToolPath, "utf8");

// 替換引用
content = content.replace(
  `import hybridLogger from "../config/hybrid-logger.js";
import { HybridLogger } from "../config/hybrid-logger.js";`,
  `import logger from "../config/logger.js";`,
);

// 替換屬性
content = content.replace(
  `    // 使用全局混合日誌系統，而不是為每個工具創建新實例
    this.hybridLogger = hybridLogger;`,
  `    // 使用全局日誌系統
    this.logger = logger;`,
);

// 替換所有使用 this.hybridLogger 的地方
content = content.replace(/this\.hybridLogger\./g, "this.logger.");

// 寫入檔案
fs.writeFileSync(baseToolPath, content, "utf8");
console.log("base-tool.js 修改完成!");
