/**
 * HR 工具：員工搜尋
 *
 * 根據各種條件搜尋員工，從 org_employee 資料表獲取資料
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import employeeService from "../../services/hr/employee-service.js";
import logger from "../../config/logger.js";

/**
 * 員工搜尋工具
 */
export class SearchEmployeesTool extends BaseTool {
  constructor() {
    super(
      "search_employees",
      "根據各種條件搜尋員工，從 org_employee 資料表獲取資料",
      {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "員工姓名（可選），對應資料庫中的 name 欄位，支援模糊查詢",
            example: "張",
          },
          department: {
            type: "string",
            description:
              "部門名稱或代碼（可選），對應資料庫中的 group_name 或 group_code 欄位",
            example: "研發部",
          },
          titleName: {
            type: "string",
            description: "職位名稱（可選），對應資料庫中的 title_name 欄位",
            example: "工程師",
          },
          status: {
            type: "string",
            enum: ["active", "inactive", "all"],
            default: "active",
            description:
              "員工狀態：active(在職)、inactive(離職/停用)、all(全部)，對應資料庫中的 is_suspended 欄位",
          },
          page: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "頁碼（從1開始），用於分頁查詢",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 20,
            description: "每頁筆數（1-50），用於分頁查詢",
          },
          includeDetails: {
            type: "boolean",
            default: false,
            description: "是否包含詳細資訊（如電子郵件、別名等）",
          },
        },
        required: [],
      },
    );
  }

  /**
   * 執行員工搜尋
   */
  async _execute(params, options) {
    const {
      name,
      department,
      titleName,
      status = "active",
      page = 1,
      limit = 20,
      includeDetails = false,
    } = params;

    try {
      logger.info("Searching employees", {
        toolName: this.name,
        name,
        department,
        titleName,
        status,
        page,
        limit,
        includeDetails,
      });

      // 檢查是否提供了至少一個搜尋條件
      if (!name && !department && !titleName && status === "all") {
        logger.warn("No search criteria provided", {
          toolName: this.name,
        });

        throw new ToolExecutionError(
          "請提供至少一個搜尋條件（姓名、部門、職位或狀態）",
          ToolErrorType.VALIDATION_ERROR,
          {
            message: "搜尋條件不足",
            suggestedAction: "請提供至少一個搜尋條件",
          },
        );
      }

      // 準備查詢條件
      const filters = {
        name,
        department,
        titleName,
        status,
      };

      // 呼叫服務層執行查詢
      const result = await employeeService.getEmployeeList(
        filters,
        page,
        limit,
        includeDetails,
      );

      logger.info("Employee search completed", {
        toolName: this.name,
        totalCount: result.pagination.total,
        returnedCount: result.employees.length,
      });

      // 建構返回結果
      return {
        queryTime: new Date().toISOString(),
        criteria: {
          name,
          department,
          titleName,
          status,
        },
        data: result.employees,
        pagination: result.pagination,
      };
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }

      // 包裝其他錯誤
      throw new ToolExecutionError(
        `搜尋員工失敗: ${error.message}`,
        ToolErrorType.API_ERROR,
        {
          name,
          department,
          titleName,
          status,
          originalError: error.message,
        },
      );
    }
  }

  /**
   * 驗證分頁參數
   */
  validateInput(params) {
    // 呼叫父類別的基本驗證
    super.validateInput(params);

    const { page, limit } = params;

    // 驗證分頁參數
    if (page && page < 1) {
      throw new ToolExecutionError(
        "頁碼必須大於等於1",
        ToolErrorType.VALIDATION_ERROR,
        {
          page,
          message: "請提供有效的頁碼",
        },
      );
    }

    if (limit && (limit < 1 || limit > 50)) {
      throw new ToolExecutionError(
        "每頁筆數必須在1到50之間",
        ToolErrorType.VALIDATION_ERROR,
        {
          limit,
          message: "請提供有效的每頁筆數",
        },
      );
    }

    return true;
  }
}
