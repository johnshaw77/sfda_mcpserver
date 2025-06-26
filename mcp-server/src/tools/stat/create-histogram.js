/**
 * 直方圖創建 MCP 工具
 *
 * 提供數據分佈視覺化功能，適用於：
 * - 數據分佈分析
 * - 常態性視覺檢查
 * - 統計檢定假設驗證
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import logger from "../../config/logger.js";

/**
 * 直方圖創建工具
 */
export class CreateHistogramTool extends BaseTool {
  constructor() {
    super(
      "create_histogram",
      "創建直方圖以視覺化數據分佈，適用於常態性檢查和分佈分析",
      {
        type: "object",
        properties: {
          values: {
            type: "array",
            items: { type: "number" },
            description: "數值數據陣列",
            minItems: 5,
          },
          bins: {
            type: "integer",
            description: "直方圖區間數量",
            default: 10,
            minimum: 5,
            maximum: 50,
          },
          title: {
            type: "string",
            description: "圖表標題",
          },
          x_axis_label: {
            type: "string",
            description: "X軸標籤",
            default: "數值",
          },
          y_axis_label: {
            type: "string",
            description: "Y軸標籤",
            default: "頻率",
          },
          context: {
            type: "object",
            properties: {
              scenario: {
                type: "string",
                description: "分析場景 (medical, education, quality, etc.)",
                examples: ["medical", "education", "quality", "general"],
              },
              variable_name: {
                type: "string",
                description: "變數名稱",
              },
            },
          },
          generate_image: {
            type: "boolean",
            description: "是否生成 base64 圖片",
            default: false,
          },
          image_format: {
            type: "string",
            description: "圖片格式 (png, jpg, svg)",
            default: "png",
            enum: ["png", "jpg", "svg"],
          },
        },
        required: ["values"],
      },
      "stat",
    );
  }

  async execute(args) {
    try {
      logger.info("收到直方圖創建請求", {
        dataPointsCount: args.values?.length,
        bins: args.bins,
        title: args.title,
        scenario: args.context?.scenario,
      });

      // 驗證輸入參數
      this.validateInput(args);

      // 調用統計分析服務創建直方圖
      const histogramResult = await this.createHistogramViaAPI(args);

      // 生成回應內容
      const response = this.generateHistogramResponse(histogramResult, args);

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
        // 返回直方圖數據供前端使用
        _meta: {
          chart_data: histogramResult,
          tool_type: "histogram_creation",
          chart_type: "histogram",
          statistical_summary: this.generateStatisticalSummary(args.values),
          image_data: args.generate_image && histogramResult.has_image ? {
            base64: histogramResult.image_base64,
            format: histogramResult.image_format,
            size: histogramResult.image_base64?.length || 0
          } : null,
        },
      };
    } catch (error) {
      logger.error("直方圖創建失敗", {
        error: error.message,
        args: {
          values_count: args.values?.length,
          bins: args.bins,
        },
      });

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      throw new ToolExecutionError(
        ToolErrorType.EXECUTION_ERROR,
        `直方圖創建失敗: ${error.message}`,
      );
    }
  }

  /**
   * 驗證輸入參數
   */
  validateInput(args) {
    if (!args.values || !Array.isArray(args.values) || args.values.length < 5) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "數值陣列至少需要 5 個數據點",
      );
    }

    // 驗證數值是否為有效數字
    for (let i = 0; i < args.values.length; i++) {
      if (typeof args.values[i] !== "number" || isNaN(args.values[i])) {
        throw new ToolExecutionError(
          ToolErrorType.INVALID_INPUT,
          `數值陣列中的第 ${i + 1} 個值不是有效數字: ${args.values[i]}`,
        );
      }
    }

    // 驗證 bins 參數
    if (args.bins && (args.bins < 5 || args.bins > 50)) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "區間數量必須在 5-50 之間",
      );
    }
  }

  /**
   * 通過 API 創建直方圖
   */
  async createHistogramViaAPI(args) {
    try {
      // 構建請求數據
      const requestData = {
        values: args.values,
        bins: args.bins || 10,
        title: args.title,
        x_axis_label: args.x_axis_label || "數值",
        y_axis_label: args.y_axis_label || "頻率",
        generate_image: args.generate_image || false,
        image_format: args.image_format || "png",
        figsize: [10, 6],
        dpi: 100,
      };

      // 調用統計分析服務的直方圖 API
      const response = await fetch(
        "http://localhost:8000/api/v1/charts/histogram",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API 調用失敗: ${response.status} - ${errorData.detail || response.statusText}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.reasoning || "直方圖創建失敗");
      }

      return result;
    } catch (error) {
      logger.error("直方圖 API 調用失敗", { error: error.message });
      throw error;
    }
  }

  /**
   * 生成直方圖回應內容
   */
  generateHistogramResponse(histogramResult, args) {
    let response = "";

    // 標題
    response += `# 📊 直方圖創建成功\n\n`;

    if (args.title) {
      response += `**圖表標題**: ${args.title}\n\n`;
    }

    // 數據概覽
    response += "## 📈 數據概覽\n\n";
    response += `- **圖表類型**: 直方圖\n`;
    response += `- **數據點數量**: ${args.values.length}\n`;
    response += `- **區間數量**: ${args.bins || 10}\n`;

    const stats = this.generateStatisticalSummary(args.values);
    response += `- **數值範圍**: ${stats.min} - ${stats.max}\n`;
    response += `- **平均值**: ${stats.mean}\n`;
    response += `- **標準差**: ${stats.std}\n\n`;

    // 分佈特徵分析
    response += "## 📋 分佈特徵\n\n";
    response += this.generateDistributionAnalysis(stats);

    // 場景化解釋
    if (args.context?.scenario) {
      response += "## 🎭 場景分析\n\n";
      response += this.generateContextualInterpretation(
        stats,
        args.context.scenario,
        args.context.variable_name,
      );
    }

    // 統計應用建議
    response += "## 💡 統計應用建議\n\n";
    response += this.generateStatisticalRecommendations(stats);

    // 成功信息
    response += "## ✅ 創建狀態\n\n";
    response += `直方圖已成功創建！${histogramResult.reasoning}\n\n`;
    
    // 圖片資訊
    if (args.generate_image && histogramResult.has_image) {
      response += "## 🖼️ 圖片資訊\n\n";
      response += `- **圖片格式**: ${histogramResult.image_format.toUpperCase()}\n`;
      response += `- **Base64 編碼**: 已生成（${histogramResult.image_base64?.length || 0} 字符）\n`;
      response += `- **圖片狀態**: 可直接在前端顯示或儲存為檔案\n\n`;
    }
    
    response += "💡 **直方圖說明**: 適合檢視數據分佈形狀、辨識偏態和異常值，是統計分析的重要視覺化工具\n";

    return response;
  }

  /**
   * 生成統計摘要
   */
  generateStatisticalSummary(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);

    return {
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      mean: mean.toFixed(2),
      std: std.toFixed(2),
      median: this.calculateMedian(sorted).toFixed(2),
      q1: this.calculatePercentile(sorted, 25).toFixed(2),
      q3: this.calculatePercentile(sorted, 75).toFixed(2),
      skewness: this.calculateSkewness(values, mean, std),
      kurtosis: this.calculateKurtosis(values, mean, std),
    };
  }

  /**
   * 計算中位數
   */
  calculateMedian(sortedValues) {
    const n = sortedValues.length;
    if (n % 2 === 0) {
      return (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2;
    } else {
      return sortedValues[Math.floor(n / 2)];
    }
  }

  /**
   * 計算百分位數
   */
  calculatePercentile(sortedValues, percentile) {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
      return sortedValues[lower];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * 計算偏度
   */
  calculateSkewness(values, mean, std) {
    const n = values.length;
    if (std === 0) return 0;

    const sum = values.reduce((acc, val) => {
      return acc + Math.pow((val - mean) / std, 3);
    }, 0);

    return ((n / ((n - 1) * (n - 2))) * sum).toFixed(3);
  }

  /**
   * 計算峰度
   */
  calculateKurtosis(values, mean, std) {
    const n = values.length;
    if (std === 0) return 0;

    const sum = values.reduce((acc, val) => {
      return acc + Math.pow((val - mean) / std, 4);
    }, 0);

    const kurtosis = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sum -
                     (3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3)));

    return kurtosis.toFixed(3);
  }

  /**
   * 生成分佈分析
   */
  generateDistributionAnalysis(stats) {
    let analysis = "";

    // 分佈形狀分析
    const skewness = parseFloat(stats.skewness);
    const kurtosis = parseFloat(stats.kurtosis);

    analysis += `**分佈形狀**:\n`;
    if (Math.abs(skewness) < 0.5) {
      analysis += `- 偏度: ${stats.skewness} (接近對稱分佈) ✅\n`;
    } else if (skewness > 0.5) {
      analysis += `- 偏度: ${stats.skewness} (右偏分佈) ⚠️\n`;
    } else {
      analysis += `- 偏度: ${stats.skewness} (左偏分佈) ⚠️\n`;
    }

    if (Math.abs(kurtosis) < 1) {
      analysis += `- 峰度: ${stats.kurtosis} (接近常態分佈) ✅\n`;
    } else if (kurtosis > 1) {
      analysis += `- 峰度: ${stats.kurtosis} (尖峰分佈) ⚠️\n`;
    } else {
      analysis += `- 峰度: ${stats.kurtosis} (平坦分佈) ⚠️\n`;
    }

    analysis += `\n**集中趨勢**:\n`;
    analysis += `- 平均值: ${stats.mean}\n`;
    analysis += `- 中位數: ${stats.median}\n`;
    analysis += `- 四分位距: ${stats.q1} - ${stats.q3}\n\n`;

    return analysis;
  }

  /**
   * 生成情境化解釋
   */
  generateContextualInterpretation(stats, scenario, variableName = "此變數") {
    let interpretation = "";

    if (scenario === "medical") {
      interpretation += `**醫療分析解釋**:\n`;
      interpretation += `${variableName}的分佈特徵對於臨床決策很重要。`;
      if (Math.abs(parseFloat(stats.skewness)) < 0.5) {
        interpretation += `數據呈現對稱分佈，適合使用參數檢定方法進行統計分析。\n\n`;
      } else {
        interpretation += `數據呈現偏態分佈，建議考慮非參數檢定方法或數據轉換。\n\n`;
      }
    } else if (scenario === "education") {
      interpretation += `**教育分析解釋**:\n`;
      interpretation += `${variableName}的分佈反映學習成果的變異性。`;
      if (parseFloat(stats.std) / parseFloat(stats.mean) < 0.3) {
        interpretation += `變異係數較小，顯示學習成果相對一致。\n\n`;
      } else {
        interpretation += `變異係數較大，顯示學習成果存在較大差異，需要進一步分析原因。\n\n`;
      }
    } else if (scenario === "quality") {
      interpretation += `**品質控制解釋**:\n`;
      interpretation += `${variableName}的分佈對於製程控制至關重要。`;
      if (Math.abs(parseFloat(stats.skewness)) < 0.5 && Math.abs(parseFloat(stats.kurtosis)) < 1) {
        interpretation += `分佈接近常態，製程控制良好。\n\n`;
      } else {
        interpretation += `分佈異常，需要檢查製程參數和品質控制措施。\n\n`;
      }
    }

    return interpretation;
  }

  /**
   * 生成統計建議
   */
  generateStatisticalRecommendations(stats) {
    let recommendations = "";

    const skewness = parseFloat(stats.skewness);
    const kurtosis = parseFloat(stats.kurtosis);

    recommendations += `**統計檢定建議**:\n`;

    // 常態性建議
    if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1) {
      recommendations += `- ✅ 數據接近常態分佈，適合使用參數檢定 (t檢定、ANOVA)\n`;
    } else {
      recommendations += `- ⚠️ 數據偏離常態分佈，建議使用非參數檢定 (Mann-Whitney、Kruskal-Wallis)\n`;
    }

    // 異常值檢測建議
    const iqr = parseFloat(stats.q3) - parseFloat(stats.q1);
    const lowerFence = parseFloat(stats.q1) - 1.5 * iqr;
    const upperFence = parseFloat(stats.q3) + 1.5 * iqr;

    recommendations += `- 🔍 建議檢查超出 ${lowerFence.toFixed(2)} - ${upperFence.toFixed(2)} 範圍的異常值\n`;

    // 樣本大小建議
    recommendations += `- 📊 建議配合盒鬚圖進行多組比較分析\n`;
    recommendations += `- 📈 建議進行 Shapiro-Wilk 常態性檢定確認分佈特徵\n`;

    return recommendations;
  }
}