/**
 * HR 工具：員工查詢
 *
 * 提供多條件查詢員工資訊的功能，從 org_employee 資料表獲取資料
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import employeeService from "../../services/hr/employee-service.js";
import logger from "../../config/logger.js";

/**
 * 員工查詢工具
 */
export class EmployeeQueryTool extends BaseTool {
  constructor() {
    super(
      "hr_employee_query",
      "查詢員工資訊，支援多種查詢條件，從 org_employee 資料表獲取資料",
      {
        type: "object",
        properties: {
          employeeNo: {
            type: "string",
            description: "員工編號（選填），對應資料庫中的 employee_no 欄位",
            example: "A116592",
          },
          name: {
            type: "string",
            description: "員工姓名（選填），對應資料庫中的 name 欄位，支援模糊查詢",
            example: "張三",
          },
          department: {
            type: "string",
            description: "部門名稱或代碼（選填），對應資料庫中的 group_name 或 group_code 欄位",
            example: "研發部",
          },
          titleName: {
            type: "string", 
            description: "職位名稱（選填），對應資料庫中的 title_name 欄位",
            example: "工程師",
          },
          status: {
            type: "string",
            enum: ["active", "inactive", "all"],
            default: "active",
            description: "員工狀態（選填）：active(在職)、inactive(離職/停用)、all(全部)，對應資料庫中的 is_suspended 欄位",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 10,
            description: "最多返回幾筆結果（選填，範圍1-50）",
          },
          includeDetails: {
            type: "boolean",
            default: false,
            description: "是否包含詳細資訊（選填，預設為false）",
          },
        },
        required: [],
      },
      {
        cacheable: false, // 停用快取，避免個人資料被誤用
      },
    );
  }

  /**
   * 執行員工查詢
   */
  async _execute(params, options) {
    // 解構參數
    const {
      employeeNo,
      name,
      department,
      titleName,
      status = "active",
      limit = 10,
      includeDetails = false,
    } = params;

    try {
      logger.info("Querying employee information", {
        toolName: this.name,
        employeeNo,
        name,
        department,
        titleName,
        status,
        limit,
        includeDetails,
      });

      // 驗證至少提供一個查詢條件
      if (!employeeNo && !name && !department && !titleName) {
        throw new ToolExecutionError(
          "查詢條件不足，請至少提供一個查詢條件（員工編號、姓名、部門或職位）",
          ToolErrorType.VALIDATION_ERROR,
          {
            message: "查詢條件不足",
            suggestedAction: "請提供至少一個查詢條件",
          },
        );
      }

      // 如果提供了精確的員工編號，則直接查詢單一員工詳細資訊
      if (employeeNo) {
        const employee = await employeeService.getEmployeeById(
          employeeNo,
          includeDetails,
          includeDetails ? ["basic", "contact", "department", "position"] : ["basic"]
        );

        // 如果找不到員工
        if (!employee) {
          throw new ToolExecutionError(
            `找不到員工資料：員工編號 ${employeeNo} 不存在`,
            ToolErrorType.NOT_FOUND,
            {
              employeeNo,
              message: "員工不存在",
            }
          );
        }

        // 單一員工查詢結果
        return {
          success: true,
          count: 1,
          data: [employee],
          query: {
            employeeNo,
            includeDetails,
          },
          timestamp: new Date().toISOString(),
        };
      }

      // 使用姓名、部門或職位進行查詢
      const filters = {
        name,
        department,
        titleName,
        status,
      };

      // 呼叫 employeeService 查詢
      const result = await employeeService.findEmployees(filters, limit, includeDetails);

      // 沒有找到任何員工
      if (!result.employees || result.employees.length === 0) {
        throw new ToolExecutionError(
          "找不到符合條件的員工資料",
          ToolErrorType.NOT_FOUND,
          {
            name,
            department,
            titleName,
            status,
            message: "查無資料",
            suggestedAction: "請嘗試使用其他查詢條件",
          }
        );
      }

      // 返回結果
      return {
        success: true,
        count: result.employees.length,
        data: result.employees,
        query: {
          name,
          department,
          titleName,
          status,
          limit,
          includeDetails,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }

      // 包裝其他錯誤
      throw new ToolExecutionError(
        `查詢員工資訊失敗: ${error.message}`,
        ToolErrorType.API_ERROR,
        { 
          employeeNo, 
          name, 
          department, 
          titleName,
          originalError: error.message 
        },
      );
    }
  }
}
