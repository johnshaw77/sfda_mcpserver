/**
 * 員工名單查詢工具
 *
 * 提供部門、職位、狀態等條件的員工名單查詢功能
 */

import { BaseTool } from "../base-tool.js";
import { defaultApiClient as apiClient } from "../../services/api-client.js";
import logger from "../../config/logger.js";

export class GetEmployeeListTool extends BaseTool {
  constructor() {
    super("get_employee_list", "查詢員工名單", {
      type: "object",
      properties: {
        department: {
          type: "string",
          description: "部門代碼或名稱（可選）",
        },
        jobTitle: {
          type: "string",
          description: "職位名稱（可選）",
        },
        status: {
          type: "string",
          enum: ["active", "inactive", "all"],
          default: "active",
          description: "員工狀態：active(在職)、inactive(離職)、all(全部)",
        },
        page: {
          type: "integer",
          minimum: 1,
          default: 1,
          description: "頁碼（從1開始）",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20,
          description: "每頁筆數（1-100）",
        },
        includeDetails: {
          type: "boolean",
          default: false,
          description: "是否包含詳細資訊（職位、部門等）",
        },
      },
      required: [],
    });
  }

  async _execute(params) {
    const {
      department,
      jobTitle,
      status = "active",
      page = 1,
      limit = 20,
      includeDetails = false,
    } = params;

    logger.info("Querying employee list", {
      toolName: this.name,
      department,
      jobTitle,
      status,
      page,
      limit,
      includeDetails,
    });

    try {
      // 建構查詢參數
      const queryParams = new URLSearchParams({
        status,
        page: page.toString(),
        limit: limit.toString(),
        includeDetails: includeDetails.toString(),
      });

      if (department) {
        queryParams.append("department", department);
      }

      if (jobTitle) {
        queryParams.append("jobTitle", jobTitle);
      }

      // 模擬 API 調用（實際環境中會調用真實的 HR API）
      const response = await this._simulateEmployeeListQuery(
        department,
        jobTitle,
        status,
        page,
        limit,
        includeDetails,
      );

      logger.info("Employee list retrieved successfully", {
        toolName: this.name,
        totalCount: response.totalCount,
        pageCount: response.data.length,
        page,
        limit,
      });

      return {
        success: true,
        result: {
          ...response,
          query: {
            department,
            jobTitle,
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
        jobTitle,
        status,
      });

      throw new Error(`查詢員工名單失敗: ${error.message}`);
    }
  }

  /**
   * 模擬員工名單查詢 API
   */
  async _simulateEmployeeListQuery(
    department,
    jobTitle,
    status,
    page,
    limit,
    includeDetails,
  ) {
    // 模擬延遲
    await new Promise(resolve =>
      setTimeout(resolve, 100 + Math.random() * 200),
    );

    // 模擬員工資料
    const allEmployees = [
      {
        employeeId: "A123456",
        name: "蕭傳璋",
        englishName: "John Hsiao",
        department: { code: "KD", name: "數據分析部" },
        jobTitle: "資深軟體工程師",
        jobLevel: "P5",
        status: "active",
        hireDate: "2020-03-01",
        email: "ming.zhang@company.com",
        phone: "0922-035-967",
      },
      {
        employeeId: "A123457",
        name: "李小美",
        englishName: "Amy Li",
        department: { code: "HR", name: "人力資源部" },
        jobTitle: "人資專員",
        jobLevel: "P3",
        status: "active",
        hireDate: "2021-06-15",
        email: "amy.li@company.com",
        phone: "0913-456-789",
      },
      {
        employeeId: "A123458",
        name: "王大華",
        englishName: "David Wang",
        department: { code: "IT", name: "資訊技術部" },
        jobTitle: "技術主管",
        jobLevel: "M3",
        status: "active",
        hireDate: "2018-01-10",
        email: "david.wang@company.com",
        phone: "0914-567-890",
      },
      {
        employeeId: "A123459",
        name: "陳小花",
        englishName: "Flora Chen",
        department: { code: "FIN", name: "財務部" },
        jobTitle: "會計師",
        jobLevel: "P4",
        status: "active",
        hireDate: "2019-09-01",
        email: "flora.chen@company.com",
        phone: "0915-678-901",
      },
      {
        employeeId: "A123460",
        name: "林小強",
        englishName: "Strong Lin",
        department: { code: "IT", name: "資訊技術部" },
        jobTitle: "軟體工程師",
        jobLevel: "P3",
        status: "inactive",
        hireDate: "2020-08-01",
        leaveDate: "2023-12-31",
        email: "strong.lin@company.com",
        phone: "0916-789-012",
      },
    ];

    // 根據條件篩選
    let filteredEmployees = allEmployees;

    if (status !== "all") {
      filteredEmployees = filteredEmployees.filter(
        emp => emp.status === status,
      );
    }

    if (department) {
      filteredEmployees = filteredEmployees.filter(
        emp =>
          emp.department.code
            .toLowerCase()
            .includes(department.toLowerCase()) ||
          emp.department.name.includes(department),
      );
    }

    if (jobTitle) {
      filteredEmployees = filteredEmployees.filter(emp =>
        emp.jobTitle.includes(jobTitle),
      );
    }

    // 分頁處理
    const totalCount = filteredEmployees.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    // 根據 includeDetails 決定回傳的欄位
    const employees = paginatedEmployees.map(emp => {
      if (includeDetails) {
        return emp;
      } else {
        return {
          employeeId: emp.employeeId,
          name: emp.name,
          englishName: emp.englishName,
          department: emp.department.name,
          jobTitle: emp.jobTitle,
          status: emp.status,
        };
      }
    });

    return {
      data: employees,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
