/**
 * HR 工具：員工數量查詢
 *
 * 獲取系統中員工總數，可根據員工狀態（在職/離職）進行篩選
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import employeeService from "../../services/hr/employee-service.js";
import logger from "../../config/logger.js";

/**
 * 員工數量查詢工具
 */
export class GetEmployeeCountTool extends BaseTool {
  constructor() {
    super(
      "get_employee_count",
      "獲取系統中員工總數，可根據員工狀態（在職/離職）進行篩選",
      {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["active", "inactive", "all"],
            default: "all",
            description:
              "員工狀態：active(在職)、inactive(離職/停用)、all(全部)，對應資料庫中的 is_suspended 欄位",
          },
        },
        required: [],
      },
    );
  }

  /**
   * 執行員工數量查詢
   */
  async _execute(params, options) {
    const { status = "all" } = params;

    try {
      logger.info("Counting employees", {
        toolName: this.name,
        status,
      });

      // 從資料庫獲取員工數量
      const countResult = await employeeService.getEmployeeCount(status);

      // 建構返回結果
      const result = {
        queryTime: new Date().toISOString(),
        status,
        ...countResult,
      };

      // 添加額外的有用信息
      if (status === "all") {
        result.percentages = {
          active:
            countResult.total > 0
              ? Math.round((countResult.activeCount / countResult.total) * 100)
              : 0,
          inactive:
            countResult.total > 0
              ? Math.round(
                  (countResult.inactiveCount / countResult.total) * 100,
                )
              : 0,
          male:
            countResult.total > 0
              ? Math.round((countResult.maleCount / countResult.total) * 100)
              : 0,
          female:
            countResult.total > 0
              ? Math.round((countResult.femaleCount / countResult.total) * 100)
              : 0,
        };
      }

      logger.info(
        `Employee count retrieved successfully: ${JSON.stringify(result)}`,
        {
          toolName: this.name,
          status,
          countResult,
        },
      );

      return result;
    } catch (error) {
      logger.error(`Error counting employees: ${error.message}`, {
        toolName: this.name,
        status,
        error: error.stack,
      });

      throw new ToolExecutionError(
        `查詢員工數量失敗：${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        {
          status,
          message: "資料庫查詢錯誤",
          suggestedAction: "請稍後再試或聯絡系統管理員",
        },
      );
    }
  }
}
