/**
 * Server-Sent Events (SSE) 支援模組
 *
 * 提供 MCP 協議的即時通訊功能，讓客戶端可以透過 SSE 與服務器進行雙向通訊。
 * 雖然 SSE 本身是單向的，但我們可以結合 POST 請求來實現雙向通訊。
 */

import logger from "../config/logger.js";

/**
 * SSE 連接管理器
 */
export class SSEConnectionManager {
  constructor() {
    this.connections = new Map();
    this.connectionCounter = 0;
  }

  /**
   * 建立新的 SSE 連接
   */
  createConnection(req, res) {
    const connectionId = `conn_${++this.connectionCounter}`;

    // 設定 SSE 標頭
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // 發送初始連接事件
    this.sendEvent(res, "connected", {
      connectionId,
      timestamp: new Date().toISOString(),
    });

    // 儲存連接
    const connection = {
      id: connectionId,
      response: res,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.connections.set(connectionId, connection);

    // 設定定期心跳
    const heartbeat = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeat);
        this.closeConnection(connectionId);
        return;
      }

      this.sendEvent(res, "heartbeat", {
        timestamp: new Date().toISOString(),
      });
    }, 30000); // 每 30 秒發送心跳

    // 處理連接關閉
    req.on("close", () => {
      clearInterval(heartbeat);
      this.closeConnection(connectionId);
    });

    req.on("error", error => {
      logger.error("SSE connection error:", error);
      clearInterval(heartbeat);
      this.closeConnection(connectionId);
    });

    logger.info(`SSE connection established: ${connectionId}`);
    return connectionId;
  }

  /**
   * 發送 SSE 事件
   */
  sendEvent(res, event, data = null, id = null) {
    if (res.writableEnded) {
      return false;
    }

    try {
      if (id) {
        res.write(`id: ${id}\n`);
      }

      res.write(`event: ${event}\n`);

      if (data) {
        res.write(`data: ${JSON.stringify(data)}\n`);
      }

      res.write("\n");
      return true;
    } catch (error) {
      logger.error("Failed to send SSE event:", error);
      return false;
    }
  }

  /**
   * 向特定連接發送事件
   */
  sendToConnection(connectionId, event, data = null, id = null) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }

    connection.lastActivity = new Date();
    return this.sendEvent(connection.response, event, data, id);
  }

  /**
   * 廣播事件到所有連接
   */
  broadcast(event, data = null, id = null) {
    let successCount = 0;

    for (const [connectionId, connection] of this.connections) {
      if (this.sendEvent(connection.response, event, data, id)) {
        connection.lastActivity = new Date();
        successCount++;
      } else {
        this.closeConnection(connectionId);
      }
    }

    return successCount;
  }

  /**
   * 關閉特定連接
   */
  closeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        if (!connection.response.writableEnded) {
          connection.response.end();
        }
      } catch (error) {
        logger.error("Error closing SSE connection:", error);
      }

      this.connections.delete(connectionId);
      logger.info(`SSE connection closed: ${connectionId}`);
    }
  }

  /**
   * 關閉所有連接
   */
  closeAllConnections() {
    for (const connectionId of this.connections.keys()) {
      this.closeConnection(connectionId);
    }
  }

  /**
   * 取得連接統計資訊
   */
  getStats() {
    return {
      activeConnections: this.connections.size,
      totalConnections: this.connectionCounter,
      connections: Array.from(this.connections.values()).map(conn => ({
        id: conn.id,
        createdAt: conn.createdAt,
        lastActivity: conn.lastActivity,
      })),
    };
  }

  /**
   * 清理無效連接 (定期呼叫)
   */
  cleanup() {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 分鐘超時

    for (const [connectionId, connection] of this.connections) {
      if (now - connection.lastActivity > timeout) {
        logger.info(`Cleaning up inactive SSE connection: ${connectionId}`);
        this.closeConnection(connectionId);
      }
    }
  }
}

// 建立全域連接管理器實例
export const sseManager = new SSEConnectionManager();

// 定期清理無效連接
setInterval(() => {
  sseManager.cleanup();
}, 60000); // 每分鐘清理一次
