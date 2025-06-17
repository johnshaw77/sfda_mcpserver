/**
 * 人資管理工具：查詢員工工號
 *
 * 透過員工姓名或部門資訊查詢員工工號
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import employeeService from "../../services/hr/employee-service.js";
import logger from "../../config/logger.js";

/**
 * 員工工號查詢工具
 */
export class GetEmployeeIdTool extends BaseTool {
  constructor() {
    super(
      "get_employee_id",
      "透過姓名或部門資訊查詢員工工號，從 org_employee 資料表獲取",
      {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "員工姓名（與 department 至少需要提供一項），對應資料庫中的 name 欄位",
            example: "張三",
          },
          department: {
            type: "string",
            description:
              "部門名稱或代碼（與 name 至少需要提供一項），對應資料庫中的 group_name 或 group_code 欄位",
            example: "研發部",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
            default: 5,
            description: "最多返回幾筆結果（1-20）",
          },
          onlyActive: {
            type: "boolean",
            default: true,
            description: "是否只查詢在職員工，對應資料庫中的 is_suspended 欄位",
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
   * 執行員工工號查詢
   */
  async _execute(params, options) {
    // 解構參數
    const { name, department, limit = 5, onlyActive = true } = params;

    try {
      logger.info("Querying employee ID by name or department", {
        toolName: this.name,
        name,
        department,
        limit,
        onlyActive,
      });

      // 建立查詢條件
      const filters = {
        name,
        department,
        status: onlyActive ? "active" : "all",
      };

      // 呼叫 employeeService 查詢
      const result = await employeeService.findEmployeesByNameOrDepartment(
        filters,
        limit,
      );

      // 查詢結果處理
      if (!result.employees || result.employees.length === 0) {
        logger.warn("No employees found with the given criteria", {
          toolName: this.name,
          name,
          department,
        });

        throw new ToolExecutionError(
          "找不到符合條件的員工資料。請嘗試使用更精確的姓名或部門資訊。",
          ToolErrorType.NOT_FOUND,
          {
            name,
            department,
            message: "查無資料",
            suggestedAction: "請嘗試使用更精確的姓名或部門資訊",
          },
        );
      }

      // 格式化並返回結果
      return {
        success: true,
        count: result.employees.length,
        data: result.employees.map(emp => ({
          employeeNo: emp.employeeNo,
          name: emp.name,
          groupName: emp.groupName,
          titleName: emp.titleName,
        })),
      };
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }

      // 包裝其他錯誤
      throw new ToolExecutionError(
        `查詢員工工號失敗: ${error.message}`,
        ToolErrorType.API_ERROR,
        { name, department, originalError: error.message },
      );
    }
  }

  /**
   * 驗證輸入參數
   */
  validateInput(params) {
    // 呼叫父類別的基本驗證
    super.validateInput(params);

    const { name, department } = params;

    // 檢查至少提供一個查詢條件
    if (
      (!name || name.trim() === "") &&
      (!department || department.trim() === "")
    ) {
      throw new ToolExecutionError(
        "查詢條件不足，請至少提供姓名或部門資訊其中之一",
        ToolErrorType.VALIDATION_ERROR,
        {
          name,
          department,
          message: "缺少查詢條件",
        },
      );
    }

    return true;
  }
}
