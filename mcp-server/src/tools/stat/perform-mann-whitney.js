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
                  enum: ["boxplot", "histogram", "rank_plot"],
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

      // 處理視覺化需求
      const visualizations = {};
      if (params.visualizations?.include_charts && 
          params.visualizations?.chart_types?.length > 0) {
        
        logger.info("開始生成 Mann-Whitney U 視覺化圖表", {
          chartTypes: params.visualizations.chart_types,
          generateImage: params.visualizations.generate_image
        });

        for (const chartType of params.visualizations.chart_types) {
          try {
            switch (chartType) {
              case 'boxplot':
                visualizations.boxplot = await this.createBoxplot(
                  params.data,
                  params.visualizations,
                  params.context
                );
                break;
              case 'histogram':
                visualizations.histogram = await this.createHistogram(
                  params.data,
                  params.visualizations,
                  params.context
                );
                break;
              case 'rank_plot':
                visualizations.rank_plot = await this.createRankPlot(
                  params.data,
                  result,
                  params.visualizations,
                  params.context
                );
                break;
            }
          } catch (vizError) {
            logger.warn(`Mann-Whitney 視覺化圖表 ${chartType} 創建失敗`, { error: vizError.message });
            visualizations[chartType] = { error: vizError.message };
          }
        }
      }

      // 生成詳細報告
      const report = this.generateMannWhitneyReport(result, params, visualizations);

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
          visualizations: Object.keys(visualizations).length > 0 ? visualizations : null,
        },
        _meta: {
          tool_type: "mann_whitney_with_visualization",
          has_visualizations: Object.keys(visualizations).length > 0,
          chart_types: params.visualizations?.chart_types || [],
          image_data: this.extractImageData(visualizations),
          statistical_result: {
            u_statistic: result.u_statistic,
            p_value: result.p_value,
            effect_size: result.effect_size,
            reject_null: result.reject_null
          }
        }
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
   * @param {Object} visualizations - 視覺化結果
   * @returns {string} 格式化報告
   */
  generateMannWhitneyReport(result, params, visualizations = {}) {
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

    // 視覺化資訊
    if (Object.keys(visualizations).length > 0) {
      report += `\n## 📊 視覺化圖表\n\n`;
      
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
      
      report += `\n💡 **視覺化說明**: 盒鬚圖有助於直觀比較兩組數據的分佈位置和變異性\n`;
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

  /**
   * 創建盒鬚圖以比較兩組分佈
   */
  async createBoxplot(data, visualizationOptions, context) {
    try {
      const requestData = {
        groups: [data.sample1, data.sample2],
        group_labels: [
          context?.variable_names?.sample1_name || "樣本1",
          context?.variable_names?.sample2_name || "樣本2"
        ],
        title: `${context?.variable_names?.sample1_name || '兩組'}數據分佈比較`,
        y_axis_label: context?.variable_names?.sample1_name || "數值",
        generate_image: visualizationOptions.generate_image || false,
        image_format: visualizationOptions.image_format || "png",
        figsize: [10, 6],
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
      logger.error("創建 Mann-Whitney 盒鬚圖失敗", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 創建直方圖以檢查數據分佈
   */
  async createHistogram(data, visualizationOptions, context) {
    try {
      // 組合兩個樣本的數據進行整體分佈檢查
      const combinedData = [...data.sample1, ...data.sample2];

      const requestData = {
        values: combinedData,
        bins: 15,
        title: `${context?.variable_names?.sample1_name || '數據'}整體分佈`,
        x_axis_label: context?.variable_names?.sample1_name || "數值",
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
      logger.error("創建 Mann-Whitney 直方圖失敗", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 創建等級圖以顯示 Mann-Whitney 檢定的等級分佈
   */
  async createRankPlot(data, result, visualizationOptions, context) {
    try {
      // 注意: 目前 sfda_stat 後端可能還沒有等級圖 API
      // 這裡提供一個框架，未來可以擴展
      logger.warn("等級圖功能尚未實作於後端服務");
      return { 
        error: "等級圖功能尚未實作",
        placeholder: true 
      };
    } catch (error) {
      logger.error("創建等級圖失敗", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 獲取圖表類型描述
   */
  getChartTypeDescription(chartType) {
    const descriptions = {
      boxplot: "盒鬚圖 (組間分佈比較)",
      histogram: "直方圖 (整體分佈檢查)",
      rank_plot: "等級圖 (等級分佈顯示)"
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