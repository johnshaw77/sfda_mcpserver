/**
 * 員工薪資查詢工具
 *
 * 提供員工薪資、津貼、扣除項目等查詢功能
 */

import { BaseTool } from "../base-tool.js";
import { defaultApiClient as apiClient } from "../../services/api-client.js";
import logger from "../../config/logger.js";

export class GetSalaryInfoTool extends BaseTool {
  constructor() {
    super("get_salary_info", "查詢員工薪資資訊", {
      type: "object",
      properties: {
        employeeId: {
          type: "string",
          pattern: "^[A-Z]\\d{6}$",
          description: "員工編號（格式：A123456）",
        },
        period: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}$",
          description: "薪資期間（格式：YYYY-MM，如：2024-12）",
        },
        includeDetails: {
          type: "boolean",
          default: true,
          description: "是否包含詳細資訊（津貼、扣除項目明細等）",
        },
        includeSensitive: {
          type: "boolean",
          default: false,
          description: "是否包含敏感資訊（實際金額等），需要管理員權限",
        },
      },
      required: ["employeeId", "period"],
    });
  }

  async _execute(params) {
    const {
      employeeId,
      period,
      includeDetails = true,
      includeSensitive = false,
    } = params;

    // 驗證員工編號格式
    if (!this._validateEmployeeId(employeeId)) {
      throw new Error("員工編號格式錯誤，應為 A123456 格式");
    }

    // 驗證期間格式
    if (!this._validatePeriod(period)) {
      throw new Error("期間格式錯誤，應為 YYYY-MM 格式");
    }

    logger.info("Querying salary info", {
      toolName: this.name,
      employeeId,
      period,
      includeDetails,
      includeSensitive,
    });

    try {
      // 模擬 API 調用（實際環境中會調用真實的薪資系統 API）
      const response = await this._simulateSalaryQuery(
        employeeId,
        period,
        includeDetails,
        includeSensitive,
      );

      logger.info("Salary info retrieved successfully", {
        toolName: this.name,
        employeeId,
        period,
        includesSensitive: includeSensitive,
      });

      return {
        success: true,
        result: {
          employeeId,
          period,
          includeDetails,
          includeSensitive,
          timestamp: new Date().toISOString(),
          ...response,
        },
      };
    } catch (error) {
      logger.error("Failed to retrieve salary info", {
        toolName: this.name,
        error: error.message,
        employeeId,
        period,
      });

      throw new Error(`查詢薪資資訊失敗: ${error.message}`);
    }
  }

  /**
   * 驗證員工編號格式
   */
  _validateEmployeeId(employeeId) {
    const pattern = /^[A-Z]\d{6}$/;
    return pattern.test(employeeId);
  }

  /**
   * 驗證期間格式
   */
  _validatePeriod(period) {
    const pattern = /^\d{4}-\d{2}$/;
    if (!pattern.test(period)) return false;

    const [year, month] = period.split("-").map(Number);
    return (
      year >= 2020 &&
      year <= new Date().getFullYear() &&
      month >= 1 &&
      month <= 12
    );
  }

  /**
   * 模擬薪資查詢 API
   */
  async _simulateSalaryQuery(
    employeeId,
    period,
    includeDetails,
    includeSensitive,
  ) {
    // 模擬延遲
    await new Promise(resolve =>
      setTimeout(resolve, 200 + Math.random() * 400),
    );

    // 檢查員工是否存在
    if (!this._isValidEmployee(employeeId)) {
      throw new Error(`員工編號 ${employeeId} 不存在`);
    }

    // 檢查期間是否有效
    if (!this._isPeriodAvailable(period)) {
      throw new Error(`期間 ${period} 的薪資資料尚未準備或不存在`);
    }

    // 模擬權限檢查
    if (includeSensitive && !this._hasPermission(employeeId)) {
      throw new Error("無權限查看敏感薪資資訊，請聯繫人資部門");
    }

    const salaryData = this._generateSalaryData(
      employeeId,
      period,
      includeDetails,
      includeSensitive,
    );

    return {
      salaryData,
      payrollStatus: this._getPayrollStatus(period),
      ...(includeDetails &&
        includeSensitive && {
          taxInfo: this._getTaxInfo(salaryData),
          insuranceInfo: this._getInsuranceInfo(salaryData),
        }),
    };
  }

  /**
   * 檢查員工是否存在
   */
  _isValidEmployee(employeeId) {
    const validEmployees = ["A123456", "A123457", "A123458", "A123459"];
    return validEmployees.includes(employeeId);
  }

  /**
   * 檢查期間是否可用
   */
  _isPeriodAvailable(period) {
    const [year, month] = period.split("-").map(Number);
    const currentDate = new Date();
    const queryDate = new Date(year, month - 1);

    // 不能查詢未來的薪資
    return queryDate <= currentDate;
  }

  /**
   * 模擬權限檢查
   */
  _hasPermission(employeeId) {
    // 模擬權限檢查邏輯
    // 實際環境中會檢查用戶角色和權限
    return Math.random() > 0.3; // 70% 機率有權限
  }

  /**
   * 生成薪資資料
   */
  _generateSalaryData(employeeId, period, includeDetails, includeSensitive) {
    const baseData = {
      employeeId,
      period,
      paymentDate: this._getPaymentDate(period),
    };

    if (!includeSensitive) {
      return {
        ...baseData,
        status: "已發放",
        currency: "TWD",
        note: "詳細金額資訊需要管理員權限查看",
        summary: {
          hasBaseSalary: true,
          hasAllowances: true,
          hasDeductions: true,
          netPayAvailable: false,
        },
      };
    }

    // 生成詳細薪資資料
    const baseSalary = this._getBaseSalary(employeeId);
    const allowances = this._getAllowances(employeeId, includeDetails);
    const deductions = this._getDeductions(employeeId, includeDetails);

    const grossPay = baseSalary + allowances.total;
    const netPay = grossPay - deductions.total;

    return {
      ...baseData,
      status: "已發放",
      currency: "TWD",
      baseSalary: baseSalary,
      allowances: allowances,
      deductions: deductions,
      grossPay: grossPay,
      netPay: netPay,
      ...(includeDetails && {
        paymentMethod: "銀行轉帳",
        bankAccount: "***-***-****56", // 部分遮蔽
        payrollCycle: "月薪",
      }),
    };
  }

  /**
   * 獲取基本薪資
   */
  _getBaseSalary(employeeId) {
    const salaryMap = {
      A123456: 65000, // 資深軟體工程師
      A123457: 45000, // 人資專員
      A123458: 85000, // 技術主管
      A123459: 55000, // 會計師
    };
    return salaryMap[employeeId] || 50000;
  }

  /**
   * 獲取津貼資料
   */
  _getAllowances(employeeId, includeDetails) {
    const items = [
      { name: "交通津貼", amount: 3000 },
      { name: "餐費津貼", amount: 2500 },
      { name: "績效獎金", amount: Math.floor(Math.random() * 10000) },
    ];

    // 主管額外津貼
    if (employeeId === "A123458") {
      items.push({ name: "主管津貼", amount: 8000 });
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return includeDetails ? { items, total } : { total };
  }

  /**
   * 獲取扣除項目
   */
  _getDeductions(employeeId, includeDetails) {
    const baseSalary = this._getBaseSalary(employeeId);
    const items = [
      { name: "勞保費", amount: Math.floor(baseSalary * 0.105) },
      { name: "健保費", amount: Math.floor(baseSalary * 0.0469) },
      { name: "所得稅", amount: Math.floor(baseSalary * 0.05) },
      { name: "退休金提撥", amount: Math.floor(baseSalary * 0.06) },
    ];

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return includeDetails ? { items, total } : { total };
  }

  /**
   * 獲取發薪日期
   */
  _getPaymentDate(period) {
    const [year, month] = period.split("-").map(Number);
    // 假設每月5號發薪
    return new Date(year, month - 1, 5).toISOString().split("T")[0];
  }

  /**
   * 獲取薪資處理狀態
   */
  _getPayrollStatus(period) {
    const [year, month] = period.split("-").map(Number);
    const currentDate = new Date();
    const paymentDate = new Date(year, month - 1, 5);

    if (paymentDate > currentDate) {
      return {
        status: "處理中",
        description:
          "薪資計算中，預計發放日期：" +
          paymentDate.toISOString().split("T")[0],
      };
    } else {
      return {
        status: "已發放",
        description:
          "薪資已於 " + paymentDate.toISOString().split("T")[0] + " 發放",
      };
    }
  }

  /**
   * 獲取稅務資訊
   */
  _getTaxInfo(salaryData) {
    if (!salaryData.grossPay) return null;

    return {
      taxableIncome: salaryData.grossPay,
      incomeTax:
        salaryData.deductions.items?.find(item => item.name === "所得稅")
          ?.amount || 0,
      taxBracket: "20%",
      yearToDateTax:
        salaryData.deductions.items?.find(item => item.name === "所得稅")
          ?.amount * 12 || 0,
    };
  }

  /**
   * 獲取保險資訊
   */
  _getInsuranceInfo(salaryData) {
    if (!salaryData.deductions || !salaryData.deductions.items) return null;

    return {
      laborInsurance:
        salaryData.deductions.items.find(item => item.name === "勞保費")
          ?.amount || 0,
      healthInsurance:
        salaryData.deductions.items.find(item => item.name === "健保費")
          ?.amount || 0,
      pensionContribution:
        salaryData.deductions.items.find(item => item.name === "退休金提撥")
          ?.amount || 0,
    };
  }
}
