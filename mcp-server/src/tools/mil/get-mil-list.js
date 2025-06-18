/**
 * MIL 工具：MIL 列表查詢
 *
 * 根據條件查詢 MIL 列表，從 v_mil_kd 視圖獲取資料
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import milService from "../../services/mil/mil-service.js";
import logger from "../../config/logger.js";

/**
 * MIL 列表查詢工具
 */
export class GetMILListTool extends BaseTool {
  constructor() {
    super(
      "get-mil-list",
      "根據條件查詢 MIL 列表(分配到清單上的任務或專案)",
      {
        type: "object",
        properties: {
          typeName: {
            type: "string",
            description: "MIL 類別(選填) ",
            example:
              "三現,值班幹部巡檢,兩廠資訊處,品質雷達控管,KH MIL,CEO/COO追蹤待辦事項,稽核追蹤,生產入庫進度雷達管控,KS FPC清潔公司,品質ISSUE管理,OQC/IPQC/LAB Issue,A公司MIL,資訊安全稽核,LPA稽核追蹤,會議管理,SmartFactory,廠內Issue,系統稽核類,內部issue管理,LessonLearnt,FPCA第三方稽核",
          },
          status: {
            type: "string",
            description: "MIL 處理狀態（選填）",
            example: "已結案",
          },
          proposalFactory: {
            type: "string",
            description: "負責人廠別（選填）",
            example: "JK,KH,KS",
          },
          proposerName: {
            type: "string",
            description: "提出人姓名（選填），支援模糊查詢",
            example: "張三",
          },
          serialNumber: {
            type: "string",
            description: "MIL 編號（選填），支援模糊查詢",
            example: "MIL-2025",
          },
          importance: {
            type: "string",
            description: "重要度（選填）",
            example: "高",
          },
          page: {
            type: "integer",
            description: "頁數（選填，預設 1）",
            default: 1,
            minimum: 1,
          },
          limit: {
            type: "integer",
            description: "每頁返回結果數量限制（選填，預設 100）",
            default: 100,
            minimum: 1,
            maximum: 1000,
          },
        },
        required: [],
      },
      {
        cacheable: false, // 暫時關閉緩存
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
      // 參數處理
      const filters = {};
      if (params.status) filters.status = params.status;
      if (params.proposerName) filters.proposerName = params.proposerName;
      if (params.serialNumber) filters.serialNumber = params.serialNumber;
      if (params.importance) filters.importance = params.importance;

      // 分頁參數
      const page = params.page || 1;
      const limit = params.limit || 100;

      // 呼叫服務取得資料
      const result = await milService.getMILList(filters, page, limit);

      // 記錄執行資訊
      logger.info("MIL 列表查詢成功", {
        toolName: this.name,
        filters: JSON.stringify(filters),
        page: page,
        limit: limit,
        count: result.data.length,
        totalRecords: result.totalRecords,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 記錄錯誤
      logger.error("MIL 列表查詢失敗", {
        toolName: this.name,
        params: JSON.stringify(params),
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `MIL 列表查詢失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }
}
