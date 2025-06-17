/**
 * MIL 工具：MIL 詳情查詢
 *
 * 根據 MIL 編號查詢詳細資訊，從 v_mil_kd 視圖獲取資料
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import milService from "../../services/mil/mil-service.js";
import logger from "../../config/logger.js";

/**
 * MIL 詳情查詢工具
 */
export class GetMILDetailsTool extends BaseTool {
  constructor() {
    super(
      "get-mil-details",
      "根據 MIL 編號查詢詳細資訊，從 v_mil_kd 視圖獲取資料",
      {
        type: "object",
        properties: {
          serialNumber: {
            type: "string",
            description: "MIL 編號（必填）",
            example: "MIL-202506-001",
          },
        },
        required: ["serialNumber"],
      },
      {
        cacheable: true,
        cacheExpiry: 60 * 5, // 5 分鐘
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
      const result = await milService.getMILDetails(params.serialNumber);

      // 記錄執行資訊
      logger.info("MIL 詳情查詢成功", {
        toolName: this.name,
        serialNumber: params.serialNumber,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 檢查是否為找不到資料的錯誤
      if (error.message.includes("找不到 MIL 編號")) {
        throw new ToolExecutionError(
          `找不到 MIL 編號: ${params.serialNumber}`,
          ToolErrorType.NOT_FOUND,
          { serialNumber: params.serialNumber },
        );
      }

      // 記錄錯誤
      logger.error("MIL 詳情查詢失敗", {
        toolName: this.name,
        serialNumber: params.serialNumber,
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `MIL 詳情查詢失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }
}
