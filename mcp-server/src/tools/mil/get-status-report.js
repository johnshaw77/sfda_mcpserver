/**
 * MIL 工具：狀態報告工具
 *
 * 生成 MIL 狀態分布統計報告
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import milService from "../../services/mil/mil-service.js";
import logger from "../../config/logger.js";

/**
 * MIL 狀態報告工具
 */
export class GetStatusReportTool extends BaseTool {
  constructor() {
    super(
      "get-status-report",
      "生成 MIL 狀態分布統計報告",
      {
        type: "object",
        properties: {},
        required: [],
      },
      {
        cacheable: true,
        cacheExpiry: 60 * 60, // 1 小時
      },
    );
  }

  /**
   * 執行工具
   * @param {Object} params - 工具參數
   */
  async _execute(params) {
    try {
      // 呼叫服務取得資料
      const result = await milService.getStatusReport();

      // 記錄執行資訊
      logger.info("MIL 狀態報告生成成功", {
        toolName: this.name,
        reportCount: result.statusReport.length,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 記錄錯誤
      logger.error("MIL 狀態報告生成失敗", {
        toolName: this.name,
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `MIL 狀態報告生成失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }
}
