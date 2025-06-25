/**
 * 散點圖創建 MCP 工具
 *
 * 提供雙變數關係視覺化功能，適用於：
 * - 相關性分析
 * - 線性關係檢查
 * - 迴歸分析視覺化
 * - 異常值和影響點識別
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import logger from "../../config/logger.js";

/**
 * 散點圖創建工具
 */
export class CreateScatterTool extends BaseTool {
  constructor() {
    super(
      "create_scatter",
      "創建散點圖以視覺化雙變數關係，適用於相關性和迴歸分析",
      {
        type: "object",
        properties: {
          x: {
            type: "array",
            items: { type: "number" },
            description: "X軸數據陣列",
            minItems: 3,
          },
          y: {
            type: "array",
            items: { type: "number" },
            description: "Y軸數據陣列",
            minItems: 3,
          },
          title: {
            type: "string",
            description: "圖表標題",
          },
          x_axis_label: {
            type: "string",
            description: "X軸標籤",
            default: "X",
          },
          y_axis_label: {
            type: "string",
            description: "Y軸標籤", 
            default: "Y",
          },
          show_regression_line: {
            type: "boolean",
            description: "是否顯示迴歸線",
            default: false,
          },
          context: {
            type: "object",
            properties: {
              scenario: {
                type: "string",
                description: "分析場景 (medical, education, quality, etc.)",
                examples: ["medical", "education", "quality", "general"],
              },
              relationship_hypothesis: {
                type: "string",
                description: "關係假設",
                examples: ["positive_correlation", "negative_correlation", "no_correlation"],
              },
              x_variable_name: {
                type: "string",
                description: "X變數名稱",
              },
              y_variable_name: {
                type: "string",
                description: "Y變數名稱",
              },
            },
          },
        },
        required: ["x", "y"],
      },
      "stat",
    );
  }

  async execute(args) {
    try {
      logger.info("收到散點圖創建請求", {
        dataPointsCount: args.x?.length,
        showRegression: args.show_regression_line,
        title: args.title,
        scenario: args.context?.scenario,
      });

      // 驗證輸入參數
      this.validateInput(args);

      // 調用統計分析服務創建散點圖
      const scatterResult = await this.createScatterViaAPI(args);

      // 生成回應內容
      const response = this.generateScatterResponse(scatterResult, args);

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
        // 返回散點圖數據供前端使用
        _meta: {
          chart_data: scatterResult,
          tool_type: "scatter_creation",
          chart_type: "scatter",
          correlation_analysis: this.generateCorrelationAnalysis(args.x, args.y),
          regression_analysis: args.show_regression_line ? 
            this.generateRegressionAnalysis(args.x, args.y) : null,
        },
      };
    } catch (error) {
      logger.error("散點圖創建失敗", {
        error: error.message,
        args: {
          x_length: args.x?.length,
          y_length: args.y?.length,
          show_regression: args.show_regression_line,
        },
      });

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      throw new ToolExecutionError(
        ToolErrorType.EXECUTION_ERROR,
        `散點圖創建失敗: ${error.message}`,
      );
    }
  }

  /**
   * 驗證輸入參數
   */
  validateInput(args) {
    if (!args.x || !Array.isArray(args.x) || args.x.length < 3) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "X軸數據至少需要 3 個數據點",
      );
    }

    if (!args.y || !Array.isArray(args.y) || args.y.length < 3) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "Y軸數據至少需要 3 個數據點",
      );
    }

    if (args.x.length !== args.y.length) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "X軸和Y軸數據長度必須相同",
      );
    }

    // 驗證X軸數值
    for (let i = 0; i < args.x.length; i++) {
      if (typeof args.x[i] !== "number" || isNaN(args.x[i])) {
        throw new ToolExecutionError(
          ToolErrorType.INVALID_INPUT,
          `X軸數據中的第 ${i + 1} 個值不是有效數字: ${args.x[i]}`,
        );
      }
    }

    // 驗證Y軸數值
    for (let i = 0; i < args.y.length; i++) {
      if (typeof args.y[i] !== "number" || isNaN(args.y[i])) {
        throw new ToolExecutionError(
          ToolErrorType.INVALID_INPUT,
          `Y軸數據中的第 ${i + 1} 個值不是有效數字: ${args.y[i]}`,
        );
      }
    }
  }

  /**
   * 通過 API 創建散點圖
   */
  async createScatterViaAPI(args) {
    try {
      // 構建請求數據
      const requestData = {
        x: args.x,
        y: args.y,
        title: args.title,
        x_axis_label: args.x_axis_label || "X",
        y_axis_label: args.y_axis_label || "Y",
        show_regression_line: args.show_regression_line || false,
      };

      // 調用統計分析服務的散點圖 API
      const response = await fetch(
        "http://localhost:8000/api/v1/charts/scatter",
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
        throw new Error(result.reasoning || "散點圖創建失敗");
      }

      return result;
    } catch (error) {
      logger.error("散點圖 API 調用失敗", { error: error.message });
      throw error;
    }
  }

  /**
   * 生成散點圖回應內容
   */
  generateScatterResponse(scatterResult, args) {
    let response = "";

    // 標題
    response += `# 📈 散點圖創建成功\n\n`;

    if (args.title) {
      response += `**圖表標題**: ${args.title}\n\n`;
    }

    // 數據概覽
    response += "## 📊 數據概覽\n\n";
    response += `- **圖表類型**: 散點圖\n`;
    response += `- **數據點數量**: ${args.x.length}\n`;
    response += `- **X軸範圍**: ${Math.min(...args.x).toFixed(2)} - ${Math.max(...args.x).toFixed(2)}\n`;
    response += `- **Y軸範圍**: ${Math.min(...args.y).toFixed(2)} - ${Math.max(...args.y).toFixed(2)}\n`;
    response += `- **迴歸線**: ${args.show_regression_line ? "已顯示" : "未顯示"}\n\n`;

    // 相關性分析
    response += "## 🔗 相關性分析\n\n";
    response += this.generateCorrelationSection(args.x, args.y);

    // 迴歸分析 (如果啟用)
    if (args.show_regression_line) {
      response += "## 📉 迴歸分析\n\n";
      response += this.generateRegressionSection(args.x, args.y);
    }

    // 資料品質檢查
    response += "## 🔍 資料品質檢查\n\n";
    response += this.generateDataQualityCheck(args.x, args.y);

    // 場景化解釋
    if (args.context?.scenario) {
      response += "## 🎭 場景分析\n\n";
      response += this.generateContextualInterpretation(
        args.x,
        args.y,
        args.context.scenario,
        args.context.relationship_hypothesis,
        args.context.x_variable_name || "X變數",
        args.context.y_variable_name || "Y變數",
      );
    }

    // 統計建議
    response += "## 💡 統計分析建議\n\n";
    response += this.generateStatisticalRecommendations(args.x, args.y);

    // 成功信息
    response += "## ✅ 創建狀態\n\n";
    response += `散點圖已成功創建！${scatterResult.reasoning}\n\n`;
    response += "💡 **散點圖說明**: 適合檢視兩變數間的關係模式、識別異常值和評估線性關係強度\n";

    return response;
  }

  /**
   * 生成相關性分析
   */
  generateCorrelationAnalysis(x, y) {
    const correlation = this.calculatePearsonCorrelation(x, y);
    const spearmanCorrelation = this.calculateSpearmanCorrelation(x, y);
    
    return {
      pearson_r: correlation,
      spearman_rho: spearmanCorrelation,
      r_squared: correlation * correlation,
      strength: this.interpretCorrelationStrength(Math.abs(correlation)),
      direction: correlation > 0 ? "positive" : correlation < 0 ? "negative" : "none",
    };
  }

  /**
   * 計算 Pearson 相關係數
   */
  calculatePearsonCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 計算 Spearman 等級相關係數
   */
  calculateSpearmanCorrelation(x, y) {
    // 轉換為等級
    const xRanks = this.convertToRanks(x);
    const yRanks = this.convertToRanks(y);
    
    // 計算等級的 Pearson 相關係數
    return this.calculatePearsonCorrelation(xRanks, yRanks);
  }

  /**
   * 轉換為等級
   */
  convertToRanks(values) {
    const indexed = values.map((val, i) => ({ value: val, index: i }));
    indexed.sort((a, b) => a.value - b.value);
    
    const ranks = new Array(values.length);
    for (let i = 0; i < indexed.length; i++) {
      ranks[indexed[i].index] = i + 1;
    }
    
    return ranks;
  }

  /**
   * 生成迴歸分析
   */
  generateRegressionAnalysis(x, y) {
    const regression = this.calculateLinearRegression(x, y);
    const rSquared = Math.pow(this.calculatePearsonCorrelation(x, y), 2);
    
    return {
      slope: regression.slope,
      intercept: regression.intercept,
      r_squared: rSquared,
      equation: `y = ${regression.slope.toFixed(4)}x + ${regression.intercept.toFixed(4)}`,
    };
  }

  /**
   * 計算線性迴歸
   */
  calculateLinearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * 生成相關性分析區段
   */
  generateCorrelationSection(x, y) {
    const corrAnalysis = this.generateCorrelationAnalysis(x, y);
    let section = "";

    section += `**Pearson 相關係數**:\n`;
    section += `- r = ${corrAnalysis.pearson_r.toFixed(4)}\n`;
    section += `- R² = ${corrAnalysis.r_squared.toFixed(4)} (解釋變異量: ${(corrAnalysis.r_squared * 100).toFixed(1)}%)\n`;
    section += `- 關係強度: ${corrAnalysis.strength}\n`;
    section += `- 關係方向: ${corrAnalysis.direction === 'positive' ? '正相關' : corrAnalysis.direction === 'negative' ? '負相關' : '無相關'}\n\n`;

    section += `**Spearman 等級相關係數**:\n`;
    section += `- ρ = ${corrAnalysis.spearman_rho.toFixed(4)}\n`;
    section += `- 適用於非線性單調關係\n\n`;

    // 相關性解釋
    section += `**相關性解釋**:\n`;
    if (Math.abs(corrAnalysis.pearson_r) > 0.7) {
      section += `- ${corrAnalysis.direction === 'positive' ? '強正' : '強負'}相關關係 ✅\n`;
    } else if (Math.abs(corrAnalysis.pearson_r) > 0.3) {
      section += `- ${corrAnalysis.direction === 'positive' ? '中等正' : '中等負'}相關關係 ⚠️\n`;
    } else {
      section += `- 弱相關或無相關關係 ❌\n`;
    }

    section += "\n";
    return section;
  }

  /**
   * 生成迴歸分析區段
   */
  generateRegressionSection(x, y) {
    const regAnalysis = this.generateRegressionAnalysis(x, y);
    let section = "";

    section += `**線性迴歸方程式**:\n`;
    section += `- ${regAnalysis.equation}\n`;
    section += `- 斜率: ${regAnalysis.slope.toFixed(4)}\n`;
    section += `- 截距: ${regAnalysis.intercept.toFixed(4)}\n`;
    section += `- R²: ${regAnalysis.r_squared.toFixed(4)}\n\n`;

    section += `**迴歸解釋**:\n`;
    section += `- 每單位 X 變化，Y 平均變化 ${Math.abs(regAnalysis.slope).toFixed(4)} 單位\n`;
    section += `- 迴歸模型解釋了 ${(regAnalysis.r_squared * 100).toFixed(1)}% 的 Y 變異\n`;
    
    if (regAnalysis.r_squared > 0.7) {
      section += `- 模型配適度: 良好 ✅\n`;
    } else if (regAnalysis.r_squared > 0.3) {
      section += `- 模型配適度: 中等 ⚠️\n`;
    } else {
      section += `- 模型配適度: 較差 ❌\n`;
    }

    section += "\n";
    return section;
  }

  /**
   * 生成資料品質檢查
   */
  generateDataQualityCheck(x, y) {
    let check = "";

    // 異常值檢測 (使用 IQR 方法)
    const xOutliers = this.detectOutliers(x);
    const yOutliers = this.detectOutliers(y);

    check += `**異常值檢測**:\n`;
    if (xOutliers.length > 0) {
      check += `- X軸發現 ${xOutliers.length} 個異常值: ${xOutliers.map(v => v.toFixed(2)).join(", ")}\n`;
    }
    if (yOutliers.length > 0) {
      check += `- Y軸發現 ${yOutliers.length} 個異常值: ${yOutliers.map(v => v.toFixed(2)).join(", ")}\n`;
    }
    if (xOutliers.length === 0 && yOutliers.length === 0) {
      check += `- 未發現明顯異常值 ✅\n`;
    }

    check += "\n**資料完整性**:\n";
    check += `- X軸資料點: ${x.length}\n`;
    check += `- Y軸資料點: ${y.length}\n`;
    check += `- 配對完整: ${x.length === y.length ? '是' : '否'} ${x.length === y.length ? '✅' : '❌'}\n\n`;

    return check;
  }

  /**
   * 檢測異常值
   */
  detectOutliers(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = this.calculatePercentile(sorted, 25);
    const q3 = this.calculatePercentile(sorted, 75);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    return values.filter(val => val < lowerFence || val > upperFence);
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
   * 解釋相關性強度
   */
  interpretCorrelationStrength(absR) {
    if (absR >= 0.9) return "非常強";
    if (absR >= 0.7) return "強";
    if (absR >= 0.5) return "中等";
    if (absR >= 0.3) return "弱";
    return "非常弱或無";
  }

  /**
   * 生成情境化解釋
   */
  generateContextualInterpretation(x, y, scenario, hypothesis, xVarName, yVarName) {
    let interpretation = "";
    const corrAnalysis = this.generateCorrelationAnalysis(x, y);

    if (scenario === "medical") {
      interpretation += `**醫療分析解釋**:\n`;
      interpretation += `${xVarName}與${yVarName}之間的關係分析:\n`;
      
      if (Math.abs(corrAnalysis.pearson_r) > 0.5) {
        interpretation += `- 發現${corrAnalysis.direction === 'positive' ? '正' : '負'}相關關係 (r = ${corrAnalysis.pearson_r.toFixed(3)})\n`;
        interpretation += `- 此關係在臨床上可能具有重要意義\n`;
        interpretation += `- 建議進行進一步的臨床驗證研究\n`;
      } else {
        interpretation += `- 相關性較弱，可能需要考慮其他影響因素\n`;
        interpretation += `- 建議擴大樣本或檢查測量方法\n`;
      }
    } else if (scenario === "education") {
      interpretation += `**教育分析解釋**:\n`;
      interpretation += `${xVarName}與${yVarName}之間的學習關係:\n`;
      
      if (corrAnalysis.direction === 'positive' && Math.abs(corrAnalysis.pearson_r) > 0.3) {
        interpretation += `- 呈現正向關係，符合教育理論預期\n`;
        interpretation += `- 可作為教學策略調整的參考依據\n`;
      } else if (corrAnalysis.direction === 'negative') {
        interpretation += `- 呈現負向關係，需要深入分析原因\n`;
        interpretation += `- 可能存在其他干擾因素影響學習成效\n`;
      }
    } else if (scenario === "quality") {
      interpretation += `**品質控制解釋**:\n`;
      interpretation += `${xVarName}與${yVarName}之間的製程關係:\n`;
      
      if (Math.abs(corrAnalysis.pearson_r) > 0.7) {
        interpretation += `- 強相關關係顯示製程參數間的穩定關聯\n`;
        interpretation += `- 可用於製程預測和品質控制\n`;
      } else {
        interpretation += `- 關係較弱，製程可能受到多重因素影響\n`;
        interpretation += `- 建議檢查其他製程變數的影響\n`;
      }
    }

    interpretation += "\n";
    return interpretation;
  }

  /**
   * 生成統計建議
   */
  generateStatisticalRecommendations(x, y) {
    let recommendations = "";
    const corrAnalysis = this.generateCorrelationAnalysis(x, y);

    recommendations += `**進一步分析建議**:\n`;

    // 基於相關性強度的建議
    if (Math.abs(corrAnalysis.pearson_r) > 0.5) {
      recommendations += `- ✅ 相關性顯著，建議進行相關性檢定 (Pearson 或 Spearman)\n`;
      recommendations += `- 📈 考慮建立迴歸預測模型\n`;
      recommendations += `- 🔍 檢查是否存在因果關係的可能性\n`;
    } else {
      recommendations += `- ⚠️ 相關性較弱，建議檢查：\n`;
      recommendations += `  - 是否存在非線性關係\n`;
      recommendations += `  - 是否有遺漏的重要變數\n`;
      recommendations += `  - 是否需要增加樣本數量\n`;
    }

    recommendations += "\n**統計檢定建議**:\n";
    recommendations += `- Pearson 相關檢定 (若數據常態分佈)\n`;
    recommendations += `- Spearman 等級相關檢定 (非參數替代)\n`;
    recommendations += `- 線性迴歸分析 (若關係顯著)\n\n`;

    recommendations += `**假設檢查**:\n`;
    recommendations += `- 檢查線性關係假設\n`;
    recommendations += `- 檢查常態性假設\n`;
    recommendations += `- 檢查等變異性假設\n`;
    recommendations += `- 檢查觀測值獨立性\n`;

    return recommendations;
  }
}