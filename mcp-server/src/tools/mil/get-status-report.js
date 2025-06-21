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
      `生成 MIL 狀態分布統計報告，提供整體狀態概覽

返回統計欄位說明：
• Status: 處理狀態名稱
  - OnGoing: 進行中的 MIL
  - Completed: 已完成的 MIL  
  - Cancelled: 已取消的 MIL
  - 其他自定義狀態
• Count: 該狀態的 MIL 數量
• AvgDays: 該狀態 MIL 的平均處理天數 (從記錄日期到當前日期)

用途：
- 快速了解整體 MIL 處理狀況
- 分析各狀態的分布比例
- 評估平均處理時間`,
      {
        type: "object",
        properties: {},
        required: [],
      },
      {
        cacheable: true,
        cacheExpiry: 60 * 60, // 1 小時
        module: "mil",
        requiredDatabases: ["mil"],
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
        reportCount: result.data.length,
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
