const fs = require("fs-extra");
const crypto = require("crypto");
const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const xlsx = require("xlsx");
const logger = require("../utils/logger");

class DocumentProcessor {
  constructor() {
    this.supportedExtensions = {
      ".txt": this.processTxtFile.bind(this),
      ".md": this.processTxtFile.bind(this),
      ".pdf": this.processPdfFile.bind(this),
      ".docx": this.processDocxFile.bind(this),
      ".xlsx": this.processXlsxFile.bind(this),
      ".xls": this.processXlsxFile.bind(this),
    };
  }

  /**
   * 處理檔案
   * @param {string} filePath - 檔案路徑
   * @param {Object} fileInfo - 檔案資訊
   * @returns {Object} 處理後的文件資料
   */
  async processFile(filePath, fileInfo) {
    try {
      logger.logProcessing("DOC_PROCESS", `開始處理檔案: ${fileInfo.fileName}`);

      // 1. 驗證檔案
      await this.validateFile(filePath, fileInfo);

      // 2. 計算檔案雜湊
      const fileHash = await this.calculateFileHash(filePath);

      // 3. 提取檔案內容
      const content = await this.extractContent(
        filePath,
        fileInfo.fileExtension
      );

      // 4. 建立文件資料
      const documentData = {
        filePath: path.resolve(filePath),
        fileName: fileInfo.fileName,
        fileExtension: fileInfo.fileExtension,
        fileSize: fileInfo.fileSize,
        fileHash: fileHash,
        fileModifiedTime: fileInfo.fileModifiedTime,
        content: content,
        contentPreview: this.createContentPreview(content),
        wordCount: this.countWords(content),
        processedAt: new Date(),
      };

      logger.logProcessing(
        "DOC_COMPLETE",
        `檔案處理完成: ${fileInfo.fileName}`,
        {
          contentLength: content.length,
          wordCount: documentData.wordCount,
        }
      );

      return documentData;
    } catch (error) {
      logger.logError(`檔案處理失敗: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 驗證檔案
   * @param {string} filePath - 檔案路徑
   * @param {Object} fileInfo - 檔案資訊
   */
  async validateFile(filePath, fileInfo) {
    // 檢查檔案是否存在
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`檔案不存在: ${filePath}`);
    }

    // 檢查檔案格式是否支援
    if (!this.supportedExtensions[fileInfo.fileExtension]) {
      throw new Error(`不支援的檔案格式: ${fileInfo.fileExtension}`);
    }

    // 檢查檔案大小
    const stats = await fs.stat(filePath);
    if (stats.size === 0) {
      throw new Error(`檔案為空: ${filePath}`);
    }
  }

  /**
   * 計算檔案雜湊值
   * @param {string} filePath - 檔案路徑
   * @returns {string} SHA-256 雜湊值
   */
  async calculateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash("sha256").update(fileBuffer).digest("hex");
    } catch (error) {
      logger.logError(`計算檔案雜湊失敗: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 提取檔案內容
   * @param {string} filePath - 檔案路徑
   * @param {string} fileExtension - 檔案副檔名
   * @returns {string} 檔案內容
   */
  async extractContent(filePath, fileExtension) {
    try {
      const processor = this.supportedExtensions[fileExtension];
      if (!processor) {
        throw new Error(`不支援的檔案格式: ${fileExtension}`);
      }

      const content = await processor(filePath);
      return this.cleanContent(content);
    } catch (error) {
      logger.logError(`內容提取失敗: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 處理文字檔案 (.txt, .md)
   * @param {string} filePath - 檔案路徑
   * @returns {string} 檔案內容
   */
  async processTxtFile(filePath) {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      throw new Error(`讀取文字檔案失敗: ${error.message}`);
    }
  }

  /**
   * 處理 PDF 檔案
   * @param {string} filePath - 檔案路徑
   * @returns {string} 檔案內容
   */
  async processPdfFile(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text;
    } catch (error) {
      throw new Error(`讀取 PDF 檔案失敗: ${error.message}`);
    }
  }

  /**
   * 處理 Word 檔案 (.docx)
   * @param {string} filePath - 檔案路徑
   * @returns {string} 檔案內容
   */
  async processDocxFile(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } catch (error) {
      throw new Error(`讀取 Word 檔案失敗: ${error.message}`);
    }
  }

  /**
   * 處理 Excel 檔案 (.xlsx, .xls)
   * @param {string} filePath - 檔案路徑
   * @returns {string} 檔案內容
   */
  async processXlsxFile(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      let content = "";

      // 處理所有工作表
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = xlsx.utils.sheet_to_csv(worksheet);
        content += `=== 工作表: ${sheetName} ===\n${sheetData}\n\n`;
      }

      return content;
    } catch (error) {
      throw new Error(`讀取 Excel 檔案失敗: ${error.message}`);
    }
  }

  /**
   * 清理內容
   * @param {string} content - 原始內容
   * @returns {string} 清理後的內容
   */
  cleanContent(content) {
    if (!content) return "";

    return (
      content
        // 移除多餘的空白字元
        .replace(/\s+/g, " ")
        // 移除多餘的換行
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        // 移除開頭和結尾的空白
        .trim()
    );
  }

  /**
   * 建立內容預覽
   * @param {string} content - 完整內容
   * @param {number} maxLength - 最大長度
   * @returns {string} 內容預覽
   */
  createContentPreview(content, maxLength = 500) {
    if (!content) return "";

    if (content.length <= maxLength) {
      return content;
    }

    return content.substring(0, maxLength) + "...";
  }

  /**
   * 計算字數
   * @param {string} content - 內容
   * @returns {number} 字數
   */
  countWords(content) {
    if (!content) return 0;

    // 中文字符和英文單詞的計算
    const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;

    return chineseChars + englishWords;
  }

  /**
   * 取得支援的檔案格式
   * @returns {Array<string>} 支援的副檔名陣列
   */
  getSupportedExtensions() {
    return Object.keys(this.supportedExtensions);
  }

  /**
   * 檢查檔案格式是否支援
   * @param {string} fileExtension - 檔案副檔名
   * @returns {boolean} 是否支援
   */
  isSupported(fileExtension) {
    return this.supportedExtensions.hasOwnProperty(fileExtension.toLowerCase());
  }
}

module.exports = DocumentProcessor;
