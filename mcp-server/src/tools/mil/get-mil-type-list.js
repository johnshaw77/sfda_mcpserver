/**
 * MIL 工具：MIL 類型列表查詢
 *
 * 獲取所有 MIL 類型的唯一列表
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import milService from "../../services/mil/mil-service.js";
import logger from "../../config/logger.js";

/**
 * MIL 類型列表查詢工具
 */
export class GetMILTypeListTool extends BaseTool {
  constructor() {
    super(
      "get-mil-type-list",
      "取得 MIL 類型列表，獲取所有 MIL 類型的唯一列表",
      {
        type: "object",
        properties: {},
        required: [],
      },
      {
        cacheable: true,
        cacheExpiry: 60 * 30, // 30 分鐘快取，類型列表變動較少
      },
    );
  }

  /**
   * 執行工具
   * @param {Object} params - 工具參數（此工具不需要參數）
   */
  async _execute(params) {
    try {
      // 呼叫服務取得資料
      const result = await milService.getMILTypeList();

      // 記錄執行資訊
      logger.info("MIL 類型列表查詢成功", {
        toolName: this.name,
        typeCount: result.types.length,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 記錄錯誤
      logger.error("MIL 類型列表查詢失敗", {
        toolName: this.name,
        params: JSON.stringify(params),
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `MIL 類型列表查詢失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }
}
