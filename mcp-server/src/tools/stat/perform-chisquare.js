/**
 * 卡方檢定 MCP 工具
 *
 * 支援適合度檢定、獨立性檢定
 * 提供智能數據分析和結果解釋
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

/**
 * 卡方檢定工具
 */
export class PerformChiSquareTool extends BaseTool {
  constructor() {
    super(
      "perform_chisquare",
      "執行卡方檢定分析，支援適合度檢定和獨立性檢定",
      {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              observed: {
                type: "array",
                description: "觀察頻數陣列 (一維或二維陣列)",
                items: {
                  oneOf: [
                    { type: "number" },
                    { type: "array", items: { type: "number" } },
                  ],
                },
                minItems: 2,
              },
              expected: {
                type: "array",
                description: "期望頻數陣列 (適合度檢定時使用)",
                items: { type: "number" },
                minItems: 2,
              },
              alpha: {
                type: "number",
                description: "顯著水準",
                default: 0.05,
                minimum: 0.001,
                maximum: 0.1,
              },
            },
            required: ["observed"],
          },
          context: {
            type: "object",
            properties: {
              scenario: {
                type: "string",
                description:
                  "分析場景 (medical, education, quality, market, etc.)",
                examples: ["medical", "education", "quality", "market"],
              },
              hypothesis: {
                type: "string",
                description: "研究假設",
              },
              variables: {
                type: "object",
                description: "變數名稱",
                properties: {
                  variable1: { type: "string" },
                  variable2: { type: "string" },
                },
              },
            },
          },
        },
        required: ["data"],
      },
      "stat",
    );
  }

  async execute(args) {
    try {
      logger.info("執行卡方檢定", {
        observed: args.data?.observed,
        scenario: args.context?.scenario,
      });

      // 驗證輸入
      this.validateInput(args);

      // 準備分析參數
      const analysisParams = this.prepareAnalysisParams(args);

      // 調用統計服務
      const result = await statService.performChiSquareTest(analysisParams);

      // 生成情境化報告
      const report = this.generateChiSquareReport(result, args);

      return {
        content: [
          {
            type: "text",
            text: report,
          },
        ],
      };
    } catch (error) {
      logger.error("卡方檢定失敗", { error: error.message, args });

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      throw new ToolExecutionError(
        ToolErrorType.EXECUTION_ERROR,
        `卡方檢定失敗: ${error.message}`,
      );
    }
  }

  /**
   * 驗證輸入參數
   * @param {Object} args - 輸入參數
   */
  validateInput(args) {
    if (!args.data || !args.data.observed) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "觀察頻數不能為空",
      );
    }

    const observed = args.data.observed;

    // 檢查是否為有效的數字陣列
    if (!Array.isArray(observed) || observed.length < 2) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "觀察頻數至少需要 2 個值",
      );
    }

    // 檢查數值有效性
    const flattenedObserved = observed.flat();
    if (flattenedObserved.some(val => !Number.isFinite(val) || val < 0)) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "所有觀察頻數必須是非負數字",
      );
    }

    // 如果提供期望頻數，檢查其有效性
    if (args.data.expected) {
      const expected = args.data.expected;
      if (
        !Array.isArray(expected) ||
        expected.length !== flattenedObserved.length
      ) {
        throw new ToolExecutionError(
          ToolErrorType.INVALID_INPUT,
          "期望頻數的長度必須與觀察頻數一致",
        );
      }

      if (expected.some(val => !Number.isFinite(val) || val <= 0)) {
        throw new ToolExecutionError(
          ToolErrorType.INVALID_INPUT,
          "所有期望頻數必須是正數",
        );
      }
    }
  }

  /**
   * 準備分析參數
   * @param {Object} args - 輸入參數
   * @returns {Object} 分析參數
   */
  prepareAnalysisParams(args) {
    const { observed, expected, alpha = 0.05 } = args.data;

    return {
      observed,
      expected,
      alpha,
      test_type: expected ? "goodness_of_fit" : "independence",
    };
  }

  /**
   * 生成卡方檢定報告
   * @param {Object} result - 統計結果
   * @param {Object} args - 原始參數
   * @returns {string} 格式化報告
   */
  generateChiSquareReport(result, args) {
    const { scenario, hypothesis, variables } = args.context || {};
    const isGoodnessOfFit = args.data.expected !== undefined;

    let report = "";

    // 標題
    const testType = isGoodnessOfFit ? "適合度檢定" : "獨立性檢定";
    report += `# 📊 卡方${testType}結果\n\n`;

    // 場景資訊
    if (scenario) {
      report += `**分析場景**: ${this.getScenarioDescription(scenario)}\n\n`;
    }

    if (hypothesis) {
      report += `**研究假設**: ${hypothesis}\n\n`;
    }

    // 檢定類型說明
    report += "## 🔍 檢定類型\n\n";
    if (isGoodnessOfFit) {
      report += "**適合度檢定 (Goodness-of-fit test)**\n";
      report += "檢驗觀察到的頻數分佈是否符合期望的理論分佈。\n\n";
    } else {
      report += "**獨立性檢定 (Independence test)**\n";
      report += "檢驗兩個分類變數之間是否相互獨立。\n\n";
    }

    // 統計量
    report += "## 📈 統計量\n\n";
    report += `- **卡方統計量 (χ²)**: ${result.statistic.toFixed(4)}\n`;
    report += `- **自由度 (df)**: ${result.df}\n`;
    report += `- **p 值**: ${this.formatPValue(result.p_value)}\n`;
    report += `- **顯著水準 (α)**: ${args.data.alpha || 0.05}\n\n`;

    // 決策
    report += "## 🎯 統計決策\n\n";
    const isSignificant = result.p_value < (args.data.alpha || 0.05);

    if (isSignificant) {
      report += "**結論**: 拒絕虛無假設 ❌\n\n";
      if (isGoodnessOfFit) {
        report += "觀察到的頻數分佈與期望分佈有**顯著差異**。\n\n";
      } else {
        report += "兩個變數之間存在**顯著關聯**，不是相互獨立的。\n\n";
      }
    } else {
      report += "**結論**: 無法拒絕虛無假設 ✅\n\n";
      if (isGoodnessOfFit) {
        report += "觀察到的頻數分佈與期望分佈**無顯著差異**。\n\n";
      } else {
        report += "兩個變數之間**無顯著關聯**，可視為相互獨立。\n\n";
      }
    }

    // 效果量
    if (result.effect_size) {
      report += "## 📏 效果量\n\n";
      report += `- **Cramér's V**: ${result.effect_size.cramers_v.toFixed(4)}\n`;
      report += `- **效果大小**: ${this.interpretCramersV(result.effect_size.cramers_v)}\n\n`;
    }

    // 頻數表
    if (result.observed_freq && result.expected_freq) {
      report += "## 📋 頻數表\n\n";
      report += this.formatFrequencyTable(
        result.observed_freq,
        result.expected_freq,
      );
    }

    // 情境化解釋
    report += this.generateContextualInterpretation(
      result,
      args,
      isSignificant,
    );

    // 假設檢查
    report += "## ⚠️ 假設檢查\n\n";
    report += this.generateAssumptionChecks(result, args);

    // 建議
    report += "## 💡 建議\n\n";
    report += this.generateRecommendations(result, args, isSignificant);

    return report;
  }

  /**
   * 獲取場景描述
   * @param {string} scenario - 場景代碼
   * @returns {string} 場景描述
   */
  getScenarioDescription(scenario) {
    const descriptions = {
      medical: "醫學研究",
      education: "教育研究",
      quality: "品質管控",
      market: "市場研究",
      social: "社會科學研究",
    };
    return descriptions[scenario] || scenario;
  }

  /**
   * 格式化 p 值
   * @param {number} pValue - p 值
   * @returns {string} 格式化的 p 值
   */
  formatPValue(pValue) {
    if (pValue < 0.001) return "< 0.001";
    if (pValue < 0.01) return pValue.toFixed(4);
    return pValue.toFixed(3);
  }

  /**
   * 解釋 Cramér's V 效果大小
   * @param {number} cramersV - Cramér's V 值
   * @returns {string} 效果大小描述
   */
  interpretCramersV(cramersV) {
    if (cramersV < 0.1) return "微小";
    if (cramersV < 0.3) return "小";
    if (cramersV < 0.5) return "中等";
    return "大";
  }

  /**
   * 格式化頻數表
   * @param {Array} observed - 觀察頻數
   * @param {Array} expected - 期望頻數
   * @returns {string} 格式化的頻數表
   */
  formatFrequencyTable(observed, expected) {
    let table = "| | 觀察頻數 | 期望頻數 | 差異 |\n";
    table += "|---|---|---|---|\n";

    if (Array.isArray(observed[0])) {
      // 二維陣列（列聯表）
      observed.forEach((row, i) => {
        row.forEach((obs, j) => {
          const exp = expected[i][j];
          const diff = obs - exp;
          table += `| (${i + 1},${j + 1}) | ${obs} | ${exp.toFixed(1)} | ${diff > 0 ? "+" : ""}${diff.toFixed(1)} |\n`;
        });
      });
    } else {
      // 一維陣列（適合度檢定）
      observed.forEach((obs, i) => {
        const exp = expected[i];
        const diff = obs - exp;
        table += `| 類別 ${i + 1} | ${obs} | ${exp.toFixed(1)} | ${diff > 0 ? "+" : ""}${diff.toFixed(1)} |\n`;
      });
    }

    return table + "\n";
  }

  /**
   * 生成情境化解釋
   * @param {Object} result - 統計結果
   * @param {Object} args - 原始參數
   * @param {boolean} isSignificant - 是否顯著
   * @returns {string} 情境化解釋
   */
  generateContextualInterpretation(result, args, isSignificant) {
    const { scenario, variables } = args.context || {};
    const isGoodnessOfFit = args.data.expected !== undefined;

    let interpretation = "## 🎭 結果解釋\n\n";

    if (scenario === "medical") {
      if (isGoodnessOfFit) {
        interpretation += isSignificant
          ? "病例分佈與預期的流行病學模式存在顯著差異，建議進一步調查可能的原因。\n\n"
          : "病例分佈符合預期的流行病學模式，未發現異常情況。\n\n";
      } else {
        interpretation += isSignificant
          ? "治療方法與療效之間存在顯著關聯，不同治療方法的效果確實不同。\n\n"
          : "治療方法與療效之間無顯著關聯，各種治療方法的效果可能相似。\n\n";
      }
    } else if (scenario === "education") {
      interpretation += isSignificant
        ? "學習成果與教學方法之間存在顯著關聯，不同的教學策略產生不同的效果。\n\n"
        : "學習成果與教學方法之間無顯著關聯，教學方法可能不是影響學習成果的主要因素。\n\n";
    } else if (scenario === "quality") {
      interpretation += isSignificant
        ? "產品品質與生產條件之間存在顯著關聯，需要調整生產流程以改善品質。\n\n"
        : "產品品質與生產條件之間無顯著關聯，目前的生產流程是穩定的。\n\n";
    } else {
      // 一般性解釋
      if (isGoodnessOfFit) {
        interpretation += isSignificant
          ? "觀察到的資料分佈與理論期望存在顯著差異。\n\n"
          : "觀察到的資料分佈符合理論期望。\n\n";
      } else {
        interpretation += isSignificant
          ? "兩個變數之間存在顯著關聯性。\n\n"
          : "兩個變數之間無顯著關聯性。\n\n";
      }
    }

    return interpretation;
  }

  /**
   * 生成假設檢查
   * @param {Object} result - 統計結果
   * @param {Object} args - 原始參數
   * @returns {string} 假設檢查
   */
  generateAssumptionChecks(result, args) {
    let checks = "";

    // 檢查期望頻數
    if (result.expected_freq) {
      const flatExpected = result.expected_freq.flat
        ? result.expected_freq.flat()
        : result.expected_freq;
      const minExpected = Math.min(...flatExpected);

      if (minExpected < 5) {
        checks +=
          "⚠️ **期望頻數不足**: 有期望頻數小於 5，可能影響檢定的準確性。\n";
        checks += "   建議：合併類別或使用 Fisher 精確檢定。\n\n";
      } else {
        checks += "✅ **期望頻數充足**: 所有期望頻數都大於等於 5。\n\n";
      }
    }

    // 檢查獨立性
    checks += "✅ **觀察獨立**: 假設每個觀察值都是獨立的。\n\n";

    // 檢查隨機抽樣
    checks += "⚠️ **隨機抽樣**: 請確認資料是透過隨機抽樣獲得的。\n\n";

    return checks;
  }

  /**
   * 生成建議
   * @param {Object} result - 統計結果
   * @param {Object} args - 原始參數
   * @param {boolean} isSignificant - 是否顯著
   * @returns {string} 建議
   */
  generateRecommendations(result, args, isSignificant) {
    let recommendations = "";

    if (isSignificant) {
      recommendations +=
        "- 結果顯示顯著關聯/差異，建議深入分析具體的關聯模式\n";
      recommendations +=
        "- 考慮進行事後檢定 (post-hoc tests) 找出具體的差異來源\n";
      recommendations += "- 檢查是否有其他混淆變數影響結果\n";
    } else {
      recommendations += "- 結果未顯示顯著關聯/差異，但不等於證明無關聯\n";
      recommendations += "- 考慮增加樣本大小以提高檢定效力\n";
      recommendations += "- 檢查資料品質和測量準確性\n";
    }

    // 樣本大小建議
    const totalCount = Array.isArray(result.observed_freq)
      ? result.observed_freq.flat().reduce((sum, val) => sum + val, 0)
      : result.observed_freq;

    if (totalCount < 50) {
      recommendations += "- 樣本大小較小，建議增加樣本以提高結果的可靠性\n";
    }

    recommendations += "- 建議重複研究以驗證結果的穩定性\n";

    return recommendations;
  }
}
