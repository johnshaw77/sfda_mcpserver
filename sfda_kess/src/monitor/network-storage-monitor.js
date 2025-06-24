const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const EventEmitter = require("events");
const logger = require("../utils/logger");
const config = require("../../config");

// 使用 @marsaud/smb2 套件
const SMB2 = require("@marsaud/smb2");

/**
 * 跨平台網路儲存監控器
 * 使用 SMB2 套件直接連接網路共享，無需系統掛載
 */
class NetworkStorageMonitor extends EventEmitter {
  constructor() {
    super();
    this.platform = os.platform();
    this.smbClients = new Map(); // 儲存 SMB 客戶端
    this.monitoredPaths = new Map(); // 儲存監控的路徑
    this.pollIntervals = new Map(); // 儲存輪詢間隔
    this.fileCache = new Map(); // 快取已知檔案的修改時間
    this.isActive = false;
  }

  /**
   * 開始監控網路儲存
   * @param {Array<string>} networkPaths - 網路路徑陣列，例如 ['smb://10.1.1.127/shared']
   */
  async startMonitoring(networkPaths = []) {
    try {
      if (this.isActive) {
        logger.warn("網路儲存監控器已在執行中");
        return;
      }

      logger.info("開始網路儲存監控...");
      this.isActive = true;

      for (const networkPath of networkPaths) {
        await this.connectAndWatch(networkPath);
      }

      logger.info(
        `網路儲存監控啟動完成，監控 ${networkPaths.length} 個網路路徑`
      );
    } catch (error) {
      logger.logError("網路儲存監控啟動失敗", error);
      throw error;
    }
  }

  /**
   * 連接並監控網路路徑
   * @param {string} networkPath - 網路路徑，例如 'smb://10.1.1.127/shared'
   */
  async connectAndWatch(networkPath) {
    try {
      logger.info(`[SMB_CONNECT] 開始連接網路路徑: ${networkPath}`);

      // 解析網路路徑
      const pathInfo = this.parseNetworkPath(networkPath);
      if (!pathInfo) {
        throw new Error(`無效的網路路徑格式: ${networkPath}`);
      }

      // 建立 SMB 連線
      const smbClient = await this.createSMBConnection(pathInfo);

      // 儲存客戶端和路徑資訊
      this.smbClients.set(networkPath, smbClient);
      this.monitoredPaths.set(networkPath, pathInfo);

      logger.info(
        `[SMB_CONNECT] 成功連接到: ${pathInfo.host}/${pathInfo.share}`
      );

      // 開始監控
      await this.startWatchingPath(networkPath, pathInfo);
    } catch (error) {
      logger.logError(`連接和監控網路路徑失敗: ${networkPath}`, error);
      throw error;
    }
  }

  /**
   * 解析網路路徑
   * @param {string} networkPath - 網路路徑
   * @returns {Object|null} 解析後的路徑資訊
   */
  parseNetworkPath(networkPath) {
    try {
      // 支援多種格式：
      // smb://10.1.1.127/shared
      // smb://username:password@10.1.1.127/shared
      // smb://domain\\username:password@10.1.1.127/shared
      // //10.1.1.127/shared

      let match = networkPath.match(
        /^(?:smb:\/\/)?(?:([^:@]+)(?::([^@]+))?@)?([^\/]+)\/(.+)$/
      );

      if (match) {
        let username = match[1] || "guest";
        let domain = "";

        // 檢查是否包含 domain
        if (username.includes("\\\\")) {
          const parts = username.split("\\\\");
          domain = parts[0];
          username = parts[1];
        }

        return {
          protocol: "smb",
          domain: domain,
          username: username,
          password: match[2] || "",
          host: match[3],
          share: match[4],
          path: "", // 根目錄
          original: networkPath,
        };
      }

      return null;
    } catch (error) {
      logger.logError("解析網路路徑失敗", error);
      return null;
    }
  }

  /**
   * 建立 SMB 連線
   * @param {Object} pathInfo - 路徑資訊
   * @returns {Object} SMB 客戶端
   */
  async createSMBConnection(pathInfo) {
    return new Promise((resolve, reject) => {
      try {
        logger.info(
          `[SMB_DEBUG] 嘗試建立連線到 ${pathInfo.host}:${pathInfo.share}`
        );
        logger.info(`[SMB_DEBUG] Domain: ${pathInfo.domain || "flexium"}`);
        logger.info(`[SMB_DEBUG] 使用者: ${pathInfo.username || "guest"}`);

        const smbClient = new SMB2({
          share: `\\\\${pathInfo.host}\\${pathInfo.share}`,
          domain: pathInfo.domain || "flexium", // 使用解析出的 domain 或預設為 flexium
          username: pathInfo.username || "guest",
          password: pathInfo.password || "",
          autoCloseTimeout: 0, // 不自動關閉連線
          debug: true, // 啟用除錯模式
        });

        logger.info(`[SMB_DEBUG] SMB2 客戶端已建立`);

        // 測試連線
        smbClient.readdir("", (err, files) => {
          if (err) {
            logger.error(`[SMB_DEBUG] 連線測試失敗: ${err.message || err}`);
            logger.error(`[SMB_DEBUG] 錯誤代碼: ${err.code || "No code"}`);
            logger.error(`[SMB_DEBUG] 錯誤狀態: ${err.status || "No status"}`);
            reject(new Error(`SMB 連線失敗: ${err.message || err}`));
          } else {
            logger.info(
              `[SMB_DEBUG] 連線測試成功，找到 ${
                files ? files.length : 0
              } 個項目`
            );
            logger.info(
              `[SMB_CONNECT] 連線測試成功，已連接到共享目錄: ${pathInfo.share}`
            );
            resolve(smbClient);
          }
        });
      } catch (error) {
        logger.error(`[SMB_DEBUG] 建立客戶端時失敗: ${error.message || error}`);
        reject(error);
      }
    });
  }

  /**
   * 開始監控路徑
   * @param {string} networkPath - 網路路徑
   * @param {Object} pathInfo - 路徑資訊
   */
  async startWatchingPath(networkPath, pathInfo) {
    try {
      logger.info(`[SMB_WATCH] 開始監控: ${networkPath}`);

      // 使用輪詢方式監控
      const pollingInterval = config.monitoring.pollingInterval || 5000;

      const intervalId = setInterval(async () => {
        try {
          await this.scanNetworkPath(networkPath);
        } catch (error) {
          logger.debug(`掃描網路路徑時發生錯誤: ${error.message}`);
          // 嘗試重新連接
          await this.handleConnectionError(networkPath, error);
        }
      }, pollingInterval);

      this.pollIntervals.set(networkPath, intervalId);

      // 執行初始掃描
      await this.scanNetworkPath(networkPath);
    } catch (error) {
      logger.logError(`監控網路路徑失敗: ${networkPath}`, error);
      throw error;
    }
  }

  /**
   * 掃描網路路徑中的檔案
   * @param {string} networkPath - 網路路徑
   */
  async scanNetworkPath(networkPath) {
    try {
      const smbClient = this.smbClients.get(networkPath);
      const pathInfo = this.monitoredPaths.get(networkPath);

      if (!smbClient || !pathInfo) {
        throw new Error(`找不到 SMB 客戶端或路徑資訊: ${networkPath}`);
      }

      // 檢查 SMB 客戶端是否有效
      if (
        !smbClient.tree ||
        typeof smbClient.tree.readDirectory !== "function"
      ) {
        logger.debug(
          `[SMB_DEBUG] SMB 客戶端或 tree 物件無效，使用傳統方法掃描目錄`
        );
        // 使用傳統的 readdir 方法
        await this.scanDirectoryLegacy(smbClient, "", networkPath);
        return;
      }

      // 遞迴掃描根目錄
      await this.scanDirectoryAsync(smbClient.tree, "", networkPath);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 遞迴掃描目錄 (使用 async/await)
   * @param {Object} tree - SMB 樹狀連線
   * @param {string} dirPath - 目錄路徑（相對於共享根目錄）
   * @param {string} networkPath - 原始網路路徑
   */
  async scanDirectoryAsync(tree, dirPath, networkPath) {
    try {
      const fullPath = dirPath || "/";

      // 確保 tree 物件和 readDirectory 方法存在
      if (!tree || typeof tree.readDirectory !== "function") {
        throw new Error("SMB tree 物件或 readDirectory 方法無效");
      }

      const entries = await tree.readDirectory(fullPath);

      if (!entries || entries.length === 0) {
        return;
      }

      for (const entry of entries) {
        // 檢查 entry 物件是否有效
        if (!entry || typeof entry !== "object") {
          logger.debug(
            `[SCAN_DEBUG] 跳過無效的目錄項目: ${JSON.stringify(entry)}`
          );
          continue;
        }

        // 獲取檔案名稱 (支援不同的屬性名稱)
        const entryName = entry.name || entry.filename || entry.Filename;
        if (!entryName || typeof entryName !== "string") {
          logger.debug(
            `[SCAN_DEBUG] 跳過沒有名稱的目錄項目: ${JSON.stringify(entry)}`
          );
          continue;
        }

        // 跳過 . 和 .. 目錄
        if (entryName === "." || entryName === "..") {
          continue;
        }

        const entryPath = dirPath ? `${dirPath}/${entryName}` : entryName;

        // 跳過系統檔案和隱藏檔案
        if (this.shouldSkipFile(entryName)) {
          continue;
        }

        // 判斷是否為目錄 (支援不同的屬性名稱)
        const isDirectory =
          entry.isDirectory || entry.Directory || entry.directory;

        if (isDirectory) {
          // 遞迴處理子目錄
          await this.scanDirectoryAsync(tree, entryPath, networkPath);
        } else {
          // 處理檔案 - 建立統一的 entry 物件
          const normalizedEntry = {
            name: entryName,
            size: entry.size || entry.EndOfFile || 0,
            lastWriteTime:
              entry.lastWriteTime || entry.LastWriteTime || new Date(),
            isDirectory: false,
          };

          this.handleNetworkFileAsync(
            tree,
            entryPath,
            normalizedEntry,
            networkPath
          );
        }
      }
    } catch (error) {
      logger.debug(`讀取目錄失敗: ${dirPath} - ${error.message}`);
      throw error;
    }
  }

  /**
   * 遞迴掃描目錄 (傳統方法，作為備用)
   * @param {Object} smbClient - SMB 客戶端
   * @param {string} dirPath - 目錄路徑（相對於共享根目錄）
   * @param {string} networkPath - 原始網路路徑
   */
  async scanDirectoryLegacy(smbClient, dirPath, networkPath) {
    return new Promise((resolve, reject) => {
      smbClient.readdir(dirPath, (err, items) => {
        if (err) {
          logger.debug(`讀取目錄失敗: ${dirPath} - ${err.message}`);
          reject(err);
          return;
        }

        if (!items || items.length === 0) {
          resolve();
          return;
        }

        let processedCount = 0;
        const totalItems = items.length;
        let hasError = false;

        const checkComplete = (error) => {
          processedCount++;
          if (error && !hasError) {
            hasError = true;
            reject(error);
            return;
          }
          if (processedCount === totalItems && !hasError) {
            resolve();
          }
        };

        for (const item of items) {
          // 檢查 item 物件是否有效
          if (!item || typeof item !== "object") {
            logger.debug(
              `[SCAN_LEGACY] 跳過無效的目錄項目: ${JSON.stringify(item)}`
            );
            checkComplete();
            continue;
          }

          // 獲取檔案名稱
          const itemName = item.Filename || item.filename || item.name;
          if (!itemName || typeof itemName !== "string") {
            logger.debug(
              `[SCAN_LEGACY] 跳過沒有名稱的目錄項目: ${JSON.stringify(item)}`
            );
            checkComplete();
            continue;
          }

          const fullPath = dirPath ? `${dirPath}\\${itemName}` : itemName;

          // 跳過系統檔案和隱藏檔案
          if (this.shouldSkipFile(itemName)) {
            checkComplete();
            continue;
          }

          if (item.Directory) {
            // 遞迴處理子目錄
            this.scanDirectoryLegacy(smbClient, fullPath, networkPath)
              .then(() => checkComplete())
              .catch(checkComplete);
          } else {
            // 處理檔案
            this.handleNetworkFile(smbClient, fullPath, item, networkPath);
            checkComplete();
          }
        }
      });
    });
  }

  /**
   * 遞迴掃描目錄 (舊版本，保留作為備用)
   * @param {Object} smbClient - SMB 客戶端
   * @param {string} dirPath - 目錄路徑（相對於共享根目錄）
   * @param {string} networkPath - 原始網路路徑
   * @param {Function} callback - 回調函數
   */
  scanDirectory(smbClient, dirPath, networkPath, callback) {
    smbClient.readdir(dirPath, (err, items) => {
      if (err) {
        logger.debug(`讀取目錄失敗: ${dirPath} - ${err.message}`);
        callback(err);
        return;
      }

      if (!items || items.length === 0) {
        callback(null);
        return;
      }

      let processedCount = 0;
      const totalItems = items.length;

      for (const item of items) {
        // 檢查 item 物件是否有效
        if (!item || typeof item !== "object") {
          logger.debug(
            `[SCAN_OLD] 跳過無效的目錄項目: ${JSON.stringify(item)}`
          );
          processedCount++;
          if (processedCount === totalItems) {
            callback(null);
          }
          continue;
        }

        const itemName = item.Filename || item.filename || item.name;
        if (!itemName || typeof itemName !== "string") {
          logger.debug(
            `[SCAN_OLD] 跳過沒有名稱的目錄項目: ${JSON.stringify(item)}`
          );
          processedCount++;
          if (processedCount === totalItems) {
            callback(null);
          }
          continue;
        }

        const fullPath = dirPath ? `${dirPath}\\${itemName}` : itemName;

        // 跳過系統檔案和隱藏檔案
        if (this.shouldSkipFile(itemName)) {
          processedCount++;
          if (processedCount === totalItems) {
            callback(null);
          }
          continue;
        }

        if (item.Directory) {
          // 遞迴處理子目錄
          this.scanDirectory(smbClient, fullPath, networkPath, (subErr) => {
            processedCount++;
            if (processedCount === totalItems) {
              callback(subErr);
            }
          });
        } else {
          // 處理檔案
          this.handleNetworkFile(smbClient, fullPath, item, networkPath);
          processedCount++;
          if (processedCount === totalItems) {
            callback(null);
          }
        }
      }
    });
  }

  /**
   * 檢查是否應該跳過檔案
   * @param {string} filename - 檔案名稱
   * @returns {boolean} 是否跳過
   */
  shouldSkipFile(filename) {
    const skipPatterns = [
      /^\./, // 隱藏檔案
      /^~\$/, // 暫存檔
      /\.tmp$/i, // 暫存檔
      /\.temp$/i, // 暫存檔
      /Thumbs\.db$/i, // Windows 縮圖快取
      /desktop\.ini$/i, // Windows 桌面設定
    ];

    return skipPatterns.some((pattern) => pattern.test(filename));
  }

  /**
   * 處理網路檔案 (新版本)
   * @param {Object} tree - SMB 樹狀連線
   * @param {string} filePath - 檔案路徑
   * @param {Object} fileEntry - 檔案項目資訊
   * @param {string} networkPath - 原始網路路徑
   */
  handleNetworkFileAsync(tree, filePath, fileEntry, networkPath) {
    try {
      // 檢查參數有效性
      if (!fileEntry || typeof fileEntry !== "object") {
        logger.debug(
          `[FILE_ASYNC] 無效的檔案項目: ${JSON.stringify(fileEntry)}`
        );
        return;
      }

      if (!filePath || typeof filePath !== "string") {
        logger.debug(`[FILE_ASYNC] 無效的檔案路徑: ${filePath}`);
        return;
      }

      const fileName = fileEntry.name;
      if (!fileName || typeof fileName !== "string") {
        logger.debug(
          `[FILE_ASYNC] 無效的檔案名稱: ${JSON.stringify(fileEntry)}`
        );
        return;
      }

      // 檢查檔案是否符合處理條件
      if (!this.shouldProcessFile(fileName)) {
        return;
      }

      // 檢查檔案是否有變更
      const cacheKey = `${networkPath}:${filePath}`;
      const lastModified = fileEntry.lastWriteTime || new Date();
      const cachedTime = this.fileCache.get(cacheKey);

      if (cachedTime && cachedTime.getTime() === lastModified.getTime()) {
        // 檔案沒有變更，跳過
        return;
      }

      // 更新快取
      this.fileCache.set(cacheKey, lastModified);

      const fileInfo = {
        fileName: fileName,
        fileExtension: path.extname(fileName),
        fileSize: fileEntry.size || 0,
        fileModifiedTime: lastModified,
        networkPath: networkPath,
        relativePath: filePath,
        tree: tree, // 傳遞樹狀連線以便後續讀取檔案內容
      };

      logger.info(
        `[SMB_FILE] 發現檔案: ${fileInfo.fileName} (${(
          fileInfo.fileSize / 1024
        ).toFixed(2)} KB)`
      );

      // 發送檔案事件
      this.emit("networkFile", {
        eventType: "add",
        filePath: filePath,
        fileInfo: fileInfo,
        networkPath: networkPath,
      });
    } catch (error) {
      logger.debug(`處理網路檔案失敗: ${filePath}`, error);
    }
  }

  /**
   * 處理網路檔案 (舊版本，保留作為備用)
   * @param {Object} smbClient - SMB 客戶端
   * @param {string} filePath - 檔案路徑
   * @param {Object} fileItem - 檔案項目資訊
   * @param {string} networkPath - 原始網路路徑
   */
  handleNetworkFile(smbClient, filePath, fileItem, networkPath) {
    try {
      // 檢查參數有效性
      if (!fileItem || typeof fileItem !== "object") {
        logger.debug(
          `[FILE_LEGACY] 無效的檔案項目: ${JSON.stringify(fileItem)}`
        );
        return;
      }

      if (!filePath || typeof filePath !== "string") {
        logger.debug(`[FILE_LEGACY] 無效的檔案路徑: ${filePath}`);
        return;
      }

      const fileName = fileItem.Filename || fileItem.filename || fileItem.name;
      if (!fileName || typeof fileName !== "string") {
        logger.debug(
          `[FILE_LEGACY] 無效的檔案名稱: ${JSON.stringify(fileItem)}`
        );
        return;
      }

      // 檢查檔案是否符合處理條件
      if (!this.shouldProcessFile(fileName)) {
        return;
      }

      // 檢查檔案是否有變更
      const cacheKey = `${networkPath}:${filePath}`;
      const lastModified = fileItem.LastWriteTime;
      const cachedTime = this.fileCache.get(cacheKey);

      if (cachedTime && cachedTime.getTime() === lastModified.getTime()) {
        // 檔案沒有變更，跳過
        return;
      }

      // 更新快取
      this.fileCache.set(cacheKey, lastModified);

      const fileInfo = {
        fileName: fileName,
        fileExtension: path.extname(fileName),
        fileSize: fileItem.EndOfFile,
        fileModifiedTime: lastModified,
        networkPath: networkPath,
        relativePath: filePath,
        smbClient: smbClient, // 傳遞客戶端以便後續讀取檔案內容
      };

      logger.info(
        `[SMB_FILE] 發現檔案: ${fileInfo.fileName} (${(
          fileInfo.fileSize / 1024
        ).toFixed(2)} KB)`
      );

      // 發送檔案事件
      this.emit("networkFile", {
        eventType: "add",
        filePath: filePath,
        fileInfo: fileInfo,
        networkPath: networkPath,
      });
    } catch (error) {
      logger.debug(`處理網路檔案失敗: ${filePath}`, error);
    }
  }

  /**
   * 檢查檔案是否應該被處理
   * @param {string} filename - 檔案名稱
   * @returns {boolean} 是否應該處理
   */
  shouldProcessFile(filename) {
    // 檢查 filename 是否有效
    if (!filename || typeof filename !== "string") {
      logger.debug(`[FILE_CHECK] 無效的檔案名稱: ${filename}`);
      return false;
    }

    const ext = path.extname(filename).toLowerCase();

    // 檢查副檔名
    if (!config.monitoring.supportedExtensions.includes(ext)) {
      return false;
    }

    // 檢查檔案名稱模式
    for (const pattern of config.monitoring.ignorePatterns) {
      const cleanPattern = pattern.replace(/\*\*/g, "").replace(/\*/g, "");
      if (filename.includes(cleanPattern)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 處理連線錯誤
   * @param {string} networkPath - 網路路徑
   * @param {Error} error - 錯誤物件
   */
  async handleConnectionError(networkPath, error) {
    try {
      logger.warn(`[SMB_ERROR] 連線錯誤，嘗試重新連接: ${networkPath}`);

      // 清除舊的客戶端
      const oldClient = this.smbClients.get(networkPath);
      if (oldClient) {
        try {
          await oldClient.disconnect();
        } catch (e) {
          // 忽略斷線錯誤
        }
      }

      // 嘗試重新連接
      const pathInfo = this.monitoredPaths.get(networkPath);
      if (pathInfo) {
        const newClient = await this.createSMBConnection(pathInfo);
        this.smbClients.set(networkPath, newClient);
        logger.info(`[SMB_RECONNECT] 重新連接成功: ${networkPath}`);
      }
    } catch (reconnectError) {
      logger.error(`[SMB_RECONNECT] 重新連接失敗: ${reconnectError.message}`);
    }
  }

  /**
   * 讀取網路檔案內容
   * @param {Object} fileInfo - 檔案資訊
   * @returns {Promise<Buffer>} 檔案內容
   */
  async readNetworkFile(fileInfo) {
    try {
      const tree = fileInfo.tree;
      const filePath = fileInfo.relativePath;

      const data = await tree.readFile(filePath);
      return data;
    } catch (error) {
      throw new Error(`讀取網路檔案失敗: ${error.message}`);
    }
  }

  /**
   * 停止監控
   */
  async stop() {
    try {
      logger.info("停止網路儲存監控...");
      this.isActive = false;

      // 停止所有輪詢
      for (const [networkPath, intervalId] of this.pollIntervals) {
        clearInterval(intervalId);
        logger.info(`[SMB_STOP] 停止監控: ${networkPath}`);
      }

      // 關閉所有 SMB 連線
      for (const [networkPath, smbClient] of this.smbClients) {
        try {
          if (smbClient.session) {
            await smbClient.session.disconnect();
          }
          if (smbClient.client) {
            await smbClient.client.disconnect();
          }
          logger.info(`[SMB_DISCONNECT] 關閉連線: ${networkPath}`);
        } catch (error) {
          logger.debug(`關閉 SMB 連線時發生錯誤: ${error.message}`);
        }
      }

      this.pollIntervals.clear();
      this.smbClients.clear();
      this.monitoredPaths.clear();
      this.fileCache.clear();

      logger.info("網路儲存監控已停止");
    } catch (error) {
      logger.logError("停止網路儲存監控失敗", error);
    }
  }

  /**
   * 獲取監控狀態
   * @returns {Object} 監控狀態
   */
  getStatus() {
    return {
      isActive: this.isActive,
      platform: this.platform,
      monitoredPaths: Array.from(this.monitoredPaths.keys()),
      activeConnections: this.smbClients.size,
      cachedFiles: this.fileCache.size,
      pollingIntervals: this.pollIntervals.size,
    };
  }
}

module.exports = NetworkStorageMonitor;
