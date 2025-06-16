/**
 * 人資管理工具：部門清單查詢
 *
 * 提供公司組織架構中的部門清單查詢功能
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import { defaultApiClient as apiClient } from "../../services/api-client.js";
import logger from "../../config/logger.js";

/**
 * 部門清單查詢工具
 */
export class GetDepartmentListTool extends BaseTool {
  constructor() {
    super(
      "get_department_list",
      "查詢公司部門清單，包括部門基本資訊、主管、員工人數等",
      {
        type: "object",
        properties: {
          includeInactive: {
            type: "boolean",
            default: false,
            description: "是否包含已停用的部門（預設：false）",
          },
          includeStats: {
            type: "boolean",
            default: true,
            description: "是否包含部門統計資訊（員工人數等，預設：true）",
          },
          parentDepartmentId: {
            type: "string",
            description: "上級部門ID，用於查詢特定部門下的子部門（可選）",
            pattern: "^[A-Z]{2,3}\\d{3}$",
            example: "HR001",
          },
          level: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            description: "部門層級（1-5，可選，用於限制查詢深度）",
          },
          sortBy: {
            type: "string",
            enum: [
              "departmentCode",
              "departmentName",
              "employeeCount",
              "establishedDate",
            ],
            default: "departmentCode",
            description: "排序方式：代碼、名稱、員工數、成立日期",
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "asc",
            description: "排序順序：asc(升序)、desc(降序)",
          },
        },
        required: [],
      },
    );
  }

  /**
   * 執行部門清單查詢
   */
  async _execute(params, options) {
    const {
      includeInactive = false,
      includeStats = true,
      parentDepartmentId,
      level,
      sortBy = "departmentCode",
      sortOrder = "asc",
    } = params;

    try {
      logger.info("Querying department list", {
        toolName: this.name,
        includeInactive,
        includeStats,
        parentDepartmentId,
        level,
        sortBy,
        sortOrder,
      });

      // 模擬 API 調用（實際環境中會調用真實的 HR API）
      const departmentData = await this._fetchDepartmentData(
        includeInactive,
        includeStats,
        parentDepartmentId,
        level,
        sortBy,
        sortOrder,
      );

      if (!departmentData || departmentData.length === 0) {
        return {
          success: true,
          result: {
            departments: [],
            totalCount: 0,
            query: {
              includeInactive,
              includeStats,
              parentDepartmentId,
              level,
              sortBy,
              sortOrder,
            },
            timestamp: new Date().toISOString(),
          },
        };
      }

      const result = {
        departments: departmentData,
        totalCount: departmentData.length,
        query: {
          includeInactive,
          includeStats,
          parentDepartmentId,
          level,
          sortBy,
          sortOrder,
        },
        timestamp: new Date().toISOString(),
      };

      logger.info("Department list retrieved successfully", {
        toolName: this.name,
        totalCount: departmentData.length,
        includeInactive,
        includeStats,
      });

      return {
        success: true,
        result,
      };
    } catch (error) {
      logger.error("Failed to retrieve department list", {
        toolName: this.name,
        error: error.message,
        includeInactive,
        includeStats,
        parentDepartmentId,
      });

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      // 包裝其他錯誤
      throw new ToolExecutionError(
        `Failed to fetch department list: ${error.message}`,
        ToolErrorType.API_ERROR,
        { includeInactive, includeStats, originalError: error.message },
      );
    }
  }

  /**
   * 模擬獲取部門資料（實際環境中會調用真實 HR API）
   */
  async _fetchDepartmentData(
    includeInactive,
    includeStats,
    parentDepartmentId,
    level,
    sortBy,
    sortOrder,
  ) {
    // 模擬網路延遲
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 300 + 100),
    );

    // 模擬部門資料庫
    const mockDepartments = [
      {
        departmentId: "CEO001",
        departmentCode: "CEO",
        departmentName: "執行長辦公室",
        englishName: "CEO Office",
        level: 1,
        parentDepartmentId: null,
        status: "active",
        establishedDate: "2015-01-01",
        manager: {
          employeeId: "A123000",
          name: "陳執行長",
          englishName: "CEO Chen",
          email: "ceo@company.com",
        },
        location: "台北總部 12F",
        description: "公司最高決策單位，負責公司策略規劃與重大決策",
        budget: {
          annual: 50000000,
          currency: "TWD",
        },
        statistics: {
          totalEmployees: 3,
          activeEmployees: 3,
          managerCount: 1,
          averageAge: 45.7,
          averageTenure: 8.2,
        },
      },
      {
        departmentId: "IT001",
        departmentCode: "IT",
        departmentName: "資訊技術部",
        englishName: "Information Technology",
        level: 2,
        parentDepartmentId: "CEO001",
        status: "active",
        establishedDate: "2016-03-15",
        manager: {
          employeeId: "A123001",
          name: "李大華",
          englishName: "David Lee",
          email: "david.lee@company.com",
        },
        location: "台北總部 8F",
        description: "負責公司資訊系統開發、維護及技術支援",
        budget: {
          annual: 25000000,
          currency: "TWD",
        },
        statistics: {
          totalEmployees: 15,
          activeEmployees: 14,
          managerCount: 3,
          averageAge: 32.5,
          averageTenure: 3.8,
        },
      },
      {
        departmentId: "HR001",
        departmentCode: "HR",
        departmentName: "人力資源部",
        englishName: "Human Resources",
        level: 2,
        parentDepartmentId: "CEO001",
        status: "active",
        establishedDate: "2015-06-01",
        manager: {
          employeeId: "A123002",
          name: "陳部長",
          englishName: "Manager Chen",
          email: "hr.manager@company.com",
        },
        location: "台北總部 3F",
        description: "負責人力資源管理、招募、訓練及員工關係",
        budget: {
          annual: 15000000,
          currency: "TWD",
        },
        statistics: {
          totalEmployees: 8,
          activeEmployees: 8,
          managerCount: 2,
          averageAge: 35.2,
          averageTenure: 4.5,
        },
      },
      {
        departmentId: "FIN001",
        departmentCode: "FIN",
        departmentName: "財務部",
        englishName: "Finance",
        level: 2,
        parentDepartmentId: "CEO001",
        status: "active",
        establishedDate: "2015-02-01",
        manager: {
          employeeId: "A123003",
          name: "王財務長",
          englishName: "CFO Wang",
          email: "cfo@company.com",
        },
        location: "台北總部 5F",
        description: "負責公司財務規劃、會計、稅務及投資管理",
        budget: {
          annual: 12000000,
          currency: "TWD",
        },
        statistics: {
          totalEmployees: 10,
          activeEmployees: 9,
          managerCount: 2,
          averageAge: 38.1,
          averageTenure: 5.2,
        },
      },
      {
        departmentId: "SAL001",
        departmentCode: "SALES",
        departmentName: "業務部",
        englishName: "Sales",
        level: 2,
        parentDepartmentId: "CEO001",
        status: "active",
        establishedDate: "2015-04-15",
        manager: {
          employeeId: "A123004",
          name: "張業務總監",
          englishName: "Sales Director Zhang",
          email: "sales.director@company.com",
        },
        location: "台北總部 6F",
        description: "負責產品銷售、客戶關係管理及市場開發",
        budget: {
          annual: 30000000,
          currency: "TWD",
        },
        statistics: {
          totalEmployees: 20,
          activeEmployees: 18,
          managerCount: 4,
          averageAge: 33.8,
          averageTenure: 3.2,
        },
      },
      {
        departmentId: "MKT001",
        departmentCode: "MKT",
        departmentName: "行銷部",
        englishName: "Marketing",
        level: 2,
        parentDepartmentId: "CEO001",
        status: "active",
        establishedDate: "2017-01-10",
        manager: {
          employeeId: "A123005",
          name: "林行銷經理",
          englishName: "Marketing Manager Lin",
          email: "marketing.manager@company.com",
        },
        location: "台北總部 7F",
        description: "負責品牌推廣、市場行銷及廣告企劃",
        budget: {
          annual: 18000000,
          currency: "TWD",
        },
        statistics: {
          totalEmployees: 12,
          activeEmployees: 12,
          managerCount: 2,
          averageAge: 29.5,
          averageTenure: 2.8,
        },
      },
      {
        departmentId: "ITD001",
        departmentCode: "DEV",
        departmentName: "軟體開發組",
        englishName: "Software Development",
        level: 3,
        parentDepartmentId: "IT001",
        status: "active",
        establishedDate: "2018-06-01",
        manager: {
          employeeId: "A123010",
          name: "王工程師",
          englishName: "Engineer Wang",
          email: "dev.lead@company.com",
        },
        location: "台北總部 8F-A",
        description: "負責軟體產品開發及系統架構設計",
        budget: {
          annual: 15000000,
          currency: "TWD",
        },
        statistics: {
          totalEmployees: 10,
          activeEmployees: 9,
          managerCount: 2,
          averageAge: 30.2,
          averageTenure: 2.5,
        },
      },
      {
        departmentId: "OLD001",
        departmentCode: "OLD",
        departmentName: "已停用部門",
        englishName: "Inactive Department",
        level: 2,
        parentDepartmentId: "CEO001",
        status: "inactive",
        establishedDate: "2016-01-01",
        disabledDate: "2020-12-31",
        manager: null,
        location: "N/A",
        description: "已停用的測試部門",
        budget: {
          annual: 0,
          currency: "TWD",
        },
        statistics: {
          totalEmployees: 0,
          activeEmployees: 0,
          managerCount: 0,
          averageAge: 0,
          averageTenure: 0,
        },
      },
    ];

    // 篩選條件
    let filteredDepartments = mockDepartments;

    // 是否包含已停用部門
    if (!includeInactive) {
      filteredDepartments = filteredDepartments.filter(
        dept => dept.status === "active",
      );
    }

    // 父部門篩選
    if (parentDepartmentId) {
      filteredDepartments = filteredDepartments.filter(
        dept => dept.parentDepartmentId === parentDepartmentId,
      );
    }

    // 層級篩選
    if (level) {
      filteredDepartments = filteredDepartments.filter(
        dept => dept.level === level,
      );
    }

    // 排序
    filteredDepartments.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "departmentCode":
          aValue = a.departmentCode;
          bValue = b.departmentCode;
          break;
        case "departmentName":
          aValue = a.departmentName;
          bValue = b.departmentName;
          break;
        case "employeeCount":
          aValue = a.statistics?.activeEmployees || 0;
          bValue = b.statistics?.activeEmployees || 0;
          break;
        case "establishedDate":
          aValue = new Date(a.establishedDate);
          bValue = new Date(b.establishedDate);
          break;
        default:
          aValue = a.departmentCode;
          bValue = b.departmentCode;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "desc") {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // 如果不需要統計資訊，移除相關欄位
    if (!includeStats) {
      filteredDepartments = filteredDepartments.map(dept => {
        const { statistics, budget, ...departmentWithoutStats } = dept;
        return departmentWithoutStats;
      });
    }

    return filteredDepartments;
  }

  /**
   * 驗證輸入參數
   */
  validateInput(params) {
    const errors = [];

    if (params.parentDepartmentId) {
      if (!/^[A-Z]{2,3}\d{3}$/.test(params.parentDepartmentId)) {
        errors.push(
          "parentDepartmentId 格式不正確，應為 2-3 個大寫字母 + 3 位數字",
        );
      }
    }

    if (params.level && (params.level < 1 || params.level > 5)) {
      errors.push("level 必須在 1-5 之間");
    }

    if (errors.length > 0) {
      throw new ToolExecutionError(
        `輸入參數驗證失敗: ${errors.join(", ")}`,
        ToolErrorType.VALIDATION_ERROR,
        { validationErrors: errors },
      );
    }

    return true;
  }
}
