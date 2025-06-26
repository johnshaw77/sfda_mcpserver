/**
 * ANOVA 檢定 MCP 工具
 *
 * 支援單因子變異數分析
 * 提供智能數據分析和結果解釋
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

/**
 * ANOVA 檢定工具
 */
export class PerformANOVATool extends BaseTool {
  constructor() {
    super(
      "perform_anova",
      "執行單因子變異數分析 (One-way ANOVA)",
      {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              groups: {
                type: "array",
                description: "各組的數據陣列",
                items: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                },
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
            required: ["groups"],
          },
          context: {
            type: "object",
            properties: {
              scenario: {
                type: "string",
                description:
                  "分析場景 (medical, education, agriculture, quality, etc.)",
                examples: [
                  "medical",
                  "education",
                  "agriculture",
                  "quality",
                  "psychology",
                ],
              },
              hypothesis: {
                type: "string",
                description: "研究假設",
              },
              variables: {
                type: "object",
                description: "變數名稱",
                properties: {
                  dependent: { type: "string", description: "依變數名稱" },
                  independent: { type: "string", description: "自變數名稱" },
                  group_names: {
                    type: "array",
                    items: { type: "string" },
                    description: "各組名稱",
                  },
                },
              },
            },
          },
          visualizations: {
            type: "object",
            properties: {
              include_charts: {
                type: "boolean",
                description: "是否包含統計視覺化圖表",
                default: false,
              },
              chart_types: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["boxplot", "histogram", "residual_plot"],
                },
                description: "需要生成的圖表類型",
                default: [],
              },
              generate_image: {
                type: "boolean",
                description: "是否生成 Base64 圖片",
                default: false,
              },
              image_format: {
                type: "string",
                description: "圖片格式",
                enum: ["png", "jpg", "svg"],
                default: "png",
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
      logger.info("執行 ANOVA 檢定", {
        groupCount: args.data?.groups?.length,
        scenario: args.context?.scenario,
      });

      // 驗證輸入
      this.validateInput(args);

      // 準備分析參數
      const analysisParams = this.prepareAnalysisParams(args);

      // 調用統計服務
      const result = await statService.performANOVATest(analysisParams);

      // 處理視覺化需求
      const visualizations = {};
      if (args.visualizations?.include_charts && 
          args.visualizations?.chart_types?.length > 0) {
        
        logger.info("開始生成 ANOVA 視覺化圖表", {
          chartTypes: args.visualizations.chart_types,
          generateImage: args.visualizations.generate_image
        });

        for (const chartType of args.visualizations.chart_types) {
          try {
            switch (chartType) {
              case 'boxplot':
                visualizations.boxplot = await this.createBoxplot(
                  args.data,
                  args.visualizations,
                  args.context
                );
                break;
              case 'histogram':
                visualizations.histogram = await this.createHistogram(
                  args.data,
                  args.visualizations,
                  args.context
                );
                break;
              case 'residual_plot':
                visualizations.residual_plot = await this.createResidualPlot(
                  args.data,
                  result,
                  args.visualizations,
                  args.context
                );
                break;
            }
          } catch (vizError) {
            logger.warn(`ANOVA 視覺化圖表 ${chartType} 創建失敗`, { error: vizError.message });
            visualizations[chartType] = { error: vizError.message };
          }
        }
      }

      // 生成情境化報告
      const report = this.generateANOVAReport(result, args, visualizations);

      return {
        content: [
          {
            type: "text",
            text: report,
          },
        ],
        _meta: {
          tool_type: "anova_with_visualization",
          has_visualizations: Object.keys(visualizations).length > 0,
          chart_types: args.visualizations?.chart_types || [],
          image_data: this.extractImageData(visualizations),
          statistical_result: {
            f_statistic: result.f_statistic,
            p_value: result.p_value,
            effect_size: result.effect_size
          }
        }
      };
    } catch (error) {
      logger.error("ANOVA 檢定失敗", { error: error.message, args });

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      throw new ToolExecutionError(
        `ANOVA 檢定失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
      );
    }
  }

  /**
   * 驗證輸入參數
   * @param {Object} args - 輸入參數
   */
  validateInput(args) {
    if (!args.data || !args.data.groups) {
      throw new ToolExecutionError(
        "groups 參數不能為空",
        ToolErrorType.INVALID_INPUT,
      );
    }

    const groups = args.data.groups;

    // 檢查組數
    if (!Array.isArray(groups) || groups.length < 2) {
      throw new ToolExecutionError(
        "至少需要 2 組數據進行 ANOVA 分析",
        ToolErrorType.INVALID_INPUT,
      );
    }

    // 檢查每組數據
    groups.forEach((group, index) => {
      if (!Array.isArray(group) || group.length < 2) {
        throw new ToolExecutionError(
          `第 ${index + 1} 組至少需要 2 個數據點`,
          ToolErrorType.INVALID_INPUT,
        );
      }

      if (group.some(val => !Number.isFinite(val))) {
        throw new ToolExecutionError(
          `第 ${index + 1} 組包含無效數字`,
          ToolErrorType.INVALID_INPUT,
        );
      }
    });
  }

  /**
   * 準備分析參數
   * @param {Object} args - 輸入參數
   * @returns {Object} 分析參數
   */
  prepareAnalysisParams(args) {
    const { groups, alpha = 0.05 } = args.data;

    return {
      groups,
      alpha,
    };
  }

  /**
   * 生成 ANOVA 檢定報告
   * @param {Object} result - 統計結果
   * @param {Object} args - 原始參數
   * @param {Object} visualizations - 視覺化結果
   * @returns {string} 格式化報告
   */
  generateANOVAReport(result, args, visualizations = {}) {
    const { scenario, hypothesis, variables } = args.context || {};

    let report = "";

    // 標題
    report += "# 📊 單因子變異數分析 (One-way ANOVA) 結果\n\n";

    // 場景資訊
    if (scenario) {
      report += `**分析場景**: ${this.getScenarioDescription(scenario)}\n\n`;
    }

    if (hypothesis) {
      report += `**研究假設**: ${hypothesis}\n\n`;
    }

    if (variables) {
      report += "## 🏷️ 變數定義\n\n";
      if (variables.dependent) {
        report += `- **依變數**: ${variables.dependent}\n`;
      }
      if (variables.independent) {
        report += `- **自變數**: ${variables.independent}\n`;
      }
      if (variables.group_names) {
        report += `- **組別**: ${variables.group_names.join(", ")}\n`;
      }
      report += "\n";
    }

    // 檢定假設
    report += "## 🔍 統計假設\n\n";
    report += "- **虛無假設 (H₀)**: 所有組別的平均數相等\n";
    report += "- **對立假設 (H₁)**: 至少有一組的平均數不等於其他組\n\n";

    // 描述性統計
    report += "## 📈 描述性統計\n\n";
    report += this.formatDescriptiveStats(result, args);

    // 統計量
    report += "## 📊 ANOVA 統計量\n\n";
    report += `- **F 統計量**: ${result.f_statistic.toFixed(4)}\n`;
    report += `- **分子自由度 (df₁)**: ${result.df_between}\n`;
    report += `- **分母自由度 (df₂)**: ${result.df_within}\n`;
    report += `- **p 值**: ${this.formatPValue(result.p_value)}\n`;
    report += `- **顯著水準 (α)**: ${args.data.alpha || 0.05}\n\n`;

    // 決策
    report += "## 🎯 統計決策\n\n";
    const isSignificant = result.p_value < (args.data.alpha || 0.05);

    if (isSignificant) {
      report += "**結論**: 拒絕虛無假設 ❌\n\n";
      report += "至少有一組的平均數與其他組存在**顯著差異**。\n\n";
    } else {
      report += "**結論**: 無法拒絕虛無假設 ✅\n\n";
      report += "所有組別的平均數之間**無顯著差異**。\n\n";
    }

    // 效果量
    if (result.effect_size !== undefined && result.effect_size !== null) {
      report += "## 📏 效果量\n\n";
      report += `- **η² (Eta squared)**: ${result.effect_size.toFixed(4)}\n`;
      
      // 使用後端提供的效果量解釋，若無則使用本地解釋
      const interpretation = result.effect_size_interpretation || this.interpretEtaSquared(result.effect_size);
      report += `- **效果大小**: ${interpretation}\n\n`;
    }

    // ANOVA 表
    if (result.anova_table) {
      report += "## 📋 ANOVA 表\n\n";
      report += this.formatANOVATable(result.anova_table);
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

    // 視覺化資訊
    if (Object.keys(visualizations).length > 0) {
      report += "\n## 📊 視覺化圖表\n\n";
      
      Object.keys(visualizations).forEach(chartType => {
        const viz = visualizations[chartType];
        if (viz.error) {
          report += `- **${this.getChartTypeDescription(chartType)}**: ⚠️ 生成失敗 (${viz.error})\n`;
        } else {
          report += `- **${this.getChartTypeDescription(chartType)}**: ✅ 已生成`;
          if (viz.has_image) {
            report += ` (包含 ${viz.image_format?.toUpperCase()} 圖片)`;
          }
          report += `\n`;
        }
      });
      
      report += `\n💡 **視覺化說明**: 圖表有助於檢查 ANOVA 假設並提供直觀的組間比較\n`;
    }

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
      agriculture: "農業研究",
      quality: "品質管控",
      psychology: "心理學研究",
      business: "商業分析",
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
   * 解釋 η² 效果大小
   * @param {number} etaSquared - η² 值
   * @returns {string} 效果大小描述
   */
  interpretEtaSquared(etaSquared) {
    if (etaSquared < 0.01) return "微小";
    if (etaSquared < 0.06) return "小";
    if (etaSquared < 0.14) return "中等";
    return "大";
  }

  /**
   * 格式化描述性統計
   * @param {Object} result - 統計結果
   * @param {Object} args - 原始參數
   * @returns {string} 格式化的描述性統計
   */
  formatDescriptiveStats(result, args) {
    const { groups } = args.data;
    const { group_names } = args.context?.variables || {};

    let table = "| 組別 | 樣本數 | 平均數 | 標準差 | 標準誤 |\n";
    table += "|------|--------|--------|--------|--------|\n";

    if (result.group_stats) {
      result.group_stats.forEach((stats, i) => {
        const groupName = group_names?.[i] || `組別 ${i + 1}`;
        table += `| ${groupName} | ${stats.n} | ${stats.mean.toFixed(3)} | ${stats.std.toFixed(3)} | ${stats.se.toFixed(3)} |\n`;
      });
    } else {
      // 從原始數據計算
      groups.forEach((group, i) => {
        const groupName = group_names?.[i] || `組別 ${i + 1}`;
        const n = group.length;
        const mean = group.reduce((sum, val) => sum + val, 0) / n;
        const variance =
          group.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          (n - 1);
        const std = Math.sqrt(variance);
        const se = std / Math.sqrt(n);

        table += `| ${groupName} | ${n} | ${mean.toFixed(3)} | ${std.toFixed(3)} | ${se.toFixed(3)} |\n`;
      });
    }

    return table + "\n";
  }

  /**
   * 格式化 ANOVA 表
   * @param {Object} anovaTable - ANOVA 表數據
   * @returns {string} 格式化的 ANOVA 表
   */
  formatANOVATable(anovaTable) {
    let table = "| 變異來源 | 平方和 | 自由度 | 均方 | F 值 | p 值 |\n";
    table += "|----------|--------|--------|------|------|------|\n";

    table += `| 組間 | ${anovaTable.ss_between.toFixed(3)} | ${anovaTable.df_between} | ${anovaTable.ms_between.toFixed(3)} | ${anovaTable.f_statistic.toFixed(3)} | ${this.formatPValue(anovaTable.p_value)} |\n`;
    table += `| 組內 | ${anovaTable.ss_within.toFixed(3)} | ${anovaTable.df_within} | ${anovaTable.ms_within.toFixed(3)} | - | - |\n`;
    table += `| 總和 | ${anovaTable.ss_total.toFixed(3)} | ${anovaTable.df_total} | - | - | - |\n`;

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

    let interpretation = "## 🎭 結果解釋\n\n";

    if (scenario === "medical") {
      interpretation += isSignificant
        ? "不同治療方法對於治療效果存在顯著差異，建議進行事後檢定找出具體差異。\n\n"
        : "不同治療方法的效果無顯著差異，各種治療方法的效果可能相似。\n\n";
    } else if (scenario === "education") {
      interpretation += isSignificant
        ? "不同教學方法對於學習成果存在顯著影響，部分教學方法效果較佳。\n\n"
        : "不同教學方法對於學習成果無顯著差異，各種教學方法效果相當。\n\n";
    } else if (scenario === "agriculture") {
      interpretation += isSignificant
        ? "不同處理方式對於產量或品質存在顯著影響，建議採用效果較佳的處理方式。\n\n"
        : "不同處理方式對於產量或品質無顯著影響，各種處理方式效果相當。\n\n";
    } else if (scenario === "quality") {
      interpretation += isSignificant
        ? "不同生產條件對於產品品質存在顯著影響，需要調整生產流程。\n\n"
        : "不同生產條件對於產品品質無顯著影響，目前的生產流程是穩定的。\n\n";
    } else {
      // 一般性解釋
      interpretation += isSignificant
        ? "各組之間存在顯著差異，組別是影響結果的重要因子。\n\n"
        : "各組之間無顯著差異，組別對結果的影響不明顯。\n\n";
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

    // 檢查常態性
    if (result.normality_tests) {
      checks += "📊 **常態性檢定**:\n";
      result.normality_tests.forEach((test, i) => {
        const groupName =
          args.context?.variables?.group_names?.[i] || `組別 ${i + 1}`;
        checks += `- ${groupName}: p = ${this.formatPValue(test.p_value)} ${test.p_value > 0.05 ? "✅" : "⚠️"}\n`;
      });
      checks += "\n";
    } else {
      checks += "⚠️ **常態性**: 請確認各組數據近似常態分佈。\n\n";
    }

    // 檢查變異數同質性
    if (result.homogeneity_test) {
      checks += `📊 **變異數同質性** (Levene's test): p = ${this.formatPValue(result.homogeneity_test.p_value)} ${result.homogeneity_test.p_value > 0.05 ? "✅" : "⚠️"}\n\n`;
    } else {
      checks += "⚠️ **變異數同質性**: 請確認各組變異數相等。\n\n";
    }

    // 檢查獨立性
    checks += "✅ **觀察獨立**: 假設每個觀察值都是獨立的。\n\n";

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
        "- 結果顯示組間存在顯著差異，建議進行事後檢定 (post-hoc tests)\n";
      recommendations +=
        "- 可考慮使用 Tukey HSD、Bonferroni 或 Scheffé 檢定找出具體差異\n";
      recommendations += "- 分析效果量以評估實際意義\n";
    } else {
      recommendations += "- 未發現顯著差異，但不等於證明各組完全相同\n";
      recommendations += "- 考慮增加樣本大小以提高檢定效力\n";
      recommendations += "- 檢查數據品質和測量準確性\n";
    }

    // 樣本大小建議
    const totalSampleSize = args.data.groups.reduce(
      (sum, group) => sum + group.length,
      0,
    );
    if (totalSampleSize < 30) {
      recommendations += "- 總樣本大小較小，建議增加樣本以提高結果的可靠性\n";
    }

    // 假設違反的建議
    if (result.homogeneity_test && result.homogeneity_test.p_value <= 0.05) {
      recommendations += "- 變異數不等，考慮使用 Welch's ANOVA 或非參數檢定\n";
    }

    if (
      result.normality_tests &&
      result.normality_tests.some(test => test.p_value <= 0.05)
    ) {
      recommendations +=
        "- 資料不符合常態分佈，考慮使用 Kruskal-Wallis 非參數檢定\n";
    }

    recommendations += "- 建議重複研究以驗證結果的穩定性\n";

    return recommendations;
  }

  /**
   * 創建盒鬚圖以進行組間比較
   */
  async createBoxplot(data, visualizationOptions, context) {
    try {
      const requestData = {
        groups: data.groups,
        group_labels: context?.variables?.group_names || 
          data.groups.map((_, i) => `組別 ${i + 1}`),
        title: `${context?.variables?.dependent || '依變數'}組間比較`,
        y_axis_label: context?.variables?.dependent || "數值",
        generate_image: visualizationOptions.generate_image || false,
        image_format: visualizationOptions.image_format || "png",
        figsize: [12, 8],
        dpi: 100,
      };

      const response = await fetch(
        "http://localhost:8000/api/v1/charts/boxplot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`盒鬚圖 API 調用失敗: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result : { error: result.reasoning };
    } catch (error) {
      logger.error("創建 ANOVA 盒鬚圖失敗", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 創建直方圖以檢查各組分佈
   */
  async createHistogram(data, visualizationOptions, context) {
    try {
      // 將所有組的數據合併進行整體分佈檢查
      const combinedData = data.groups.flat();

      const requestData = {
        values: combinedData,
        bins: 20,
        title: `${context?.variables?.dependent || '依變數'}整體分佈`,
        x_axis_label: context?.variables?.dependent || "數值",
        y_axis_label: "頻率",
        generate_image: visualizationOptions.generate_image || false,
        image_format: visualizationOptions.image_format || "png",
        figsize: [10, 6],
        dpi: 100,
      };

      const response = await fetch(
        "http://localhost:8000/api/v1/charts/histogram",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`直方圖 API 調用失敗: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result : { error: result.reasoning };
    } catch (error) {
      logger.error("創建 ANOVA 直方圖失敗", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 創建殘差圖以檢查 ANOVA 假設
   */
  async createResidualPlot(data, result, visualizationOptions, context) {
    try {
      // 注意: 目前 sfda_stat 後端可能還沒有殘差圖 API
      // 這裡提供一個框架，未來可以擴展
      logger.warn("殘差圖功能尚未實作於後端服務");
      return { 
        error: "殘差圖功能尚未實作",
        placeholder: true 
      };
    } catch (error) {
      logger.error("創建殘差圖失敗", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 獲取圖表類型描述
   */
  getChartTypeDescription(chartType) {
    const descriptions = {
      boxplot: "盒鬚圖 (組間比較)",
      histogram: "直方圖 (分佈檢查)",
      residual_plot: "殘差圖 (假設檢驗)"
    };
    return descriptions[chartType] || chartType;
  }

  /**
   * 提取圖片數據用於 _meta
   */
  extractImageData(visualizations) {
    const imageData = {};
    Object.keys(visualizations).forEach(key => {
      const viz = visualizations[key];
      if (viz.has_image && viz.image_base64) {
        imageData[key] = {
          format: viz.image_format,
          size: viz.image_base64.length
        };
      }
    });
    return Object.keys(imageData).length > 0 ? imageData : null;
  }
}
