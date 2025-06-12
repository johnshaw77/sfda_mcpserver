/**
 * 資料庫連接服務
 *
 * 提供統一的資料庫連接管理
 * 支援連接池和重連機制
 */

import mysql from "mysql2/promise";
import config from "../config/config.js";
import logger from "../config/logger.js";

class DatabaseService {
  constructor() {
    this.pools = new Map();
    this.isInitialized = false;
  }

  /**
   * 初始化資料庫連接池
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // 創建 QMS 資料庫連接池
      console.log("initialize..........", config.dbConfig.qms);
      if (config.dbConfig?.qms) {
        const qmsPool = mysql.createPool({
          ...config.dbConfig.qms,
          waitForConnections: true,
          queueLimit: 0,
        });

        // 測試連接
        const connection = await qmsPool.getConnection();
        await connection.ping();
        connection.release();

        this.pools.set("qms", qmsPool);
        logger.info("QMS 資料庫連接池初始化成功", {
          host: config.dbConfig.qms.host,
          database: config.dbConfig.qms.database,
        });
      }

      this.isInitialized = true;
      logger.info("資料庫服務初始化完成");
    } catch (error) {
      logger.error("資料庫連接失敗", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 取得指定資料庫的連接池
   */
  getPool(dbName) {
    if (!this.isInitialized) {
      throw new Error("資料庫服務尚未初始化，請先調用 initialize()");
    }

    const pool = this.pools.get(dbName);
    if (!pool) {
      throw new Error(`找不到資料庫連接池: ${dbName}`);
    }

    return pool;
  }

  /**
   * 執行 SQL 查詢
   */
  async query(dbName, sql, params = []) {
    try {
      const pool = this.getPool(dbName);
      const [rows, fields] = await pool.execute(sql, params);

      logger.debug("SQL 查詢執行成功", {
        database: dbName,
        sql: sql.substring(0, 100) + (sql.length > 100 ? "..." : ""),
        affectedRows: rows.length,
      });

      return rows;
    } catch (error) {
      logger.error("SQL 查詢執行失敗", {
        database: dbName,
        sql: sql.substring(0, 100) + (sql.length > 100 ? "..." : ""),
        params: params,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 開始交易
   */
  async beginTransaction(dbName) {
    const pool = this.getPool(dbName);
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  /**
   * 關閉所有連接池
   */
  async close() {
    try {
      for (const [name, pool] of this.pools) {
        await pool.end();
        logger.info(`${name} 資料庫連接池已關閉`);
      }
      this.pools.clear();
      this.isInitialized = false;
      logger.info("所有資料庫連接已關閉");
    } catch (error) {
      logger.error("關閉資料庫連接時發生錯誤", {
        error: error.message,
      });
    }
  }
}

// 創建單例實例
const databaseService = new DatabaseService();

export default databaseService;
