/**
 * Mann-Whitney U 檢定 MCP 工具
 *
 * 執行非參數雙樣本獨立檢定，適用於資料不符合常態分佈假設的情況
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

/**
 * Mann-Whitney U 檢定工具
 */
export class PerformMannWhitneyTool extends BaseTool {
  constructor() {
    super(
      "perform_mann_whitney",
      "執行 Mann-Whitney U 檢定 (非參數雙樣本獨立檢定)",
      {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              sample1: {
                type: "array",
                items: { type: "number" },
                description: "第一組樣本數據",
                minItems: 3,
              },
              sample2: {
                type: "array",
                items: { type: "number" },
                description: "第二組樣本數據",
                minItems: 3,
              },
              alpha: {
                type: "number",
                description: "顯著水準",
                default: 0.05,
                minimum: 0.001,
                maximum: 0.1,
              },
              alternative: {
                type: "string",
                enum: ["two-sided", "less", "greater"],
                description: "對立假設類型",
                default: "two-sided",
              },
            },
            required: ["sample1", "sample2"],
          },
          context: {
            type: "object",
            properties: {
              scenario: {
                type: "string",
                description: "分析場景 (medical, education, quality, etc.)",
                examples: ["medical", "education", "quality", "business"],
              },
              description: {
                type: "string",
                description: "研究問題描述",
              },
              variable_names: {
                type: "object",
                properties: {
                  sample1_name: {
                    type: "string",
                    description: "第一組數據名稱",
                  },
                  sample2_name: {
                    type: "string",
                    description: "第二組數據名稱",
                  },
                },
              },
            },
          },
        },
        required: ["data"],
      },
      {
        cacheable: false,
        cacheExpiry: 60 * 5, // 5 分鐘
      },
    );
  }

  /**
   * 執行工具
   * @param {Object} params - 工具參數
   */
  async _execute(params) {
    try {
      logger.info("收到 Mann-Whitney U 檢定請求", {
        sample1Size: params.data.sample1?.length,
        sample2Size: params.data.sample2?.length,
        scenario: params.context?.scenario,
      });

      // 驗證輸入數據
      if (!params.data.sample1 || params.data.sample1.length < 3) {
        throw new ToolExecutionError(
          "sample1 必須包含至少 3 個數值",
          ToolErrorType.VALIDATION_ERROR,
        );
      }

      if (!params.data.sample2 || params.data.sample2.length < 3) {
        throw new ToolExecutionError(
          "sample2 必須包含至少 3 個數值",
          ToolErrorType.VALIDATION_ERROR,
        );
      }

      // 執行 Mann-Whitney U 檢定
      const result = await statService.performMannWhitneyTest(
        params.data,
        params.context || {},
      );

      // 生成詳細報告
      const report = this.generateMannWhitneyReport(result, params);

      // 記錄執行資訊
      logger.info("Mann-Whitney U 檢定執行成功", {
        toolName: this.name,
        pValue: result.p_value,
        significant: result.reject_null,
        effectSize: result.effect_size,
      });

      return {
        success: true,
        data: {
          result: result,
          report: report,
        },
      };
    } catch (error) {
      // 記錄錯誤
      logger.error("Mann-Whitney U 檢定執行失敗", {
        toolName: this.name,
        params: JSON.stringify(params),
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `Mann-Whitney U 檢定執行失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }

  /**
   * 生成 Mann-Whitney U 檢定詳細報告
   * @param {Object} result - 統計結果
   * @param {Object} params - 輸入參數
   * @returns {string} 格式化報告
   */
  generateMannWhitneyReport(result, params) {
    const alpha = params.data.alpha || 0.05;
    const isSignificant = result.reject_null;

    let report = `# Mann-Whitney U 檢定分析報告\n\n`;

    // 基本信息
    report += `## 📊 檢定類型\n`;
    report += `**類型**: Mann-Whitney U 檢定 (非參數雙樣本獨立檢定)\n`;
    report += `**顯著水準**: α = ${alpha}\n`;
    report += `**對立假設**: ${this.getAlternativeDescription(params.data.alternative || "two-sided")}\n\n`;

    // 樣本統計
    report += `## 📈 樣本統計\n`;
    report += `**樣本1大小**: ${params.data.sample1.length}\n`;
    report += `**樣本1中位數**: ${this.getMedian(params.data.sample1).toFixed(4)}\n`;
    report += `**樣本2大小**: ${params.data.sample2.length}\n`;
    report += `**樣本2中位數**: ${this.getMedian(params.data.sample2).toFixed(4)}\n`;
    report += `**等級和1**: ${result.rank_sum1.toFixed(2)}\n`;
    report += `**等級和2**: ${result.rank_sum2.toFixed(2)}\n\n`;

    // 檢定結果
    report += `## 🔍 檢定結果\n`;
    report += `**U統計量**: ${result.u_statistic.toFixed(4)}\n`;
    if (result.z_score) {
      report += `**Z分數**: ${result.z_score.toFixed(4)}\n`;
    }
    report += `**p值**: ${result.p_value.toFixed(6)}\n`;
    report += `**結果**: ${isSignificant ? "🔴 拒絕虛無假設（顯著）" : "🟢 不拒絕虛無假設（不顯著）"}\n\n`;

    // 效果量
    if (result.effect_size) {
      report += `## 💪 效果量\n`;
      report += `**效果量 (r)**: ${result.effect_size.toFixed(3)}\n`;
      report += `**效果大小**: ${this.getEffectSizeInterpretation(result.effect_size)}\n\n`;
    }

    // 解釋
    report += `## 💡 結果解釋\n`;
    if (params.context?.description) {
      report += `**研究問題**: ${params.context.description}\n\n`;
    }

    report += result.interpretation;

    // 使用建議
    report += `\n\n## 📋 使用建議\n`;
    report += `- Mann-Whitney U 檢定適用於資料不符合常態分佈假設的情況\n`;
    report += `- 此檢定比較兩組的分佈位置，而非平均數\n`;
    report += `- 不需要假設資料的分佈形狀，但假設兩組的分佈形狀相似\n`;
    
    if (!isSignificant) {
      report += `- 建議檢查樣本大小是否足夠，或考慮實際差異的重要性\n`;
    }

    return report;
  }

  /**
   * 獲取對立假設描述
   */
  getAlternativeDescription(alternative) {
    const descriptions = {
      "two-sided": "雙尾檢定（兩組分佈不同）",
      less: "左尾檢定（樣本1 < 樣本2）",
      greater: "右尾檢定（樣本1 > 樣本2）",
    };
    return descriptions[alternative] || alternative;
  }

  /**
   * 計算中位數
   */
  getMedian(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * 解釋效果量大小
   */
  getEffectSizeInterpretation(r) {
    const absR = Math.abs(r);
    if (absR < 0.1) return "微小效果";
    if (absR < 0.3) return "小效果";
    if (absR < 0.5) return "中等效果";
    return "大效果";
  }
}