/**
 * T檢定 MCP 工具
 *
 * 支援單樣本、雙樣本獨立、配對 t 檢定
 * 提供智能數據分析和結果解釋
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

/**
 * T檢定工具
 */
export class PerformTTestTool extends BaseTool {
  constructor() {
    super(
      "perform_ttest",
      "執行 T 檢定分析，支援單樣本、雙樣本獨立、配對檢定",
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
                minItems: 2,
              },
              sample2: {
                type: "array",
                items: { type: "number" },
                description: "第二組樣本數據 (雙樣本檢定時使用)",
                minItems: 2,
              },
              paired: {
                type: "boolean",
                description: "是否為配對檢定 (僅在雙樣本時有效)",
                default: false,
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
            required: ["sample1"],
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
                  enum: ["histogram", "boxplot", "qq_plot"],
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
   * 覆蓋參數驗證方法以支援向後兼容性
   * @param {Object} params - 輸入參數
   */
  validateInput(params) {
    // 🔧 在驗證之前先進行參數格式轉換（向後兼容）
    const normalizedParams = this.normalizeParameters(params);
    
    // 使用轉換後的參數進行標準驗證
    return super.validateInput(normalizedParams);
  }

  /**
   * 執行工具
   * @param {Object} params - 工具參數
   */
  async _execute(params) {
    try {
      // 🔧 向後兼容處理：自動轉換舊格式參數
      const normalizedParams = this.normalizeParameters(params);
      
      logger.info("收到 T檢定請求", {
        sample1Size: normalizedParams.data.sample1?.length,
        sample2Size: normalizedParams.data.sample2?.length,
        paired: normalizedParams.data.paired,
        scenario: normalizedParams.context?.scenario,
        originalFormat: params.data ? 'new' : 'legacy',
      });

      // 驗證輸入數據
      if (!normalizedParams.data.sample1 || normalizedParams.data.sample1.length < 2) {
        throw new ToolExecutionError(
          "sample1 必須包含至少 2 個數值",
          ToolErrorType.VALIDATION_ERROR,
        );
      }

      if (normalizedParams.data.sample2 && normalizedParams.data.sample2.length < 2) {
        throw new ToolExecutionError(
          "sample2 必須包含至少 2 個數值",
          ToolErrorType.VALIDATION_ERROR,
        );
      }

      if (
        normalizedParams.data.paired &&
        (!normalizedParams.data.sample2 ||
          normalizedParams.data.sample1.length !== normalizedParams.data.sample2.length)
      ) {
        throw new ToolExecutionError(
          "配對檢定要求兩組樣本大小相同",
          ToolErrorType.VALIDATION_ERROR,
        );
      }

      // 執行統計檢定
      const result = await statService.performTTest(
        normalizedParams.data,
        normalizedParams.context || {},
      );

      // 處理視覺化需求
      const visualizations = {};
      if (normalizedParams.visualizations?.include_charts && 
          normalizedParams.visualizations?.chart_types?.length > 0) {
        
        logger.info("開始生成統計視覺化圖表", {
          chartTypes: normalizedParams.visualizations.chart_types,
          generateImage: normalizedParams.visualizations.generate_image
        });

        for (const chartType of normalizedParams.visualizations.chart_types) {
          try {
            switch (chartType) {
              case 'histogram':
                visualizations.histogram = await this.createHistogram(
                  normalizedParams.data,
                  normalizedParams.visualizations,
                  normalizedParams.context
                );
                break;
              case 'boxplot':
                visualizations.boxplot = await this.createBoxplot(
                  normalizedParams.data,
                  normalizedParams.visualizations,
                  normalizedParams.context
                );
                break;
              case 'qq_plot':
                visualizations.qq_plot = await this.createQQPlot(
                  normalizedParams.data,
                  normalizedParams.visualizations,
                  normalizedParams.context
                );
                break;
            }
          } catch (vizError) {
            logger.warn(`視覺化圖表 ${chartType} 創建失敗`, { error: vizError.message });
            visualizations[chartType] = { error: vizError.message };
          }
        }
      }

      // 生成詳細報告
      const report = this.generateTTestReport(result, normalizedParams, visualizations);

      // 記錄執行資訊
      logger.info("T檢定執行成功", {
        toolName: this.name,
        testType: result.test_type,
        pValue: result.p_value,
        significant: result.p_value < (normalizedParams.data.alpha || 0.05),
      });

      return {
        success: true,
        data: {
          result: result,
          report: report,
          visualizations: Object.keys(visualizations).length > 0 ? visualizations : null,
        },
        _meta: {
          tool_type: "statistical_test_with_visualization",
          test_type: result.test_type,
          has_visualizations: Object.keys(visualizations).length > 0,
          chart_types: normalizedParams.visualizations?.chart_types || [],
          image_data: this.extractImageData(visualizations)
        }
      };
    } catch (error) {
      // 記錄錯誤
      logger.error("T檢定執行失敗", {
        toolName: this.name,
        params: JSON.stringify(params),
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `T檢定執行失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }

  /**
   * 生成 T 檢定詳細報告
   * @param {Object} result - 統計結果
   * @param {Object} params - 輸入參數
   * @param {Object} visualizations - 視覺化結果
   * @returns {string} 格式化報告
   */
  generateTTestReport(result, params, visualizations = {}) {
    const alpha = params.data.alpha || 0.05;
    const isSignificant = result.p_value < alpha;

    let report = `# T檢定分析報告\n\n`;

    // 基本信息
    report += `## 📊 檢定類型\n`;
    report += `**類型**: ${this.getTestTypeDescription(result.test_type)}\n`;
    report += `**顯著水準**: α = ${alpha}\n`;
    report += `**對立假設**: ${this.getAlternativeDescription(params.data.alternative || "two-sided")}\n\n`;

    // 樣本統計
    report += `## 📈 樣本統計\n`;
    report += `**樣本1大小**: ${params.data.sample1.length}\n`;
    report += `**樣本1平均**: ${this.getMean(params.data.sample1).toFixed(4)}\n`;
    report += `**樣本1標準差**: ${this.getStandardDeviation(params.data.sample1).toFixed(4)}\n`;

    if (params.data.sample2) {
      report += `**樣本2大小**: ${params.data.sample2.length}\n`;
      report += `**樣本2平均**: ${this.getMean(params.data.sample2).toFixed(4)}\n`;
      report += `**樣本2標準差**: ${this.getStandardDeviation(params.data.sample2).toFixed(4)}\n`;
    }
    report += `\n`;

    // 檢定結果
    report += `## 🔍 檢定結果\n`;
    report += `**t統計量**: ${result.statistic.toFixed(4)}\n`;
    report += `**自由度**: ${result.degrees_of_freedom}\n`;
    report += `**p值**: ${result.p_value.toFixed(6)}\n`;
    report += `**結果**: ${isSignificant ? "🔴 拒絕虛無假設（顯著）" : "🟢 不拒絕虛無假設（不顯著）"}\n\n`;

    // 信賴區間
    if (result.confidence_interval) {
      report += `## 📏 信賴區間\n`;
      report += `**95% 信賴區間**: [${result.confidence_interval[0].toFixed(4)}, ${result.confidence_interval[1].toFixed(4)}]\n\n`;
    }

    // 效果量
    if (result.effect_size !== undefined && result.effect_size !== null) {
      report += `## 💪 效果量\n`;
      report += `**Cohen's d**: ${result.effect_size.toFixed(3)}\n`;
      
      // 使用後端提供的效果量解釋，若無則使用本地解釋
      const interpretation = result.effect_size_interpretation || this.getEffectSizeInterpretation(result.effect_size);
      report += `**效果大小**: ${interpretation}\n\n`;
    }

    // 解釋
    report += `## 💡 結果解釋\n`;
    if (params.context?.description) {
      report += `**研究問題**: ${params.context.description}\n\n`;
    }

    if (isSignificant) {
      report += `在 α = ${alpha} 的顯著水準下，我們有足夠的證據拒絕虛無假設。`;
      if (params.data.sample2) {
        const diff =
          this.getMean(params.data.sample1) - this.getMean(params.data.sample2);
        report += `兩組間存在統計上顯著的差異，差異為 ${diff.toFixed(4)}。`;
      }
    } else {
      report += `在 α = ${alpha} 的顯著水準下，我們沒有足夠的證據拒絕虛無假設。`;
      if (params.data.sample2) {
        report += `兩組間沒有統計上顯著的差異。`;
      }
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
      
      report += `\n💡 **視覺化說明**: 圖表有助於檢驗統計假設並提供直觀的數據理解\n`;
    }

    return report;
  }

  /**
   * 正規化參數格式（向後兼容處理）
   * @param {Object} params - 原始參數
   * @returns {Object} 正規化後的參數
   */
  normalizeParameters(params) {
    // 如果已經是新格式（包含 data 物件），直接返回
    if (params.data) {
      return params;
    }

    // 舊格式轉換為新格式
    logger.info("檢測到舊格式參數，正在轉換為新格式...");
    
    const normalizedParams = {
      data: {
        sample1: params.sample1 || [],
        sample2: params.sample2 || null,
        paired: params.paired || false,
        alpha: params.alpha || 0.05,
        alternative: params.alternative || "two-sided"
      },
      context: {
        scenario: params.scenario || "statistical_analysis",
        description: params.description || "統計檢定分析",
        variable_names: {
          sample1_name: params.sample1_name || "樣本1",
          sample2_name: params.sample2_name || "樣本2"
        }
      }
    };

    logger.info("參數格式轉換完成", {
      originalKeys: Object.keys(params),
      normalizedStructure: {
        data: Object.keys(normalizedParams.data),
        context: Object.keys(normalizedParams.context)
      }
    });

    return normalizedParams;
  }

  /**
   * 獲取檢定類型描述
   */
  getTestTypeDescription(testType) {
    const descriptions = {
      one_sample: "單樣本 t 檢定",
      two_sample: "雙樣本獨立 t 檢定",
      paired: "配對樣本 t 檢定",
    };
    return descriptions[testType] || testType;
  }

  /**
   * 獲取對立假設描述
   */
  getAlternativeDescription(alternative) {
    const descriptions = {
      "two-sided": "雙尾檢定（μ ≠ μ₀）",
      less: "左尾檢定（μ < μ₀）",
      greater: "右尾檢定（μ > μ₀）",
    };
    return descriptions[alternative] || alternative;
  }

  /**
   * 計算平均數
   */
  getMean(data) {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  /**
   * 計算標準差
   */
  getStandardDeviation(data) {
    const mean = this.getMean(data);
    const variance =
      data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * 解釋效果量大小
   */
  getEffectSizeInterpretation(cohensD) {
    const absD = Math.abs(cohensD);
    if (absD < 0.2) return "微小效果";
    if (absD < 0.5) return "小效果";
    if (absD < 0.8) return "中等效果";
    return "大效果";
  }

  /**
   * 創建直方圖以檢查常態性
   */
  async createHistogram(data, visualizationOptions, context) {
    try {
      // 組合兩個樣本的數據進行常態性檢查
      const combinedData = data.sample2 ? 
        [...data.sample1, ...data.sample2] : 
        data.sample1;

      const requestData = {
        values: combinedData,
        bins: 15,
        title: `${context?.variable_names?.sample1_name || '樣本'}數據分佈`,
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
      logger.error("創建直方圖失敗", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 創建盒鬚圖以比較組間差異
   */
  async createBoxplot(data, visualizationOptions, context) {
    try {
      const requestData = {
        groups: data.sample2 ? [data.sample1, data.sample2] : [data.sample1],
        group_labels: data.sample2 ? [
          context?.variable_names?.sample1_name || "樣本1",
          context?.variable_names?.sample2_name || "樣本2"
        ] : [context?.variable_names?.sample1_name || "樣本"],
        title: `${context?.variable_names?.sample1_name || '樣本'}組間比較`,
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
      logger.error("創建盒鬚圖失敗", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 創建 Q-Q 圖以檢查常態性
   */
  async createQQPlot(data, visualizationOptions, context) {
    try {
      // 注意: 目前 sfda_stat 後端可能還沒有 Q-Q 圖 API
      // 這裡提供一個框架，未來可以擴展
      logger.warn("Q-Q 圖功能尚未實作於後端服務");
      return { 
        error: "Q-Q 圖功能尚未實作",
        placeholder: true 
      };
    } catch (error) {
      logger.error("創建 Q-Q 圖失敗", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 獲取圖表類型描述
   */
  getChartTypeDescription(chartType) {
    const descriptions = {
      histogram: "直方圖 (常態性檢查)",
      boxplot: "盒鬚圖 (組間比較)",
      qq_plot: "Q-Q 圖 (常態性檢查)"
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