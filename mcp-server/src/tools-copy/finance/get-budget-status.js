/**
 * 財務管理工具：預算狀態查詢
 *
 * 提供部門預算、專案預算、支出統計等財務資訊查詢功能
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import logger from "../../config/logger.js";

/**
 * 預算狀態查詢工具
 */
export class GetBudgetStatusTool extends BaseTool {
  constructor() {
    super(
      "get_budget_status",
      "查詢部門或專案的預算狀態，包括預算總額、已使用金額、剩餘預算等",
      {
        type: "object",
        properties: {
          budgetType: {
            type: "string",
            enum: ["department", "project", "category", "all"],
            default: "department",
            description:
              "預算類型：department(部門)、project(專案)、category(類別)、all(全部)",
          },
          budgetId: {
            type: "string",
            description: "預算ID（部門代碼、專案代碼或類別代碼，可選）",
          },
          fiscalYear: {
            type: "integer",
            minimum: 2020,
            maximum: 2030,
            default: new Date().getFullYear(),
            description: "會計年度（預設為當年）",
          },
          quarter: {
            type: "integer",
            minimum: 1,
            maximum: 4,
            description: "季度（1-4，可選，不指定則查詢全年）",
          },
          month: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            description: "月份（1-12，可選，不指定則查詢季度或全年）",
          },
          includeDetails: {
            type: "boolean",
            default: true,
            description: "是否包含詳細支出明細（預設：true）",
          },
          includeForecasting: {
            type: "boolean",
            default: false,
            description: "是否包含預算預測分析（預設：false）",
          },
          currency: {
            type: "string",
            enum: ["TWD", "USD", "EUR"],
            default: "TWD",
            description: "貨幣單位（預設：TWD）",
          },
          threshold: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "預算使用率警示門檻（百分比，可選）",
          },
        },
        required: [],
      },
    );
  }

  /**
   * 執行預算狀態查詢
   */
  async _execute(params, options) {
    const {
      budgetType = "department",
      budgetId,
      fiscalYear = new Date().getFullYear(),
      quarter,
      month,
      includeDetails = true,
      includeForecasting = false,
      currency = "TWD",
      threshold,
    } = params;

    try {
      logger.info("Querying budget status", {
        toolName: this.name,
        budgetType,
        budgetId,
        fiscalYear,
        quarter,
        month,
      });

      // 模擬獲取預算資料
      const budgetData = await this._fetchBudgetData(
        budgetType,
        budgetId,
        fiscalYear,
        quarter,
        month,
        includeDetails,
        includeForecasting,
        currency,
        threshold,
      );

      if (!budgetData || budgetData.length === 0) {
        return {
          success: true,
          result: {
            budgets: [],
            summary: {
              totalBudget: 0,
              totalSpent: 0,
              totalRemaining: 0,
              utilizationRate: 0,
            },
            query: {
              budgetType,
              budgetId,
              fiscalYear,
              quarter,
              month,
              currency,
            },
            timestamp: new Date().toISOString(),
          },
        };
      }

      // 計算總計資訊
      const summary = this._calculateSummary(budgetData, currency);

      // 檢查預警門檻
      const alerts = threshold
        ? this._checkThresholdAlerts(budgetData, threshold)
        : [];

      const result = {
        budgets: budgetData,
        summary,
        alerts,
        query: {
          budgetType,
          budgetId,
          fiscalYear,
          quarter,
          month,
          currency,
          threshold,
        },
        timestamp: new Date().toISOString(),
      };

      logger.info("Budget status retrieved successfully", {
        toolName: this.name,
        budgetCount: budgetData.length,
        totalBudget: summary.totalBudget,
        utilizationRate: summary.utilizationRate,
      });

      return {
        success: true,
        result,
      };
    } catch (error) {
      logger.error("Failed to retrieve budget status", {
        toolName: this.name,
        error: error.message,
        budgetType,
        budgetId,
        fiscalYear,
      });

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      throw new ToolExecutionError(
        `Failed to fetch budget status: ${error.message}`,
        ToolErrorType.API_ERROR,
        { budgetType, budgetId, fiscalYear, originalError: error.message },
      );
    }
  }

  /**
   * 模擬獲取預算資料
   */
  async _fetchBudgetData(
    budgetType,
    budgetId,
    fiscalYear,
    quarter,
    month,
    includeDetails,
    includeForecasting,
    currency,
    threshold,
  ) {
    // 模擬網路延遲
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 400 + 150),
    );

    // 模擬預算資料庫
    const mockBudgets = [
      {
        budgetId: "IT001",
        budgetType: "department",
        name: "資訊技術部年度預算",
        departmentCode: "IT",
        departmentName: "資訊技術部",
        fiscalYear: 2025,
        totalBudget: 25000000,
        spentAmount: 15750000,
        remainingAmount: 9250000,
        utilizationRate: 63.0,
        currency: "TWD",
        status: "active",
        manager: {
          employeeId: "A123001",
          name: "李大華",
          email: "david.lee@company.com",
        },
        categories: [
          {
            categoryId: "IT001-HW",
            categoryName: "硬體設備",
            budgetAmount: 8000000,
            spentAmount: 6200000,
            remainingAmount: 1800000,
            utilizationRate: 77.5,
            transactions: includeDetails
              ? [
                  {
                    transactionId: "TX20250315001",
                    date: "2025-03-15",
                    description: "伺服器升級專案",
                    amount: 2500000,
                    vendor: "科技公司A",
                    approvedBy: "李大華",
                  },
                ]
              : undefined,
          },
        ],
      },
      {
        budgetId: "HR001",
        budgetType: "department",
        name: "人力資源部年度預算",
        departmentCode: "HR",
        departmentName: "人力資源部",
        fiscalYear: 2025,
        totalBudget: 15000000,
        spentAmount: 7200000,
        remainingAmount: 7800000,
        utilizationRate: 48.0,
        currency: "TWD",
        status: "active",
      },
    ];

    // 篩選條件
    let filteredBudgets = mockBudgets;

    if (budgetType !== "all") {
      filteredBudgets = filteredBudgets.filter(
        budget => budget.budgetType === budgetType,
      );
    }

    if (budgetId) {
      filteredBudgets = filteredBudgets.filter(
        budget =>
          budget.departmentCode === budgetId || budget.budgetId === budgetId,
      );
    }

    filteredBudgets = filteredBudgets.filter(
      budget => budget.fiscalYear === fiscalYear,
    );

    return filteredBudgets;
  }

  /**
   * 計算預算總計資訊
   */
  _calculateSummary(budgets, currency) {
    const totalBudget = budgets.reduce(
      (sum, budget) => sum + (budget.totalBudget || 0),
      0,
    );
    const totalSpent = budgets.reduce(
      (sum, budget) => sum + (budget.spentAmount || 0),
      0,
    );
    const totalRemaining = budgets.reduce(
      (sum, budget) => sum + (budget.remainingAmount || 0),
      0,
    );
    const utilizationRate =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      currency,
      budgetCount: budgets.length,
    };
  }

  /**
   * 檢查預算門檻警示
   */
  _checkThresholdAlerts(budgets, threshold) {
    const alerts = [];

    budgets.forEach(budget => {
      if (budget.utilizationRate >= threshold) {
        alerts.push({
          type: "threshold_exceeded",
          severity: budget.utilizationRate >= 90 ? "high" : "medium",
          budgetId: budget.budgetId,
          budgetName: budget.name,
          utilizationRate: budget.utilizationRate,
          threshold,
          message: `${budget.name} 預算使用率 ${budget.utilizationRate}% 已超過門檻 ${threshold}%`,
        });
      }
    });

    return alerts;
  }
}
