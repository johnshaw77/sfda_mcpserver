/**
 * 盒鬚圖創建 MCP 工具
 *
 * 提供多組數據比較和異常值檢測功能，適用於：
 * - 組間比較分析
 * - 異常值視覺檢測
 * - 分佈形狀比較
 * - ANOVA 和非參數檢定的視覺化支援
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import logger from "../../config/logger.js";

/**
 * 盒鬚圖創建工具
 */
export class CreateBoxplotTool extends BaseTool {
  constructor() {
    super(
      "create_boxplot",
      "創建盒鬚圖以比較多組數據和檢測異常值，適用於組間比較分析",
      {
        type: "object",
        properties: {
          groups: {
            type: "array",
            items: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
            },
            description: "各組數據陣列的陣列",
            minItems: 1,
          },
          group_labels: {
            type: "array",
            items: { type: "string" },
            description: "組別標籤陣列",
          },
          title: {
            type: "string",
            description: "圖表標題",
          },
          y_axis_label: {
            type: "string",
            description: "Y軸標籤",
            default: "數值",
          },
          context: {
            type: "object",
            properties: {
              scenario: {
                type: "string",
                description: "分析場景 (medical, education, quality, etc.)",
                examples: ["medical", "education", "quality", "general"],
              },
              comparison_type: {
                type: "string",
                description: "比較類型",
                examples: ["treatment_groups", "teaching_methods", "product_batches"],
              },
              variable_name: {
                type: "string",
                description: "測量變數名稱",
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
        required: ["groups"],
      },
      "stat",
    );
  }

  async execute(args) {
    try {
      logger.info("收到盒鬚圖創建請求", {
        groupCount: args.groups?.length,
        totalDataPoints: args.groups?.reduce((sum, group) => sum + group.length, 0),
        title: args.title,
        scenario: args.context?.scenario,
      });

      // 驗證輸入參數
      this.validateInput(args);

      // 調用統計分析服務創建盒鬚圖
      const boxplotResult = await this.createBoxplotViaAPI(args);

      // 生成回應內容
      const response = this.generateBoxplotResponse(boxplotResult, args);

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
        // 返回盒鬚圖數據供前端使用
        _meta: {
          chart_data: boxplotResult,
          tool_type: "boxplot_creation",
          chart_type: "boxplot",
          group_statistics: this.generateGroupStatistics(args.groups),
          comparison_analysis: this.generateComparisonAnalysis(args.groups),
          image_data: args.generate_image && boxplotResult.has_image ? {
            base64: boxplotResult.image_base64,
            format: boxplotResult.image_format,
            size: boxplotResult.image_base64?.length || 0
          } : null,
        },
      };
    } catch (error) {
      logger.error("盒鬚圖創建失敗", {
        error: error.message,
        args: {
          group_count: args.groups?.length,
          group_sizes: args.groups?.map(g => g.length),
        },
      });

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      throw new ToolExecutionError(
        ToolErrorType.EXECUTION_ERROR,
        `盒鬚圖創建失敗: ${error.message}`,
      );
    }
  }

  /**
   * 驗證輸入參數
   */
  validateInput(args) {
    if (!args.groups || !Array.isArray(args.groups) || args.groups.length < 1) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "至少需要一組數據",
      );
    }

    // 驗證每組數據
    for (let i = 0; i < args.groups.length; i++) {
      const group = args.groups[i];
      
      if (!Array.isArray(group) || group.length < 3) {
        throw new ToolExecutionError(
          ToolErrorType.INVALID_INPUT,
          `第 ${i + 1} 組數據至少需要 3 個數據點`,
        );
      }

      // 驗證數值是否為有效數字
      for (let j = 0; j < group.length; j++) {
        if (typeof group[j] !== "number" || isNaN(group[j])) {
          throw new ToolExecutionError(
            ToolErrorType.INVALID_INPUT,
            `第 ${i + 1} 組中的第 ${j + 1} 個值不是有效數字: ${group[j]}`,
          );
        }
      }
    }

    // 驗證標籤數量是否匹配
    if (args.group_labels && args.group_labels.length !== args.groups.length) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "組別標籤數量必須與組數相同",
      );
    }
  }

  /**
   * 通過 API 創建盒鬚圖
   */
  async createBoxplotViaAPI(args) {
    try {
      // 構建請求數據
      const requestData = {
        groups: args.groups,
        group_labels: args.group_labels || args.groups.map((_, i) => `組別 ${i + 1}`),
        title: args.title,
        y_axis_label: args.y_axis_label || "數值",
        generate_image: args.generate_image || false,
        image_format: args.image_format || "png",
        figsize: [10, 6],
        dpi: 100,
      };

      // 調用統計分析服務的盒鬚圖 API
      const response = await fetch(
        "http://localhost:8000/api/v1/charts/boxplot",
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
        throw new Error(result.reasoning || "盒鬚圖創建失敗");
      }

      return result;
    } catch (error) {
      logger.error("盒鬚圖 API 調用失敗", { error: error.message });
      throw error;
    }
  }

  /**
   * 生成盒鬚圖回應內容
   */
  generateBoxplotResponse(boxplotResult, args) {
    let response = "";

    // 標題
    response += `# 📦 盒鬚圖創建成功\n\n`;

    if (args.title) {
      response += `**圖表標題**: ${args.title}\n\n`;
    }

    // 數據概覽
    response += "## 📈 數據概覽\n\n";
    response += `- **圖表類型**: 盒鬚圖\n`;
    response += `- **組數**: ${args.groups.length}\n`;
    
    const groupLabels = args.group_labels || args.groups.map((_, i) => `組別 ${i + 1}`);
    response += `- **組別**: ${groupLabels.join(", ")}\n`;
    
    const totalDataPoints = args.groups.reduce((sum, group) => sum + group.length, 0);
    response += `- **總數據點**: ${totalDataPoints}\n`;
    response += `- **各組樣本數**: ${args.groups.map(g => g.length).join(", ")}\n\n`;

    // 組間比較分析
    response += "## 📊 組間比較分析\n\n";
    response += this.generateGroupComparison(args.groups, groupLabels);

    // 異常值檢測
    response += "## 🔍 異常值檢測\n\n";
    response += this.generateOutlierAnalysis(args.groups, groupLabels);

    // 分佈特徵比較
    response += "## 📋 分佈特徵比較\n\n";
    response += this.generateDistributionComparison(args.groups, groupLabels);

    // 場景化解釋
    if (args.context?.scenario) {
      response += "## 🎭 場景分析\n\n";
      response += this.generateContextualInterpretation(
        args.groups,
        groupLabels,
        args.context.scenario,
        args.context.comparison_type,
        args.context.variable_name,
      );
    }

    // 統計檢定建議
    response += "## 💡 統計檢定建議\n\n";
    response += this.generateStatisticalTestRecommendations(args.groups);

    // 成功信息
    response += "## ✅ 創建狀態\n\n";
    response += `盒鬚圖已成功創建！${boxplotResult.reasoning}\n\n`;
    
    // 圖片資訊
    if (args.generate_image && boxplotResult.has_image) {
      response += "## 🖼️ 圖片資訊\n\n";
      response += `- **圖片格式**: ${boxplotResult.image_format.toUpperCase()}\n`;
      response += `- **Base64 編碼**: 已生成（${boxplotResult.image_base64?.length || 0} 字符）\n`;
      response += `- **圖片狀態**: 可直接在前端顯示或儲存為檔案\n\n`;
    }
    
    response += "💡 **盒鬚圖說明**: 適合比較多組數據的分佈、檢測異常值，是組間比較分析的最佳視覺化工具\n";

    return response;
  }

  /**
   * 生成各組統計量
   */
  generateGroupStatistics(groups) {
    return groups.map((group, index) => {
      const sorted = [...group].sort((a, b) => a - b);
      const n = group.length;
      const mean = group.reduce((sum, val) => sum + val, 0) / n;
      const variance = group.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
      const std = Math.sqrt(variance);

      return {
        group_index: index,
        size: n,
        min: Math.min(...group),
        q1: this.calculatePercentile(sorted, 25),
        median: this.calculateMedian(sorted),
        q3: this.calculatePercentile(sorted, 75),
        max: Math.max(...group),
        mean: mean,
        std: std,
        iqr: this.calculatePercentile(sorted, 75) - this.calculatePercentile(sorted, 25),
      };
    });
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
   * 生成組間比較分析
   */
  generateGroupComparison(groups, groupLabels) {
    const stats = this.generateGroupStatistics(groups);
    let comparison = "";

    // 中位數比較
    comparison += "**中位數比較**:\n";
    const medianRanking = stats
      .map((stat, i) => ({ index: i, median: stat.median, label: groupLabels[i] }))
      .sort((a, b) => b.median - a.median);

    medianRanking.forEach((item, rank) => {
      comparison += `${rank + 1}. ${item.label}: ${item.median.toFixed(2)}\n`;
    });

    comparison += "\n**變異性比較**:\n";
    const iqrRanking = stats
      .map((stat, i) => ({ index: i, iqr: stat.iqr, label: groupLabels[i] }))
      .sort((a, b) => a.iqr - b.iqr);

    iqrRanking.forEach((item, rank) => {
      comparison += `${rank + 1}. ${item.label}: IQR = ${item.iqr.toFixed(2)} (變異性${rank === 0 ? '最小' : rank === iqrRanking.length - 1 ? '最大' : '中等'})\n`;
    });

    comparison += "\n";
    return comparison;
  }

  /**
   * 生成異常值分析
   */
  generateOutlierAnalysis(groups, groupLabels) {
    let analysis = "";
    let hasOutliers = false;

    groups.forEach((group, index) => {
      const sorted = [...group].sort((a, b) => a - b);
      const q1 = this.calculatePercentile(sorted, 25);
      const q3 = this.calculatePercentile(sorted, 75);
      const iqr = q3 - q1;
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;

      const outliers = group.filter(val => val < lowerFence || val > upperFence);

      if (outliers.length > 0) {
        hasOutliers = true;
        analysis += `**${groupLabels[index]}**:\n`;
        analysis += `- 發現 ${outliers.length} 個異常值: ${outliers.map(v => v.toFixed(2)).join(", ")}\n`;
        analysis += `- 正常範圍: ${lowerFence.toFixed(2)} - ${upperFence.toFixed(2)}\n\n`;
      }
    });

    if (!hasOutliers) {
      analysis += "✅ 各組均未發現明顯異常值\n\n";
    } else {
      analysis += "⚠️ **建議**: 檢查異常值是否為測量錯誤或特殊情況\n\n";
    }

    return analysis;
  }

  /**
   * 生成分佈特徵比較
   */
  generateDistributionComparison(groups, groupLabels) {
    const stats = this.generateGroupStatistics(groups);
    let comparison = "";

    comparison += "| 組別 | 平均值 | 中位數 | 標準差 | IQR |\n";
    comparison += "|------|--------|--------|--------|-----|\n";

    stats.forEach((stat, index) => {
      comparison += `| ${groupLabels[index]} | ${stat.mean.toFixed(2)} | ${stat.median.toFixed(2)} | ${stat.std.toFixed(2)} | ${stat.iqr.toFixed(2)} |\n`;
    });

    comparison += "\n";

    // 分佈形狀比較
    comparison += "**分佈對稱性**:\n";
    stats.forEach((stat, index) => {
      const skewness = (stat.mean - stat.median) / stat.std;
      let shape = "";
      if (Math.abs(skewness) < 0.1) {
        shape = "對稱分佈 ✅";
      } else if (skewness > 0.1) {
        shape = "右偏分佈 ⚠️";
      } else {
        shape = "左偏分佈 ⚠️";
      }
      comparison += `- ${groupLabels[index]}: ${shape}\n`;
    });

    comparison += "\n";
    return comparison;
  }

  /**
   * 生成比較分析
   */
  generateComparisonAnalysis(groups) {
    const stats = this.generateGroupStatistics(groups);
    
    // 判斷組間是否有明顯差異
    const medians = stats.map(s => s.median);
    const maxMedian = Math.max(...medians);
    const minMedian = Math.min(...medians);
    const medianRange = maxMedian - minMedian;
    
    // 計算平均 IQR 作為變異性參考
    const avgIQR = stats.reduce((sum, s) => sum + s.iqr, 0) / stats.length;
    
    return {
      median_range: medianRange,
      avg_iqr: avgIQR,
      suggests_difference: medianRange > avgIQR * 0.5,
      max_median_group: stats.findIndex(s => s.median === maxMedian),
      min_median_group: stats.findIndex(s => s.median === minMedian),
    };
  }

  /**
   * 生成情境化解釋
   */
  generateContextualInterpretation(groups, groupLabels, scenario, comparisonType, variableName = "測量值") {
    let interpretation = "";
    const compAnalysis = this.generateComparisonAnalysis(groups);

    if (scenario === "medical") {
      interpretation += `**醫療分析解釋**:\n`;
      if (comparisonType === "treatment_groups") {
        interpretation += `不同治療方案對${variableName}的影響比較:\n`;
        if (compAnalysis.suggests_difference) {
          interpretation += `- 治療方案間存在明顯差異，${groupLabels[compAnalysis.max_median_group]}組效果最佳\n`;
          interpretation += `- 建議進行統計檢定確認差異的顯著性\n`;
        } else {
          interpretation += `- 各治療方案效果相近，可能需要更大樣本或更長觀察期\n`;
        }
      }
    } else if (scenario === "education") {
      interpretation += `**教育分析解釋**:\n`;
      if (comparisonType === "teaching_methods") {
        interpretation += `不同教學方法對${variableName}的影響比較:\n`;
        if (compAnalysis.suggests_difference) {
          interpretation += `- 教學方法間存在差異，${groupLabels[compAnalysis.max_median_group]}方法表現最佳\n`;
          interpretation += `- 建議分析最佳方法的特徵並推廣應用\n`;
        } else {
          interpretation += `- 各教學方法效果相似，可根據資源和實施便利性選擇\n`;
        }
      }
    } else if (scenario === "quality") {
      interpretation += `**品質控制解釋**:\n`;
      if (comparisonType === "product_batches") {
        interpretation += `不同批次${variableName}的品質比較:\n`;
        if (compAnalysis.suggests_difference) {
          interpretation += `- 批次間存在品質差異，需要檢查生產流程\n`;
          interpretation += `- 特別關注${groupLabels[compAnalysis.max_median_group]}和${groupLabels[compAnalysis.min_median_group]}批次的差異原因\n`;
        } else {
          interpretation += `- 各批次品質穩定一致，生產流程控制良好\n`;
        }
      }
    }

    interpretation += "\n";
    return interpretation;
  }

  /**
   * 生成統計檢定建議
   */
  generateStatisticalTestRecommendations(groups) {
    let recommendations = "";

    recommendations += "**適合的統計檢定**:\n";

    if (groups.length === 2) {
      recommendations += "**雙組比較**:\n";
      recommendations += "- Mann-Whitney U 檢定 (非參數，推薦) 📊\n";
      recommendations += "- 獨立樣本 t 檢定 (若數據常態分佈) 📈\n";
    } else {
      recommendations += "**多組比較**:\n";
      recommendations += "- Kruskal-Wallis 檢定 (非參數，推薦) 📊\n";
      recommendations += "- 單因子 ANOVA (若數據常態分佈) 📈\n";
    }

    recommendations += "\n**前置檢查**:\n";
    recommendations += "- 建議先進行常態性檢定 (Shapiro-Wilk)\n";
    recommendations += "- 檢查變異數齊性 (Levene檢定)\n";
    recommendations += "- 確認樣本獨立性\n\n";

    recommendations += "**後續分析**:\n";
    if (groups.length > 2) {
      recommendations += "- 若發現顯著差異，建議進行事後檢定 (post-hoc test)\n";
    }
    recommendations += "- 建議配合直方圖檢視各組分佈特徵\n";
    recommendations += "- 計算效果量評估實務意義\n";

    return recommendations;
  }
}