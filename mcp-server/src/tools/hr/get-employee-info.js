/**
 * 人資管理工具：員工資訊查詢
 *
 * 提供員工基本資訊、部門資訊、職位資訊等查詢功能
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import { defaultApiClient as apiClient } from "../../services/api-client.js";
import logger from "../../config/logger.js";

/**
 * 員工資訊查詢工具
 */
export class GetEmployeeInfoTool extends BaseTool {
  constructor() {
    super(
      "get_employee_info",
      "查詢員工基本資訊，包括個人資料、部門、職位、聯絡方式等",
      {
        type: "object",
        properties: {
          employeeId: {
            type: "string",
            description: "員工編號（必填）",
            pattern: "^[A-Z]\\d{6}$",
            example: "A123456",
          },
          includeDetails: {
            type: "boolean",
            description: "是否包含詳細資訊（選填，預設為 true）",
            default: true,
          },
          fields: {
            type: "array",
            description: "指定返回的欄位（選填）",
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
        required: ["employeeId"],
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
      employeeId,
      includeDetails = true,
      fields = ["basic", "contact", "department", "position"],
    } = params;

    try {
      logger.info(`Querying employee info for: ${employeeId}`, {
        toolName: this.name,
        employeeId,
        includeDetails,
        fields,
      });

      // 模擬 API 調用（在實際環境中，這裡會調用真實的 HR API）
      const employeeData = await this._fetchEmployeeData(
        employeeId,
        includeDetails,
        fields,
      );

      // 加強錯誤處理：明確檢查員工是否存在
      if (!employeeData || Object.keys(employeeData).length === 0) {
        logger.warn(`Employee not found in database: ${employeeId}`, {
          toolName: this.name,
          employeeId,
          searchedFields: fields,
        });

        throw new ToolExecutionError(
          `找不到員工資料：員工編號 ${employeeId} 不存在於系統中。請確認員工編號是否正確。`,
          ToolErrorType.NOT_FOUND,
          {
            employeeId,
            message: "員工不存在",
            availableEmployees: ["A123456", "A123457"],
            suggestedAction:
              "請檢查員工編號格式是否正確，或聯絡人資部門確認員工資料",
          },
        );
      }

      // 建構返回結果
      const result = {
        employeeId,
        timestamp: new Date().toISOString(),
        data: employeeData,
        fields: fields,
      };

      logger.info(`Employee info retrieved successfully: ${employeeId}`, {
        toolName: this.name,
        employeeId,
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
        { employeeId, originalError: error.message },
      );
    }
  }

  /**
   * 模擬獲取員工資料（實際環境中會調用真實 HR API）
   */
  async _fetchEmployeeData(employeeId, includeDetails, fields) {
    // 模擬網路延遲
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 500 + 100),
    );

    // 模擬員工資料庫
    const mockDatabase = {
      A123456: {
        basic: {
          employeeId: "A123456",
          name: "張小明",
          englishName: "Ming Zhang",
          gender: "男",
          birthDate: "1990-05-15",
          nationalId: "A123456789",
          hireDate: "2020-03-01",
        },
        contact: {
          email: "ming.zhang@company.com",
          phone: "0912-345-678",
          address: "台北市信義區忠孝東路五段123號",
          emergencyContact: {
            name: "張媽媽",
            relationship: "母親",
            phone: "0987-654-321",
          },
        },
        department: {
          departmentId: "IT001",
          departmentName: "資訊技術部",
          departmentCode: "IT",
          manager: "李大華",
          managerId: "A123001",
          location: "台北總部 8F",
        },
        position: {
          jobTitle: "資深軟體工程師",
          jobLevel: "P5",
          jobFamily: "技術類",
          reportingManager: "王工程師",
          reportingManagerId: "A123010",
        },
        employment: {
          employmentType: "正職",
          contractType: "無期限合約",
          workType: "遠端+辦公室混合",
          probationEndDate: "2020-05-31",
          salary: {
            baseSalary: 80000,
            currency: "TWD",
            payFrequency: "月薪",
          },
        },
      },
      A123457: {
        basic: {
          employeeId: "A123457",
          name: "李小華",
          englishName: "Hua Li",
          gender: "女",
          birthDate: "1988-12-20",
          nationalId: "B987654321",
          hireDate: "2019-01-15",
        },
        contact: {
          email: "hua.li@company.com",
          phone: "0923-456-789",
          address: "新北市板橋區文化路二段456號",
          emergencyContact: {
            name: "李先生",
            relationship: "配偶",
            phone: "0976-543-210",
          },
        },
        department: {
          departmentId: "HR001",
          departmentName: "人力資源部",
          departmentCode: "HR",
          manager: "陳部長",
          managerId: "A123002",
          location: "台北總部 3F",
        },
        position: {
          jobTitle: "人資專員",
          jobLevel: "P3",
          jobFamily: "行政類",
          reportingManager: "陳部長",
          reportingManagerId: "A123002",
        },
        employment: {
          employmentType: "正職",
          contractType: "無期限合約",
          workType: "辦公室",
          probationEndDate: "2019-03-15",
          salary: {
            baseSalary: 55000,
            currency: "TWD",
            payFrequency: "月薪",
          },
        },
      },
    };

    // 檢查員工是否存在
    const employeeData = mockDatabase[employeeId];
    if (!employeeData) {
      logger.warn(`Employee ID ${employeeId} not found in mock database`, {
        employeeId,
        availableEmployees: Object.keys(mockDatabase),
        requestedFields: fields,
      });
      return null;
    }

    logger.info(`Employee found in mock database: ${employeeId}`, {
      employeeId,
      name: employeeData.basic?.name,
      department: employeeData.department?.departmentName,
    });

    // 根據請求的欄位建構返回資料
    const result = {};
    for (const field of fields) {
      if (employeeData[field]) {
        result[field] = employeeData[field];
      }
    }

    // 如果不包含詳細資訊，只返回基本資料
    if (!includeDetails && result.basic) {
      return {
        basic: {
          employeeId: result.basic.employeeId,
          name: result.basic.name,
          englishName: result.basic.englishName,
        },
      };
    }

    return result;
  }

  /**
   * 驗證員工編號格式
   */
  validateInput(params) {
    // 呼叫父類別的基本驗證
    super.validateInput(params);

    const { employeeId } = params;

    // 驗證員工編號格式 (A123456)
    const employeeIdPattern = /^[A-Z]\d{6}$/;
    if (!employeeIdPattern.test(employeeId)) {
      throw new ToolExecutionError(
        "Invalid employee ID format. Expected format: A123456 (one letter followed by 6 digits)",
        ToolErrorType.VALIDATION_ERROR,
        {
          employeeId,
          expectedFormat: "A123456",
          pattern: "^[A-Z]\\d{6}$",
        },
      );
    }

    return true;
  }
}
