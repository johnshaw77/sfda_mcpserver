const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs-extra");
const config = require("../../config");
const logger = require("../utils/logger");
const EventEmitter = require("events");

class FileWatcher extends EventEmitter {
  constructor() {
    super();
    this.watchers = new Map(); // 儲存每個資料夾的監控器
    this.isActive = false;
    this.watchedFiles = new Set(); // 追蹤已監控的檔案
  }

  /**
   * 開始監控指定的資料夾
   * @param {Array<string>} folders - 要監控的資料夾陣列
   */
  async startWatching(folders = config.monitoring.watchFolders) {
    try {
      if (this.isActive) {
        logger.warn("檔案監控器已在執行中");
        return;
      }

      logger.info("開始檔案監控...");
      this.isActive = true;

      for (const folder of folders) {
        await this.watchFolder(folder);
      }

      logger.info(`檔案監控啟動完成，監控 ${folders.length} 個資料夾`);
    } catch (error) {
      logger.logError("檔案監控啟動失敗", error);
      throw error;
    }
  }

  /**
   * 監控單一資料夾
   * @param {string} folderPath - 資料夾路徑
   */
  async watchFolder(folderPath) {
    try {
      // 檢查資料夾是否存在
      if (!(await fs.pathExists(folderPath))) {
        logger.warn(`監控資料夾不存在: ${folderPath}`);
        return;
      }

      const absolutePath = path.resolve(folderPath);

      // 如果已經在監控此資料夾，先停止
      if (this.watchers.has(absolutePath)) {
        await this.stopWatchingFolder(absolutePath);
      }

      // 建立監控器設定
      const watchOptions = {
        ignored: config.monitoring.ignorePatterns,
        persistent: true,
        ignoreInitial: false, // 初始化時也要處理現有檔案
        followSymlinks: false,
        depth: undefined, // 無限制深度
        awaitWriteFinish: {
          // 等待檔案寫入完成
          stabilityThreshold: 2000,
          pollInterval: 100,
        },
      };

      // 建立監控器
      const watcher = chokidar.watch(absolutePath, watchOptions);

      // 設定事件監聽器
      this.setupWatcherEvents(watcher, absolutePath);

      // 儲存監控器
      this.watchers.set(absolutePath, watcher);

      logger.logProcessing("WATCH_START", `開始監控資料夾: ${absolutePath}`);
    } catch (error) {
      logger.logError(`監控資料夾失敗: ${folderPath}`, error);
      throw error;
    }
  }

  /**
   * 設定監控器事件
   * @param {FSWatcher} watcher - chokidar 監控器
   * @param {string} folderPath - 資料夾路徑
   */
  setupWatcherEvents(watcher, folderPath) {
    // 檔案新增
    watcher.on("add", (filePath) => {
      this.handleFileEvent("add", filePath);
    });

    // 檔案修改
    watcher.on("change", (filePath) => {
      this.handleFileEvent("change", filePath);
    });

    // 檔案刪除
    watcher.on("unlink", (filePath) => {
      this.handleFileEvent("delete", filePath);
    });

    // 資料夾新增
    watcher.on("addDir", (dirPath) => {
      logger.logProcessing("DIRECTORY_ADD", `新增資料夾: ${dirPath}`);
    });

    // 資料夾刪除
    watcher.on("unlinkDir", (dirPath) => {
      logger.logProcessing("DIRECTORY_DELETE", `刪除資料夾: ${dirPath}`);
    });

    // 監控器就緒
    watcher.on("ready", () => {
      logger.logProcessing("WATCH_READY", `監控器就緒: ${folderPath}`);
    });

    // 監控器錯誤
    watcher.on("error", (error) => {
      logger.logError(`監控器錯誤 (${folderPath})`, error);
      this.emit("error", error);
    });
  }

  /**
   * 處理檔案事件
   * @param {string} eventType - 事件類型 (add, change, delete)
   * @param {string} filePath - 檔案路徑
   */
  async handleFileEvent(eventType, filePath) {
    try {
      // 檢查檔案是否符合處理條件
      if (!this.shouldProcessFile(filePath)) {
        return;
      }

      const fileInfo = await this.getFileInfo(filePath, eventType);

      logger.logProcessing("FILE_EVENT", `檔案事件: ${eventType}`, {
        filePath: filePath,
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
      });

      // 發送事件給處理器
      this.emit("fileEvent", {
        eventType: eventType,
        filePath: filePath,
        fileInfo: fileInfo,
        timestamp: new Date(),
      });

      // 更新追蹤集合
      if (eventType === "delete") {
        this.watchedFiles.delete(filePath);
      } else {
        this.watchedFiles.add(filePath);
      }
    } catch (error) {
      logger.logError(`處理檔案事件失敗: ${filePath}`, error);
    }
  }

  /**
   * 檢查檔案是否應該被處理
   * @param {string} filePath - 檔案路徑
   * @returns {boolean} 是否應該處理
   */
  shouldProcessFile(filePath) {
    // 檢查檔案副檔名
    const ext = path.extname(filePath).toLowerCase();
    if (!config.monitoring.supportedExtensions.includes(ext)) {
      return false;
    }

    // 檢查檔案大小（如果檔案存在）
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > config.monitoring.maxFileSize) {
        logger.warn(`檔案過大，跳過處理: ${filePath} (${stats.size} bytes)`);
        return false;
      }
    } catch (error) {
      // 檔案可能已被刪除，這是正常情況
      if (error.code !== "ENOENT") {
        logger.logError(`檢查檔案失敗: ${filePath}`, error);
      }
    }

    return true;
  }

  /**
   * 取得檔案資訊
   * @param {string} filePath - 檔案路徑
   * @param {string} eventType - 事件類型
   * @returns {Object} 檔案資訊
   */
  async getFileInfo(filePath, eventType) {
    const fileInfo = {
      fileName: path.basename(filePath),
      fileExtension: path.extname(filePath).toLowerCase(),
      filePath: path.resolve(filePath),
      eventType: eventType,
    };

    if (eventType !== "delete") {
      try {
        const stats = await fs.stat(filePath);
        fileInfo.fileSize = stats.size;
        fileInfo.fileModifiedTime = stats.mtime;
        fileInfo.isDirectory = stats.isDirectory();
      } catch (error) {
        logger.logError(`取得檔案資訊失敗: ${filePath}`, error);
        fileInfo.fileSize = 0;
        fileInfo.fileModifiedTime = new Date();
        fileInfo.isDirectory = false;
      }
    }

    return fileInfo;
  }

  /**
   * 停止監控指定資料夾
   * @param {string} folderPath - 資料夾路徑
   */
  async stopWatchingFolder(folderPath) {
    const absolutePath = path.resolve(folderPath);
    const watcher = this.watchers.get(absolutePath);

    if (watcher) {
      await watcher.close();
      this.watchers.delete(absolutePath);
      logger.logProcessing("WATCH_STOP", `停止監控資料夾: ${absolutePath}`);
    }
  }

  /**
   * 停止所有監控
   */
  async stopWatching() {
    try {
      logger.info("停止檔案監控...");

      for (const [folderPath, watcher] of this.watchers) {
        await watcher.close();
        logger.logProcessing("WATCH_STOP", `停止監控: ${folderPath}`);
      }

      this.watchers.clear();
      this.watchedFiles.clear();
      this.isActive = false;

      logger.info("檔案監控已停止");
    } catch (error) {
      logger.logError("停止檔案監控失敗", error);
      throw error;
    }
  }

  /**
   * 取得監控狀態
   * @returns {Object} 監控狀態資訊
   */
  getStatus() {
    return {
      isActive: this.isActive,
      watchedFolders: Array.from(this.watchers.keys()),
      watchedFilesCount: this.watchedFiles.size,
      watchersCount: this.watchers.size,
    };
  }

  /**
   * 手動掃描資料夾中的現有檔案
   * @param {string} folderPath - 資料夾路徑
   */
  async scanExistingFiles(folderPath) {
    try {
      logger.logProcessing("SCAN_START", `開始掃描現有檔案: ${folderPath}`);

      const files = await this.getAllFiles(folderPath);

      for (const filePath of files) {
        if (this.shouldProcessFile(filePath)) {
          await this.handleFileEvent("add", filePath);
        }
      }

      logger.logProcessing(
        "SCAN_COMPLETE",
        `掃描完成，處理 ${files.length} 個檔案`
      );
    } catch (error) {
      logger.logError(`掃描現有檔案失敗: ${folderPath}`, error);
    }
  }

  /**
   * 遞迴取得資料夾中的所有檔案
   * @param {string} dirPath - 資料夾路徑
   * @returns {Array<string>} 檔案路徑陣列
   */
  async getAllFiles(dirPath) {
    const files = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // 遞迴處理子資料夾
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        logger.logError(`讀取資料夾失敗: ${dirPath}`, error);
      }
    }

    return files;
  }
}

module.exports = FileWatcher;
