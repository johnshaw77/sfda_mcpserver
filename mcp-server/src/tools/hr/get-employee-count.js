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
      `統計系統中員工數量，提供多維度統計分析

返回統計欄位說明：
【總數統計】
• total: 總員工數量 (根據 status 參數決定範圍)
• activeCount: 在職員工數量 (is_suspended = 0)
• inactiveCount: 離職/停用員工數量 (is_suspended = 1)

【性別統計】
• maleCount: 男性員工數量 (sex = 'M')
• femaleCount: 女性員工數量 (sex = 'F')

【百分比分析】 (當 status='all' 時提供)
• percentages.active: 在職員工佔總數百分比
• percentages.inactive: 離職員工佔總數百分比
• percentages.male: 男性員工佔總數百分比
• percentages.female: 女性員工佔總數百分比

【查詢資訊】
• queryTime: 查詢執行時間
• status: 查詢的員工狀態範圍

用途：
- 了解公司整體人力規模
- 分析在職與離職員工比例
- 性別比例統計分析
- 人力資源規劃參考`,
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
      {
        module: "hr",
        requiredDatabases: ["qms"],
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
