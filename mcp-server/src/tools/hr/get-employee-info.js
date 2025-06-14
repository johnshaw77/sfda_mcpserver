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
          name: "白勝宇",
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
          departmentName: "數據分析部",
          departmentCode: "KD",
          manager: "蕭傳璋",
          managerId: "A123001",
          location: "高雄大竂K2",
        },
        position: {
          jobTitle: "專案工程師",
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

      A116592: {
        basic: {
          employeeId: "A116592",
          name: "蕭傳璋",
          englishName: "john Hsioa",
          gender: "男",
          birthDate: "1988-12-20",
          nationalId: "B987654321",
          hireDate: "2019-01-15",
        },
        contact: {
          email: "hua.li@company.com",
          phone: "0923-456-789",
          address: "新北市板橋區文化路二段456號",
          emergencyContact: {
            name: "先生",
            relationship: "配偶",
            phone: "0976-543-210",
          },
        },
        department: {
          departmentId: "HR001",
          departmentName: "Data Analytics",
          departmentCode: "DA",
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

      //stt

      A234567: {
        basic: {
          employeeId: "A234567",
          name: "林美玲",
          englishName: "Mary Lin",
          gender: "女",
          birthDate: "1992-05-10",
          nationalId: "A234567890",
          hireDate: "2021-03-01",
        },
        contact: {
          email: "mary.lin@company.com",
          phone: "0912-345-678",
          address: "台北市信義區市府路1號",
          emergencyContact: {
            name: "林先生",
            relationship: "父親",
            phone: "0987-654-321",
          },
        },
        department: {
          departmentId: "MK002",
          departmentName: "Marketing",
          departmentCode: "MK",
          manager: "王經理",
          managerId: "A123001",
          location: "台北總部 5F",
        },
        position: {
          jobTitle: "行銷專員",
          jobLevel: "P2",
          jobFamily: "行銷類",
          reportingManager: "王經理",
          reportingManagerId: "A123001",
        },
        employment: {
          employmentType: "正職",
          contractType: "無期限合約",
          workType: "混合辦公",
          probationEndDate: "2021-06-01",
          salary: {
            baseSalary: 58000,
            currency: "TWD",
            payFrequency: "月薪",
          },
        },
      },
      B112233: {
        basic: {
          employeeId: "B112233",
          name: "陳志明",
          englishName: "David Chen",
          gender: "男",
          birthDate: "1985-11-25",
          nationalId: "F123456789",
          hireDate: "2018-08-20",
        },
        contact: {
          email: "david.chen@company.com",
          phone: "0933-112-233",
          address: "台中市西屯區市政路386號",
          emergencyContact: {
            name: "陳太太",
            relationship: "配偶",
            phone: "0955-887-766",
          },
        },
        department: {
          departmentId: "RD001",
          departmentName: "Research & Development",
          departmentCode: "RD",
          manager: "李協理",
          managerId: "A123003",
          location: "台中分部 2F",
        },
        position: {
          jobTitle: "軟體工程師",
          jobLevel: "P4",
          jobFamily: "技術類",
          reportingManager: "李協理",
          reportingManagerId: "A123003",
        },
        employment: {
          employmentType: "正職",
          contractType: "無期限合約",
          workType: "辦公室",
          probationEndDate: "2018-11-20",
          salary: {
            baseSalary: 75000,
            currency: "TWD",
            payFrequency: "月薪",
          },
        },
      },
      A987123: {
        basic: {
          employeeId: "C987123",
          name: "黃怡君",
          englishName: "Emily Huang",
          gender: "女",
          birthDate: "1995-02-18",
          nationalId: "E234567890",
          hireDate: "2023-07-10",
        },
        contact: {
          email: "emily.huang@company.com",
          phone: "0966-987-123",
          address: "高雄市前鎮區中山二路5號",
          emergencyContact: {
            name: "黃媽媽",
            relationship: "母親",
            phone: "0911-223-344",
          },
        },
        department: {
          departmentId: "SL003",
          departmentName: "Sales",
          departmentCode: "SL",
          manager: "張副總",
          managerId: "A123004",
          location: "高雄分部 1F",
        },
        position: {
          jobTitle: "業務代表",
          jobLevel: "P1",
          jobFamily: "業務類",
          reportingManager: "張副總",
          reportingManagerId: "A123004",
        },
        employment: {
          employmentType: "正職",
          contractType: "無期限合約",
          workType: "遠端工作",
          probationEndDate: "2023-10-10",
          salary: {
            baseSalary: 52000,
            currency: "TWD",
            payFrequency: "月薪",
          },
        },
      },
      A445566: {
        basic: {
          employeeId: "D445566",
          name: "吳建華",
          englishName: "James Wu",
          gender: "男",
          birthDate: "1980-09-03",
          nationalId: "H123456789",
          hireDate: "2015-11-01",
        },
        contact: {
          email: "james.wu@company.com",
          phone: "0977-445-566",
          address: "台南市中西區成功路1號",
          emergencyContact: {
            name: "吳小姐",
            relationship: "妹妹",
            phone: "0922-334-455",
          },
        },
        department: {
          departmentId: "FN001",
          departmentName: "Finance",
          departmentCode: "FN",
          manager: "劉總監",
          managerId: "A123005",
          location: "台北總部 4F",
        },
        position: {
          jobTitle: "財務分析師",
          jobLevel: "P5",
          jobFamily: "財務類",
          reportingManager: "劉總監",
          reportingManagerId: "A123005",
        },
        employment: {
          employmentType: "正職",
          contractType: "無期限合約",
          workType: "辦公室",
          probationEndDate: "2016-02-01",
          salary: {
            baseSalary: 85000,
            currency: "TWD",
            payFrequency: "月薪",
          },
        },
      },
      A778899: {
        basic: {
          employeeId: "A778899",
          name: "鄭雅婷",
          englishName: "Tina Cheng",
          gender: "女",
          birthDate: "1998-12-01",
          nationalId: "P234567890",
          hireDate: "2024-01-15",
        },
        contact: {
          email: "tina.cheng@company.com",
          phone: "0988-778-899",
          address: "新竹市東區光復路二段101號",
          emergencyContact: {
            name: "鄭先生",
            relationship: "哥哥",
            phone: "0933-445-566",
          },
        },
        department: {
          departmentId: "RD001",
          departmentName: "Research & Development",
          departmentCode: "RD",
          manager: "李協理",
          managerId: "A123003",
          location: "新竹辦公室 3F",
        },
        position: {
          jobTitle: "初階工程師",
          jobLevel: "P1",
          jobFamily: "技術類",
          reportingManager: "李協理",
          reportingManagerId: "A123003",
        },
        employment: {
          employmentType: "約聘",
          contractType: "一年期合約",
          workType: "辦公室",
          probationEndDate: "2024-04-15",
          salary: {
            baseSalary: 60000,
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
