import dotenv from "dotenv";
import dbConfig from "./db-config.js";
// 載入環境變數
dotenv.config();

const config = {
  // 服務器配置
  port: process.env.MCP_PORT || 8080,
  nodeEnv: process.env.NODE_ENV || "development",

  // API 配置 (TODO: 待確認是否需要)
  mainSystemUrl:
    process.env.MAIN_SYSTEM_URL || "http://10.8.38.110:3000/api/mcp",
  apiTimeout: parseInt(process.env.API_TIMEOUT) || 30000,

  // 日誌配置
  logLevel: process.env.LOG_LEVEL || "info",
  loggingEnabled: process.env.LOGGING_ENABLED === "true",

  // 開發配置
  debug: process.env.DEBUG === "true",

  // 資料庫配置
  dbConfig: dbConfig,

  // 取得是否為開發環境
  isDevelopment() {
    return this.nodeEnv === "development";
  },

  // 取得是否為生產環境
  isProduction() {
    return this.nodeEnv === "production";
  },

  // 驗證必要的環境變數
  validate() {
    const required = ["MCP_PORT"];
    const missing = required.filter(
      key => !process.env[key] && !this[key.toLowerCase().replace("mcp_", "")],
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }
  },
};

export default config;
