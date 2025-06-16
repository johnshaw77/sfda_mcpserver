/**
 * 人資管理工具：員工資訊查詢
 *
 * 提供員工基本資訊、部門資訊、職位資訊等查詢功能
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import { defaultApiClient as apiClient } from "../../services/api-client.js";
import employeeService from "../../services/hr/employee-service.js";
import logger from "../../config/logger.js";

/**
 * 員工資訊查詢工具
 */
export class GetEmployeeInfoTool extends BaseTool {
  constructor() {
    super(
      "get_employee_info",
      "查詢員工基本資訊，包括個人資料、部門、職位、聯絡方式等，從 org_employee 資料表獲取",
      {
        type: "object",
        properties: {
          employeeNo: {
            type: "string",
            description: "員工編號（必填），對應資料庫中的 employee_no 欄位",
            example: "A116592",
          },
          includeDetails: {
            type: "boolean",
            description: "是否包含詳細資訊（選填，預設為 true）",
            default: true,
          },
          fields: {
            type: "array",
            description: "指定返回的欄位類別（選填）",
            items: {
              type: "string",
              enum: [
                "basic",
                "contact",
                "department",
                "position",
                "employment",
              ],
            },
            default: ["basic", "contact", "department", "position"],
          },
        },
        required: ["employeeNo"],
      },
      {
        cacheable: false, // 停用快取，避免個人資料被誤用
      },
    );
  }

  /**
   * 執行員工資訊查詢
   */
  async _execute(params, options) {
    const {
      employeeNo,
      includeDetails = true,
      fields = ["basic", "contact", "department", "position"],
    } = params;

    try {
      logger.info(`Querying employee info for: ${employeeNo}`, {
        toolName: this.name,
        employeeNo,
        includeDetails,
        fields,
      });

      // 從資料庫獲取員工資料
      const employeeData = await employeeService.getEmployeeById(
        employeeNo,
        includeDetails,
        fields,
      );

      // 加強錯誤處理：明確檢查員工是否存在
      if (!employeeData || Object.keys(employeeData).length === 0) {
        logger.warn(`Employee not found in database: ${employeeNo}`, {
          toolName: this.name,
          employeeNo,
          searchedFields: fields,
        });

        throw new ToolExecutionError(
          `找不到員工資料：員工編號 ${employeeNo} 不存在於系統中。請確認員工編號是否正確。`,
          ToolErrorType.NOT_FOUND,
          {
            employeeNo,
            message: "員工不存在",
            suggestedAction:
              "請檢查員工編號格式是否正確，或聯絡人資部門確認員工資料",
          },
        );
      }

      // 建構返回結果
      const result = {
        employeeNo,
        timestamp: new Date().toISOString(),
        data: employeeData,
        fields: fields,
      };

      logger.info(`Employee info retrieved successfully: ${employeeNo}`, {
        toolName: this.name,
        employeeNo,
        fieldsCount: Object.keys(employeeData).length,
      });

      return result;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }

      // 包裝其他錯誤
      throw new ToolExecutionError(
        `Failed to fetch employee info: ${error.message}`,
        ToolErrorType.API_ERROR,
        { employeeNo, originalError: error.message },
      );
    }
  }

  /**
   * 驗證員工編號格式
   */
  validateInput(params) {
    // 呼叫父類別的基本驗證
    super.validateInput(params);

    const { employeeNo } = params;

    // 檢查員工編號是否為空
    if (!employeeNo || employeeNo.trim() === "") {
      throw new ToolExecutionError(
        "員工編號不能為空",
        ToolErrorType.VALIDATION_ERROR,
        {
          employeeNo,
          message: "請提供有效的員工編號",
        },
      );
    }

    // 簡單驗證員工編號格式，根據實際資料庫可能需要調整
    if (employeeNo.length > 50) {
      // 根據資料庫 employee_no 欄位大小限制
      throw new ToolExecutionError(
        "員工編號格式不正確。員工編號不應超過50個字符",
        ToolErrorType.VALIDATION_ERROR,
        {
          employeeNo,
          message: "請提供有效的員工編號",
        },
      );
    }

    return true;
  }
}
