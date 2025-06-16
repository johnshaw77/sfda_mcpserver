/**
 * 員工名單查詢工具
 *
 * 提供部門、職位、狀態等條件的員工名單查詢功能
 */

import { BaseTool } from "../base-tool.js";
import { defaultApiClient as apiClient } from "../../services/api-client.js";
import employeeService from "../../services/hr/employee-service.js";
import logger from "../../config/logger.js";

export class GetEmployeeListTool extends BaseTool {
  constructor() {
    super("get_employee_list", "查詢員工名單，從 org_employee 資料表獲取", {
      type: "object",
      properties: {
        department: {
          type: "string",
          description:
            "部門代碼或名稱（可選），對應資料庫中的 group_code 或 group_name 欄位",
        },
        titleName: {
          type: "string",
          description: "職位名稱（可選），對應資料庫中的 title_name 欄位",
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
          maximum: 100,
          default: 20,
          description: "每頁筆數（1-100），用於分頁查詢",
        },
        includeDetails: {
          type: "boolean",
          default: false,
          description: "是否包含詳細資訊（如電子郵件、別名等）",
        },
      },
      required: [],
    });
  }

  async _execute(params) {
    const {
      department,
      titleName,
      status = "active",
      page = 1,
      limit = 20,
      includeDetails = false,
    } = params;

    logger.info("Querying employee list", {
      toolName: this.name,
      department,
      titleName,
      status,
      page,
      limit,
      includeDetails,
    });

    try {
      // 從資料庫服務獲取員工列表
      const filters = {
        department,
        jobTitle: titleName, // 轉換參數名稱以符合服務層
        status,
      };

      const result = await employeeService.getEmployeeList(
        filters,
        page,
        limit,
        includeDetails,
      );

      logger.info("Employee list retrieved successfully", {
        toolName: this.name,
        totalCount: result.pagination.total,
        pageCount: result.employees.length,
        page,
        limit,
      });

      return {
        success: true,
        result: {
          data: result.employees,
          pagination: result.pagination,
          query: {
            department,
            titleName,
            status,
            page,
            limit,
            includeDetails,
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error("Failed to retrieve employee list", {
        toolName: this.name,
        error: error.message,
        department,
        titleName,
        status,
      });

      throw new Error(`查詢員工名單失敗: ${error.message}`);
    }
  }
}
