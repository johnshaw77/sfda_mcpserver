/**
 * Kruskal-Wallis 檢定 MCP 工具
 *
 * 執行非參數多組比較檢定，適用於三個或以上組別且資料不符合常態分佈假設的情況
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

/**
 * Kruskal-Wallis 檢定工具
 */
export class PerformKruskalWallisTool extends BaseTool {
  constructor() {
    super(
      "perform_kruskal_wallis",
      "執行 Kruskal-Wallis 檢定 (非參數多組比較檢定)",
      {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              groups: {
                type: "array",
                items: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 3,
                },
                description: "各組數據陣列",
                minItems: 3,
              },
              alpha: {
                type: "number",
                description: "顯著水準",
                default: 0.05,
                minimum: 0.001,
                maximum: 0.1,
              },
            },
            required: ["groups"],
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
              group_names: {
                type: "array",
                items: { type: "string" },
                description: "各組名稱列表",
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
      logger.info("收到 Kruskal-Wallis 檢定請求", {
        groupCount: params.data.groups?.length,
        groupSizes: params.data.groups?.map(g => g.length),
        scenario: params.context?.scenario,
      });

      // 驗證輸入數據
      if (!params.data.groups || params.data.groups.length < 3) {
        throw new ToolExecutionError(
          "至少需要 3 個組別進行比較",
          ToolErrorType.VALIDATION_ERROR,
        );
      }

      // 檢查每組至少有3個數值
      for (let i = 0; i < params.data.groups.length; i++) {
        if (!params.data.groups[i] || params.data.groups[i].length < 3) {
          throw new ToolExecutionError(
            `第 ${i + 1} 組必須包含至少 3 個數值`,
            ToolErrorType.VALIDATION_ERROR,
          );
        }
      }

      // 執行 Kruskal-Wallis 檢定
      const result = await statService.performKruskalWallisTest(
        params.data,
        params.context || {},
      );

      // 生成詳細報告
      const report = this.generateKruskalWallisReport(result, params);

      // 記錄執行資訊
      logger.info("Kruskal-Wallis 檢定執行成功", {
        toolName: this.name,
        pValue: result.p_value,
        significant: result.reject_null,
        effectSize: result.effect_size,
        nGroups: result.n_groups,
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
      logger.error("Kruskal-Wallis 檢定執行失敗", {
        toolName: this.name,
        params: JSON.stringify(params),
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `Kruskal-Wallis 檢定執行失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }

  /**
   * 生成 Kruskal-Wallis 檢定詳細報告
   * @param {Object} result - 統計結果
   * @param {Object} params - 輸入參數
   * @returns {string} 格式化報告
   */
  generateKruskalWallisReport(result, params) {
    const alpha = params.data.alpha || 0.05;
    const isSignificant = result.reject_null;

    let report = `# Kruskal-Wallis 檢定分析報告\n\n`;

    // 基本信息
    report += `## 📊 檢定類型\n`;
    report += `**類型**: Kruskal-Wallis 檢定 (非參數多組比較檢定)\n`;
    report += `**顯著水準**: α = ${alpha}\n`;
    report += `**組別數量**: ${result.n_groups}\n`;
    report += `**自由度**: ${result.degrees_of_freedom}\n\n`;

    // 樣本統計
    report += `## 📈 各組統計\n`;
    params.data.groups.forEach((group, index) => {
      const groupName = params.context?.group_names?.[index] || `組別 ${index + 1}`;
      report += `**${groupName}**:\n`;
      report += `  - 樣本大小: ${group.length}\n`;
      report += `  - 中位數: ${this.getMedian(group).toFixed(4)}\n`;
      report += `  - 四分位距: ${this.getIQR(group).toFixed(4)}\n`;
      report += `  - 平均等級: ${this.getMeanRank(group, params.data.groups).toFixed(2)}\n\n`;
    });

    // 檢定結果
    report += `## 🔍 檢定結果\n`;
    report += `**H統計量**: ${result.h_statistic.toFixed(4)}\n`;
    report += `**p值**: ${result.p_value.toFixed(6)}\n`;
    report += `**結果**: ${isSignificant ? "🔴 拒絕虛無假設（顯著）" : "🟢 不拒絕虛無假設（不顯著）"}\n\n`;

    // 效果量
    if (result.effect_size) {
      report += `## 💪 效果量\n`;
      report += `**效果量 (η²)**: ${result.effect_size.toFixed(3)}\n`;
      report += `**效果大小**: ${this.getEtaSquaredInterpretation(result.effect_size)}\n\n`;
    }

    // 組間比較
    report += `## 📊 組間比較\n`;
    const medians = params.data.groups.map(group => this.getMedian(group));
    const maxMedian = Math.max(...medians);
    const minMedian = Math.min(...medians);
    const maxIndex = medians.indexOf(maxMedian);
    const minIndex = medians.indexOf(minMedian);
    
    const maxGroupName = params.context?.group_names?.[maxIndex] || `組別 ${maxIndex + 1}`;
    const minGroupName = params.context?.group_names?.[minIndex] || `組別 ${minIndex + 1}`;
    
    report += `**最高中位數**: ${maxGroupName} (${maxMedian.toFixed(4)})\n`;
    report += `**最低中位數**: ${minGroupName} (${minMedian.toFixed(4)})\n`;
    report += `**中位數差異**: ${(maxMedian - minMedian).toFixed(4)}\n\n`;

    // 解釋
    report += `## 💡 結果解釋\n`;
    if (params.context?.description) {
      report += `**研究問題**: ${params.context.description}\n\n`;
    }

    report += result.interpretation;

    // 後續分析建議
    if (isSignificant) {
      report += `\n\n## 📋 後續分析建議\n`;
      report += `- 由於檢定結果顯著，建議進行多重比較分析\n`;
      report += `- 可使用 Dunn's test 進行組間兩兩比較\n`;
      report += `- 考慮使用 Bonferroni 或 FDR 校正多重比較的 p 值\n`;
      report += `- 檢視箱形圖或其他視覺化工具進一步了解組間差異\n`;
    } else {
      report += `\n\n## 📋 使用建議\n`;
      report += `- Kruskal-Wallis 檢定適用於資料不符合 ANOVA 假設的情況\n`;
      report += `- 此檢定比較各組的分佈位置，而非平均數\n`;
      report += `- 假設各組分佈形狀相似，但位置可能不同\n`;
      report += `- 建議檢查樣本大小是否足夠，或考慮實際差異的重要性\n`;
    }

    return report;
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
   * 計算四分位距 (IQR)
   */
  getIQR(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    return sorted[q3Index] - sorted[q1Index];
  }

  /**
   * 計算平均等級
   */
  getMeanRank(group, allGroups) {
    // 合併所有組的數據並排序
    const combined = [];
    let groupIndex = 0;
    
    allGroups.forEach((g, gIndex) => {
      g.forEach(value => {
        combined.push({ value, group: gIndex });
      });
    });
    
    combined.sort((a, b) => a.value - b.value);
    
    // 計算等級
    const ranks = {};
    combined.forEach((item, index) => {
      const groupKey = item.group;
      if (!ranks[groupKey]) ranks[groupKey] = [];
      ranks[groupKey].push(index + 1);
    });
    
    // 找到目標組的索引
    const targetGroupIndex = allGroups.indexOf(group);
    const groupRanks = ranks[targetGroupIndex] || [];
    
    return groupRanks.length > 0 
      ? groupRanks.reduce((sum, rank) => sum + rank, 0) / groupRanks.length
      : 0;
  }

  /**
   * 解釋 Eta 平方效果量大小
   */
  getEtaSquaredInterpretation(etaSquared) {
    if (etaSquared < 0.01) return "微小效果";
    if (etaSquared < 0.06) return "小效果";
    if (etaSquared < 0.14) return "中等效果";
    return "大效果";
  }
}