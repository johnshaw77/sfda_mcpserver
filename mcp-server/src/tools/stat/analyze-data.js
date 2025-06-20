/**
 * 智能數據分析 MCP 工具
 *
 * 分析 CSV 數據結構並建議適合的統計檢定方法
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

/**
 * 智能數據分析工具
 */
export class AnalyzeDataTool extends BaseTool {
  constructor() {
    super(
      "analyze_data",
      "智能分析 CSV 數據結構，建議適合的統計檢定方法",
      {
        type: "object",
        properties: {
          csvData: {
            type: "string",
            description: "CSV 格式的數據內容",
          },
          context: {
            type: "object",
            properties: {
              research_question: {
                type: "string",
                description: "研究問題或分析目的",
              },
              domain: {
                type: "string",
                description: "應用領域 (medical, education, business, etc.)",
                examples: [
                  "medical",
                  "education",
                  "business",
                  "psychology",
                  "engineering",
                ],
              },
            },
          },
        },
        required: ["csvData"],
      },
      "stat",
    );
  }

  async execute(args) {
    try {
      logger.info("收到數據分析請求", {
        dataLength: args.csvData?.length,
        domain: args.context?.domain,
      });

      if (!args.csvData || args.csvData.trim().length === 0) {
        throw new ToolExecutionError(
          ToolErrorType.INVALID_INPUT,
          "CSV 數據不能為空",
        );
      }

      // 分析數據結構
      const dataStructure = await statService.analyzeDataStructure(
        args.csvData,
      );

      // 建議統計檢定
      const suggestions = await statService.suggestAppropriateTest(
        dataStructure,
        args.context || {},
      );

      // 生成分析報告
      const report = this.generateAnalysisReport(
        dataStructure,
        suggestions,
        args,
      );

      return {
        content: [
          {
            type: "text",
            text: report,
          },
        ],
      };
    } catch (error) {
      logger.error("數據分析失敗", { error: error.message, args });

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      throw new ToolExecutionError(
        ToolErrorType.EXECUTION_ERROR,
        `數據分析失敗: ${error.message}`,
      );
    }
  }

  /**
   * 生成數據分析報告
   * @param {Object} dataStructure - 數據結構分析結果
   * @param {Object} suggestions - 統計檢定建議
   * @param {Object} args - 原始參數
   * @returns {string} 格式化報告
   */
  generateAnalysisReport(dataStructure, suggestions, args) {
    let report = "";

    // 標題
    report += "# 🔍 智能數據分析報告\n\n";

    if (args.context?.research_question) {
      report += `**研究問題**: ${args.context.research_question}\n\n`;
    }

    if (args.context?.domain) {
      report += `**應用領域**: ${args.context.domain}\n\n`;
    }

    // 數據概覽
    report += "## 📊 數據概覽\n\n";
    report += `- **總行數**: ${dataStructure.rowCount} 筆記錄\n`;
    report += `- **總欄位數**: ${dataStructure.columnCount} 個變數\n\n`;

    // 變數分析
    report += "## 🏷️ 變數分析\n\n";

    const numericColumns = dataStructure.columns.filter(
      col => col.type === "numeric",
    );
    const categoricalColumns = dataStructure.columns.filter(
      col => col.type === "categorical",
    );

    if (numericColumns.length > 0) {
      report += "### 📈 數值變數\n\n";
      numericColumns.forEach((col, index) => {
        report += `${index + 1}. **${col.name}**\n`;
        report += `   - 類型: 數值型\n`;
        report += `   - 範例值: ${col.sampleValues.join(", ")}\n\n`;
      });
    }

    if (categoricalColumns.length > 0) {
      report += "### 🏷️ 分類變數\n\n";
      categoricalColumns.forEach((col, index) => {
        report += `${index + 1}. **${col.name}**\n`;
        report += `   - 類型: 分類型\n`;
        report += `   - 唯一值數量: ${col.uniqueCount}\n`;
        report += `   - 範例值: ${col.sampleValues.join(", ")}\n\n`;
      });
    }

    // 統計檢定建議
    report += "## 🎯 統計檢定建議\n\n";

    if (suggestions.suggestions && suggestions.suggestions.length > 0) {
      report += "根據數據結構分析，以下是建議的統計檢定方法：\n\n";

      suggestions.suggestions.forEach((suggestion, index) => {
        const confidence = Math.round(suggestion.confidence * 100);
        const emoji = this.getConfidenceEmoji(suggestion.confidence);

        report += `### ${index + 1}. ${this.getTestDisplayName(suggestion.test)} ${emoji}\n\n`;
        report += `- **信心度**: ${confidence}%\n`;
        report += `- **檢定類型**: ${suggestion.type}\n`;
        report += `- **建議原因**: ${suggestion.reason}\n\n`;

        // 提供具體的使用指導
        if (suggestion.test === "ttest") {
          report += this.generateTTestGuidance(suggestion, dataStructure);
        } else if (suggestion.test === "chisquare") {
          report += this.generateChiSquareGuidance(suggestion, dataStructure);
        } else if (suggestion.test === "anova") {
          report += this.generateANOVAGuidance(suggestion, dataStructure);
        }

        report += "\n";
      });

      // 最佳建議
      if (suggestions.recommendation) {
        const best = suggestions.recommendation;
        report += "## 🌟 最佳建議\n\n";
        report += `基於數據特徵，**${this.getTestDisplayName(best.test)}** 是最適合的分析方法。\n\n`;
        report += `**下一步**: 請使用 \`perform_${best.test}\` 工具進行具體分析。\n\n`;
      }
    } else {
      report +=
        "⚠️ 未能找到適合的統計檢定方法。請檢查數據格式或提供更多背景資訊。\n\n";
    }

    // 數據品質檢查
    report += "## ✅ 數據品質建議\n\n";

    const qualityChecks = this.performQualityChecks(dataStructure);
    qualityChecks.forEach(check => {
      report += `- ${check}\n`;
    });

    return report;
  }

  /**
   * 生成 T檢定使用指導
   * @param {Object} suggestion - 檢定建議
   * @param {Object} dataStructure - 數據結構
   * @returns {string} 使用指導
   */
  generateTTestGuidance(suggestion, dataStructure) {
    let guidance = "**使用指導**:\n";

    if (suggestion.type === "independent") {
      const numericCol = dataStructure.columns.find(
        col => col.type === "numeric",
      );
      const categoricalCol = dataStructure.columns.find(
        col => col.type === "categorical" && col.uniqueCount === 2,
      );

      guidance += `- 將 "${numericCol?.name}" 作為依變數\n`;
      guidance += `- 將 "${categoricalCol?.name}" 作為分組變數\n`;
      guidance += `- 使用獨立樣本 t 檢定比較兩組平均值\n`;
    } else if (suggestion.type === "paired") {
      const numericCols = dataStructure.columns
        .filter(col => col.type === "numeric")
        .slice(0, 2);
      guidance += `- 比較 "${numericCols[0]?.name}" 和 "${numericCols[1]?.name}"\n`;
      guidance += `- 使用配對 t 檢定分析前後差異\n`;
    }

    return guidance;
  }

  /**
   * 生成卡方檢定使用指導
   * @param {Object} suggestion - 檢定建議
   * @param {Object} dataStructure - 數據結構
   * @returns {string} 使用指導
   */
  generateChiSquareGuidance(suggestion, dataStructure) {
    const categoricalCols = dataStructure.columns
      .filter(col => col.type === "categorical")
      .slice(0, 2);

    let guidance = "**使用指導**:\n";
    guidance += `- 分析 "${categoricalCols[0]?.name}" 和 "${categoricalCols[1]?.name}" 的關聯性\n`;
    guidance += `- 使用卡方獨立性檢定\n`;
    guidance += `- 檢驗兩個分類變數是否相互獨立\n`;

    return guidance;
  }

  /**
   * 生成 ANOVA 使用指導
   * @param {Object} suggestion - 檢定建議
   * @param {Object} dataStructure - 數據結構
   * @returns {string} 使用指導
   */
  generateANOVAGuidance(suggestion, dataStructure) {
    const numericCol = dataStructure.columns.find(
      col => col.type === "numeric",
    );
    const groupCol = dataStructure.columns.find(
      col => col.type === "categorical" && col.uniqueCount > 2,
    );

    let guidance = "**使用指導**:\n";
    guidance += `- 將 "${numericCol?.name}" 作為依變數\n`;
    guidance += `- 將 "${groupCol?.name}" 作為因子變數 (${groupCol?.uniqueCount} 組)\n`;
    guidance += `- 使用單因子 ANOVA 比較多組平均值\n`;

    return guidance;
  }

  /**
   * 獲取檢定名稱的顯示文字
   * @param {string} testName - 檢定名稱
   * @returns {string} 顯示名稱
   */
  getTestDisplayName(testName) {
    const names = {
      ttest: "T檢定",
      chisquare: "卡方檢定",
      anova: "ANOVA 變異數分析",
    };
    return names[testName] || testName;
  }

  /**
   * 根據信心度獲取表情符號
   * @param {number} confidence - 信心度 (0-1)
   * @returns {string} 表情符號
   */
  getConfidenceEmoji(confidence) {
    if (confidence >= 0.9) return "🎯";
    if (confidence >= 0.8) return "👍";
    if (confidence >= 0.7) return "👌";
    return "🤔";
  }

  /**
   * 執行數據品質檢查
   * @param {Object} dataStructure - 數據結構
   * @returns {Array} 檢查建議
   */
  performQualityChecks(dataStructure) {
    const checks = [];

    // 檢查樣本大小
    if (dataStructure.rowCount < 30) {
      checks.push("⚠️ 樣本大小較小 (< 30)，統計檢定的效力可能不足");
    }

    // 檢查變數數量
    if (dataStructure.columnCount < 2) {
      checks.push("⚠️ 變數數量過少，可能無法進行有意義的統計分析");
    }

    // 檢查數值變數
    const numericColumns = dataStructure.columns.filter(
      col => col.type === "numeric",
    );
    if (numericColumns.length === 0) {
      checks.push("⚠️ 沒有數值變數，大部分統計檢定需要至少一個數值變數");
    }

    // 檢查分類變數的唯一值
    const categoricalColumns = dataStructure.columns.filter(
      col => col.type === "categorical",
    );
    categoricalColumns.forEach(col => {
      if (col.uniqueCount === 1) {
        checks.push(`⚠️ 分類變數 "${col.name}" 只有一個唯一值，無法用於分析`);
      }
      if (col.uniqueCount > dataStructure.rowCount * 0.5) {
        checks.push(
          `⚠️ 分類變數 "${col.name}" 的唯一值過多，可能不適合作為分組變數`,
        );
      }
    });

    if (checks.length === 0) {
      checks.push("✅ 數據品質良好，適合進行統計分析");
    }

    return checks;
  }
}
