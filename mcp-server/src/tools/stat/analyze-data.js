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
        } else if (suggestion.test === "mann_whitney") {
          report += this.generateMannWhitneyGuidance(suggestion, dataStructure);
        } else if (suggestion.test === "wilcoxon") {
          report += this.generateWilcoxonGuidance(suggestion, dataStructure);
        } else if (suggestion.test === "kruskal_wallis") {
          report += this.generateKruskalWallisGuidance(suggestion, dataStructure);
        }

        // 添加視覺化建議
        report += this.generateVisualizationSuggestions(suggestion.test);

        report += "\n";
      });

      // 最佳建議
      if (suggestions.recommendation) {
        const best = suggestions.recommendation;
        report += "## 🌟 最佳建議\n\n";
        report += `基於數據特徵，**${this.getTestDisplayName(best.test)}** 是最適合的分析方法。\n\n`;
        
        // 提供具體的執行建議
        report += this.generateExecutionPlan(best, dataStructure);
        
        report += `\n**下一步**: 請使用 \`perform_${best.test}\` 工具進行具體分析。\n\n`;
      }
    } else {
      report +=
        "⚠️ 未能找到適合的統計檢定方法。請檢查數據格式或提供更多背景資訊。\n\n";
    }

    // 數據品質檢查
    report += "## ✅ 數據品質與統計假設建議\n\n";

    // 使用增強的品質檢查，如果有最佳建議則傳入檢定類型
    const bestTest = suggestions.recommendation?.test;
    const qualityChecks = this.performEnhancedQualityChecks(dataStructure, bestTest);
    qualityChecks.forEach(check => {
      report += `${check}\n\n`;
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
      ttest: "T檢定 (參數檢定)",
      chisquare: "卡方檢定 (分類數據)",
      anova: "ANOVA 變異數分析 (參數檢定)",
      mann_whitney: "Mann-Whitney U 檢定 (非參數檢定)",
      wilcoxon: "Wilcoxon 符號等級檢定 (非參數配對檢定)",
      kruskal_wallis: "Kruskal-Wallis 檢定 (非參數多組檢定)",
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

  /**
   * 生成 Mann-Whitney U 檢定使用指導
   * @param {Object} suggestion - 檢定建議
   * @param {Object} dataStructure - 數據結構
   * @returns {string} 使用指導
   */
  generateMannWhitneyGuidance(suggestion, dataStructure) {
    const numericCol = dataStructure.columns.find(col => col.type === "numeric");
    const categoricalCol = dataStructure.columns.find(
      col => col.type === "categorical" && col.uniqueCount === 2
    );

    let guidance = "**使用指導**:\n";
    guidance += `- 將 "${numericCol?.name}" 作為測量變數\n`;
    guidance += `- 將 "${categoricalCol?.name}" 作為分組變數 (兩組比較)\n`;
    guidance += `- 適用於數據不符合常態分佈或樣本大小不足的情況\n`;
    guidance += `- 比較兩組的分佈位置是否相同\n`;

    return guidance;
  }

  /**
   * 生成 Wilcoxon 符號等級檢定使用指導
   * @param {Object} suggestion - 檢定建議
   * @param {Object} dataStructure - 數據結構
   * @returns {string} 使用指導
   */
  generateWilcoxonGuidance(suggestion, dataStructure) {
    const numericCols = dataStructure.columns
      .filter(col => col.type === "numeric")
      .slice(0, 2);

    let guidance = "**使用指導**:\n";
    guidance += `- 比較 "${numericCols[0]?.name}" 和 "${numericCols[1]?.name}" 的配對差異\n`;
    guidance += `- 適用於配對樣本且數據不符合常態分佈的情況\n`;
    guidance += `- 檢驗配對差異的中位數是否為零\n`;
    guidance += `- 常用於前後測設計或配對實驗\n`;

    return guidance;
  }

  /**
   * 生成 Kruskal-Wallis 檢定使用指導
   * @param {Object} suggestion - 檢定建議
   * @param {Object} dataStructure - 數據結構
   * @returns {string} 使用指導
   */
  generateKruskalWallisGuidance(suggestion, dataStructure) {
    const numericCol = dataStructure.columns.find(col => col.type === "numeric");
    const groupCol = dataStructure.columns.find(
      col => col.type === "categorical" && col.uniqueCount > 2
    );

    let guidance = "**使用指導**:\n";
    guidance += `- 將 "${numericCol?.name}" 作為測量變數\n`;
    guidance += `- 將 "${groupCol?.name}" 作為因子變數 (${groupCol?.uniqueCount} 組)\n`;
    guidance += `- 適用於多組比較且數據不符合 ANOVA 假設的情況\n`;
    guidance += `- 非參數版本的單因子 ANOVA\n`;

    return guidance;
  }

  /**
   * 生成視覺化建議
   * @param {string} testName - 檢定名稱
   * @returns {string} 視覺化建議
   */
  generateVisualizationSuggestions(testName) {
    let suggestions = "\n**📊 建議視覺化**:\n";

    const visualizationMap = {
      ttest: [
        "直方圖 (histogram) - 檢查數據分佈",
        "盒鬚圖 (boxplot) - 比較兩組數據",
        "Q-Q圖 (qq_plot) - 檢驗常態性"
      ],
      anova: [
        "盒鬚圖 (boxplot) - 多組數據比較",
        "直方圖 (histogram) - 檢查整體分佈",
        "殘差圖 (residual_plot) - 檢驗 ANOVA 假設"
      ],
      mann_whitney: [
        "盒鬚圖 (boxplot) - 組間分佈比較",
        "直方圖 (histogram) - 整體分佈檢查",
        "等級圖 (rank_plot) - 等級分佈顯示"
      ],
      wilcoxon: [
        "差異直方圖 (difference_histogram) - 配對差異分佈",
        "配對散點圖 (paired_scatter) - 前後測關係",
        "盒鬚圖 (boxplot) - 前後測比較"
      ],
      kruskal_wallis: [
        "盒鬚圖 (boxplot) - 多組分佈比較",
        "直方圖 (histogram) - 整體分佈檢查",
        "等級圖 (rank_plot) - 等級分佈顯示"
      ],
      chisquare: [
        "長條圖 (bar_chart) - 觀察vs期望頻率",
        "殘差圖 (residual_plot) - 標準化殘差",
        "馬賽克圖 (mosaic_plot) - 列聯表結構"
      ]
    };

    const charts = visualizationMap[testName] || [];
    charts.forEach(chart => {
      suggestions += `- ${chart}\n`;
    });

    suggestions += `\n💡 **使用方式**: 在檢定參數中加入 \`visualizations\` 設定:\n`;
    suggestions += `\`\`\`json\n`;
    suggestions += `"visualizations": {\n`;
    suggestions += `  "include_charts": true,\n`;
    suggestions += `  "chart_types": ["${charts[0]?.split(' ')[0] || 'histogram'}"],\n`;
    suggestions += `  "generate_image": true,\n`;
    suggestions += `  "image_format": "png"\n`;
    suggestions += `}\n`;
    suggestions += `\`\`\`\n`;

    return suggestions;
  }

  /**
   * 增強的數據品質和統計假設檢查
   * @param {Object} dataStructure - 數據結構
   * @param {string} testType - 建議的檢定類型
   * @returns {Array} 詳細的檢查建議
   */
  performEnhancedQualityChecks(dataStructure, testType = null) {
    const checks = [];

    // 基本數據品質檢查
    if (dataStructure.rowCount < 10) {
      checks.push("🚨 樣本大小極小 (< 10)，統計結果可能不可靠");
    } else if (dataStructure.rowCount < 30) {
      checks.push("⚠️ 樣本大小較小 (< 30)，建議考慮非參數檢定");
    } else {
      checks.push("✅ 樣本大小適中，適合統計分析");
    }

    // 針對特定檢定的建議
    if (testType) {
      const parametricTests = ['ttest', 'anova'];
      const nonParametricTests = ['mann_whitney', 'wilcoxon', 'kruskal_wallis'];

      if (parametricTests.includes(testType)) {
        checks.push("📋 **參數檢定假設檢查**:");
        checks.push("  - 確認數據近似常態分佈 (可用 Shapiro-Wilk 檢定)");
        checks.push("  - 檢查變異數齊性 (可用 Levene 檢定)");
        checks.push("  - 確保觀察值獨立");
        checks.push("💡 若假設不滿足，建議改用對應的非參數檢定");
      }

      if (nonParametricTests.includes(testType)) {
        checks.push("📋 **非參數檢定優勢**:");
        checks.push("  - 不需要常態分佈假設");
        checks.push("  - 對異常值較不敏感");
        checks.push("  - 適用於序位數據");
      }
    }

    // 數據類型特定檢查
    const numericColumns = dataStructure.columns.filter(col => col.type === "numeric");
    const categoricalColumns = dataStructure.columns.filter(col => col.type === "categorical");

    if (numericColumns.length === 0) {
      checks.push("⚠️ 沒有數值變數，只能進行分類數據分析");
    }

    if (categoricalColumns.length === 0) {
      checks.push("💡 沒有分類變數，主要適用於描述性統計或相關分析");
    }

    // 分組變數檢查
    categoricalColumns.forEach(col => {
      if (col.uniqueCount === 2) {
        checks.push(`✅ "${col.name}" 適合雙組比較 (T檢定或Mann-Whitney U)`);
      } else if (col.uniqueCount > 2 && col.uniqueCount <= 10) {
        checks.push(`✅ "${col.name}" 適合多組比較 (ANOVA或Kruskal-Wallis)`);
      } else if (col.uniqueCount > 10) {
        checks.push(`⚠️ "${col.name}" 類別過多 (${col.uniqueCount})，不適合作為分組變數`);
      }
    });

    return checks;
  }

  /**
   * 生成詳細的執行計劃
   * @param {Object} recommendation - 最佳建議
   * @param {Object} dataStructure - 數據結構
   * @returns {string} 執行計劃
   */
  generateExecutionPlan(recommendation, dataStructure) {
    let plan = "**📋 詳細執行計劃**:\n\n";
    
    // 步驟1: 數據準備
    plan += "1. **數據準備階段**:\n";
    plan += "   - 檢查缺失值並決定處理方式\n";
    plan += "   - 檢查異常值並評估是否需要處理\n";
    plan += "   - 確保數據格式正確\n\n";

    // 步驟2: 假設檢驗 (針對參數檢定)
    const parametricTests = ['ttest', 'anova'];
    if (parametricTests.includes(recommendation.test)) {
      plan += "2. **統計假設檢驗**:\n";
      plan += "   - 常態性檢定 (Shapiro-Wilk 或 Kolmogorov-Smirnov)\n";
      plan += "   - 變異數齊性檢定 (Levene's test)\n";
      plan += "   - 若假設違反，考慮轉換數據或改用非參數檢定\n\n";
    } else {
      plan += "2. **非參數檢定優勢**:\n";
      plan += "   - 無需常態分佈假設\n";
      plan += "   - 對異常值較不敏感\n";
      plan += "   - 適用於序位數據\n\n";
    }

    // 步驟3: 執行檢定
    plan += "3. **執行統計檢定**:\n";
    plan += `   - 使用 \`perform_${recommendation.test}\` 工具\n`;
    plan += "   - 設定適當的顯著水準 (通常為 0.05)\n";
    plan += "   - 加入視覺化參數以獲得圖表\n\n";

    // 步驟4: 結果解釋
    plan += "4. **結果解釋與報告**:\n";
    plan += "   - 檢視 p 值和統計量\n";
    plan += "   - 分析效果量的實際意義\n";
    plan += "   - 結合視覺化圖表進行解釋\n";
    plan += "   - 考慮實務上的重要性\n\n";

    // 特定檢定的額外建議
    if (recommendation.test === 'anova' || recommendation.test === 'kruskal_wallis') {
      plan += "5. **後續分析建議**:\n";
      plan += "   - 若檢定結果顯著，進行事後檢定 (post-hoc tests)\n";
      plan += "   - 多重比較校正 (Bonferroni, FDR 等)\n";
      plan += "   - 識別具體的組間差異\n\n";
    }

    // 示例程式碼
    plan += "**💻 參考程式碼範例**:\n";
    plan += this.generateCodeExample(recommendation.test, dataStructure);

    return plan;
  }

  /**
   * 生成程式碼範例
   * @param {string} testName - 檢定名稱
   * @param {Object} dataStructure - 數據結構
   * @returns {string} 程式碼範例
   */
  generateCodeExample(testName, dataStructure) {
    const numericCol = dataStructure.columns.find(col => col.type === "numeric");
    const categoricalCol = dataStructure.columns.find(col => col.type === "categorical");

    let example = "```json\n";
    example += "{\n";
    example += `  "tool": "perform_${testName}",\n`;
    example += "  \"data\": {\n";

    switch (testName) {
      case 'ttest':
        if (categoricalCol?.uniqueCount === 2) {
          example += "    \"test_type\": \"independent\",\n";
          example += `    \"group_column\": \"${categoricalCol.name}\",\n`;
          example += `    \"value_column\": \"${numericCol?.name}\"\n`;
        } else {
          const numericCols = dataStructure.columns.filter(col => col.type === "numeric").slice(0, 2);
          example += "    \"test_type\": \"paired\",\n";
          example += `    \"sample1\": \"${numericCols[0]?.name}\",\n`;
          example += `    \"sample2\": \"${numericCols[1]?.name}\"\n`;
        }
        break;
      
      case 'mann_whitney':
        example += `    \"group_column\": \"${categoricalCol?.name}\",\n`;
        example += `    \"value_column\": \"${numericCol?.name}\",\n`;
        example += "    \"alternative\": \"two-sided\"\n";
        break;
      
      case 'anova':
      case 'kruskal_wallis':
        example += `    \"group_column\": \"${categoricalCol?.name}\",\n`;
        example += `    \"value_column\": \"${numericCol?.name}\"\n`;
        break;
      
      case 'wilcoxon':
        const numericCols = dataStructure.columns.filter(col => col.type === "numeric").slice(0, 2);
        example += `    \"sample1\": \"${numericCols[0]?.name}\",\n`;
        example += `    \"sample2\": \"${numericCols[1]?.name}\"\n`;
        break;
      
      case 'chisquare':
        const catCols = dataStructure.columns.filter(col => col.type === "categorical").slice(0, 2);
        example += `    \"variable1\": \"${catCols[0]?.name}\",\n`;
        example += `    \"variable2\": \"${catCols[1]?.name}\"\n`;
        break;
    }

    example += "  },\n";
    example += "  \"visualizations\": {\n";
    example += "    \"include_charts\": true,\n";
    example += "    \"chart_types\": [\"boxplot\", \"histogram\"],\n";
    example += "    \"generate_image\": true,\n";
    example += "    \"image_format\": \"png\"\n";
    example += "  }\n";
    example += "}\n";
    example += "```\n";

    return example;
  }
}
