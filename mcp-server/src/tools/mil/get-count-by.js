/**
 * MIL 依欄位統計工具
 * 依指定欄位（如狀態、類型、廠別等）統計 MIL 記錄數量，用於數據分析和報表生成
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import milService from "../../services/mil/mil-service.js";
import logger from "../../config/logger.js";

// 允許統計的欄位列表（防止 SQL 注入）
const ALLOWED_COLUMNS = [
  "MidTypeName",
  "naqi_num",
  "is_APPLY",
  "Importance",
  "Status",
  "ProposalFactory",
  "Proposer_EmpNo",
  "Proposer_Name",
  "Proposer_Dept",
  "Proposer_Superior_Dept",
  "DRI_EmpNo",
  "DRI_EmpName",
  "DRI_Dept",
  "DRI_Superior_Dept",
  "Location",
];

export class GetCountByTool extends BaseTool {
  constructor() {
    super(
      "get-count-by",
      "依指定欄位（如狀態、類型、廠別等）統計 MIL 記錄數量，用於數據分析和報表生成",
      {
        type: "object",
        properties: {
          columnName: {
            type: "string",
            description: "要統計的欄位名稱",
            enum: ALLOWED_COLUMNS,
            examples: ["Status", "TypeName", "ProposalFactory"],
          },
        },
        required: ["columnName"],
      },
      {
        cacheable: true,
        cacheExpiry: 60 * 5, // 5 分鐘
      },
    );
  }

  // NOTE: 要注意是 _execute 不是 execute
  async _execute(params) {
    try {
      const { columnName } = params;

      // 驗證欄位名稱（防止 SQL 注入）
      if (!ALLOWED_COLUMNS.includes(columnName)) {
        throw new ToolExecutionError(
          `不允許的欄位名稱: ${columnName}。允許的欄位: ${ALLOWED_COLUMNS.join(", ")}`,
          ToolErrorType.VALIDATION_ERROR,
          { columnName, allowedColumns: ALLOWED_COLUMNS },
        );
      }

      const result = await milService.getCountBy(columnName);

      // 記錄執行資訊
      logger.info("MIL 依欄位統計查詢成功", {
        toolName: this.name,
        columnName,
        recordCount: result.data.length,
      });

      // 增強回傳資料，但保持與其他工具一致的結構
      const enhancedResult = {
        ...result,
        columnName,
        totalRecords: result.data.length,
        summary: `依 ${columnName} 統計共有 ${result.data.length} 個不同值`,
      };

      return {
        success: true,
        data: enhancedResult,
      };
    } catch (error) {
      // 記錄錯誤
      logger.error("MIL 依欄位統計查詢失敗", {
        toolName: this.name,
        error: error.message,
        params,
      });

      // 如果是 ToolExecutionError 就直接拋出
      if (error instanceof ToolExecutionError) {
        throw error;
      }

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `MIL 依欄位統計查詢失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }
}
