/**
 * 智能 CSV 統計分析工具
 * 
 * 自動解析 CSV 數據，理解自然語言問題，並執行適當的統計分析
 * 支援治療效果分析、教學方法比較、產品品質檢測等場景
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

export class ParseCSVTTestTool extends BaseTool {
  constructor() {
    super(
      "parse_csv_ttest",
      "智能分析 CSV 數據並執行統計檢定，支援自然語言問題理解",
      {
        type: "object",
        properties: {
          csvData: {
            type: "string",
            description: "CSV 格式的數據內容，包含標題行",
          },
          question: {
            type: "string",
            description: "用戶的研究問題或分析需求（自然語言）",
            examples: [
              "治療方案對降低血壓的影響",
              "新藥物是否有效",
              "兩種教學方法哪個更好",
              "產品重量是否符合標準"
            ]
          },
          testType: {
            type: "string",
            enum: ["auto", "paired", "independent", "one-sample"],
            default: "auto",
            description: "檢定類型：auto(自動判斷)、paired(配對)、independent(獨立)、one-sample(單樣本)",
          },
          alpha: {
            type: "number",
            default: 0.05,
            minimum: 0.001,
            maximum: 0.1,
            description: "顯著水準",
          },
          alternative: {
            type: "string",
            enum: ["two-sided", "less", "greater"],
            default: "auto",
            description: "對立假設類型，auto 表示根據問題自動判斷",
          },
        },
        required: ["csvData"],
      },
      "stat",
    );
  }

  async _execute(params) {
    try {
      logger.info("開始智能 CSV 統計分析", {
        dataLength: params.csvData?.length,
        question: params.question,
        testType: params.testType,
      });

      // 1. 解析 CSV 數據
      const parsedData = this.parseCSV(params.csvData);
      logger.info("CSV 解析完成", {
        rowCount: parsedData.rows.length,
        columnCount: parsedData.headers.length,
        headers: parsedData.headers,
      });

      // 2. 智能分析數據結構和問題
      const analysisConfig = this.analyzeDataAndQuestion(parsedData, params.question);
      logger.info("智能分析完成", { analysisConfig });

      // 3. 提取數據樣本
      const { sample1, sample2 } = this.extractSamples(
        parsedData,
        analysisConfig.column1,
        analysisConfig.column2,
      );

      // 4. 確定統計參數
      const statisticalParams = this.determineStatisticalParams(
        params,
        analysisConfig,
        sample1,
        sample2
      );

      // 5. 執行統計檢定
      const result = await statService.performTTest(
        statisticalParams.data,
        statisticalParams.context,
      );

      // 6. 生成用戶友好的報告
      const report = this.generateUserFriendlyReport(
        parsedData,
        analysisConfig,
        statisticalParams,
        result,
        params.question,
      );

      return {
        success: true,
        data: {
          analysis_understanding: {
            detected_scenario: analysisConfig.scenario,
            test_type: analysisConfig.testType,
            columns_used: {
              column1: analysisConfig.column1,
              column2: analysisConfig.column2,
            },
            sample_sizes: {
              sample1: sample1.length,
              sample2: sample2?.length || 0,
            },
          },
          statistical_result: result,
          user_friendly_report: report,
          raw_data_summary: {
            total_rows: parsedData.rows.length,
            headers: parsedData.headers,
            sample_preview: parsedData.rows.slice(0, 3),
          },
        },
      };
    } catch (error) {
      logger.error("智能 CSV 統計分析失敗", {
        error: error.message,
        params: JSON.stringify(params, null, 2),
      });

      throw new ToolExecutionError(
        `智能統計分析失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }

  /**
   * 解析 CSV 數據
   */
  parseCSV(csvData) {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error("CSV 數據至少需要包含標題行和一行數據");
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  }

  /**
   * 智能分析數據結構和用戶問題
   */
  analyzeDataAndQuestion(parsedData, question = "") {
    const headers = parsedData.headers;
    const numericColumns = this.identifyNumericColumns(parsedData);
    
    // 分析場景
    const scenario = this.detectScenario(headers, question);
    
    // 分析檢定類型和欄位
    const analysisResult = this.analyzeColumns(headers, numericColumns, question, scenario);
    
    return {
      scenario,
      testType: analysisResult.testType,
      column1: analysisResult.column1,
      column2: analysisResult.column2,
      alternative: analysisResult.alternative,
      description: analysisResult.description,
    };
  }

  /**
   * 檢測應用場景
   */
  detectScenario(headers, question) {
    const medicalKeywords = [
      'blood', 'pressure', '血壓', 'treatment', '治療', 'drug', '藥物', 
      'patient', '患者', 'medical', '醫療', 'therapy', '療法', 'clinical', '臨床'
    ];
    
    const educationKeywords = [
      'teaching', '教學', 'education', '教育', 'student', '學生', 'score', '分數',
      'exam', '考試', 'learning', '學習', 'method', '方法'
    ];
    
    const qualityKeywords = [
      'quality', '品質', 'weight', '重量', 'product', '產品', 'manufacturing', '製造',
      'control', '控制', 'standard', '標準', 'specification', '規格'
    ];

    const allText = (headers.join(' ') + ' ' + question).toLowerCase();
    
    if (medicalKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
      return 'medical';
    } else if (educationKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
      return 'education';
    } else if (qualityKeywords.some(keyword => allText.includes(keyword.toLowerCase()))) {
      return 'quality';
    }
    
    return 'general';
  }

  /**
   * 分析欄位和檢定類型
   */
  analyzeColumns(headers, numericColumns, question, scenario) {
    let column1 = null;
    let column2 = null;
    let testType = 'auto';
    let alternative = 'two-sided';
    let description = '';

    // 根據場景和欄位名稱智能識別
    if (scenario === 'medical') {
      // 醫療場景：尋找前後測量
      const beforeCol = headers.find(h => 
        /before|pre|前|治療前|用藥前|baseline/i.test(h)
      );
      const afterCol = headers.find(h => 
        /after|post|後|治療後|用藥後|followup|follow.up/i.test(h)
      );
      
      if (beforeCol && afterCol) {
        column1 = beforeCol;
        column2 = afterCol;
        testType = 'paired';
        description = '配對樣本 t 檢定：比較治療前後的差異';
        
        // 檢測方向性
        if (question && /降低|減少|下降|改善/i.test(question)) {
          alternative = 'greater'; // 期望治療前 > 治療後
        }
      }
    } else if (scenario === 'education') {
      // 教育場景：尋找分組比較
      const groupCol = headers.find(h => 
        /group|method|type|class|組|方法|類型/i.test(h)
      );
      const scoreCol = headers.find(h => 
        /score|grade|result|performance|分數|成績|結果|表現/i.test(h)
      );
      
      if (groupCol && scoreCol) {
        // 需要進一步分析是否為獨立樣本
        testType = 'independent';
        description = '獨立樣本 t 檢定：比較不同組別的表現';
      }
    } else if (scenario === 'quality') {
      // 品質場景：通常是單樣本檢定
      const measureCol = numericColumns.find(h => 
        /weight|length|size|measure|重量|長度|尺寸|測量/i.test(h)
      );
      
      if (measureCol) {
        column1 = measureCol;
        testType = 'one-sample';
        description = '單樣本 t 檢定：檢測是否符合標準值';
      }
    }

    // 如果沒有特定場景匹配，使用通用邏輯
    if (!column1 && numericColumns.length >= 1) {
      column1 = numericColumns[0];
      
      if (numericColumns.length >= 2) {
        column2 = numericColumns[1];
        testType = 'paired'; // 默認假設為配對
        description = '配對樣本 t 檢定：比較兩個相關測量值';
      } else {
        testType = 'one-sample';
        description = '單樣本 t 檢定：檢測平均值是否等於假設值';
      }
    }

    return {
      column1,
      column2,
      testType,
      alternative,
      description,
    };
  }

  /**
   * 識別數值欄位
   */
  identifyNumericColumns(parsedData) {
    const numericColumns = [];

    for (const header of parsedData.headers) {
      // 跳過明顯的 ID 欄位
      if (/id|編號|序號/i.test(header)) {
        continue;
      }

      let numericCount = 0;
      let totalCount = 0;

      for (const row of parsedData.rows) {
        const value = row[header];
        if (value !== null && value !== undefined && value !== '') {
          totalCount++;
          if (!isNaN(parseFloat(value))) {
            numericCount++;
          }
        }
      }

      // 如果超過 80% 的值是數值，則認為是數值欄位
      if (totalCount > 0 && numericCount / totalCount > 0.8) {
        numericColumns.push(header);
      }
    }

    return numericColumns;
  }

  /**
   * 提取樣本數據
   */
  extractSamples(parsedData, column1, column2) {
    const sample1 = [];
    const sample2 = [];

    for (const row of parsedData.rows) {
      const value1 = parseFloat(row[column1]);
      if (!isNaN(value1)) {
        sample1.push(value1);

        if (column2) {
          const value2 = parseFloat(row[column2]);
          if (!isNaN(value2)) {
            sample2.push(value2);
          }
        }
      }
    }

    if (sample1.length < 2) {
      throw new Error(`欄位 '${column1}' 的有效數值少於 2 個`);
    }

    if (column2 && sample2.length < 2) {
      throw new Error(`欄位 '${column2}' 的有效數值少於 2 個`);
    }

    return { 
      sample1, 
      sample2: column2 ? sample2 : null 
    };
  }

  /**
   * 確定統計參數
   */
  determineStatisticalParams(params, analysisConfig, sample1, sample2) {
    const alternative = params.alternative === 'auto' ? 
      analysisConfig.alternative : params.alternative;

    return {
      data: {
        sample1,
        sample2,
        paired: analysisConfig.testType === 'paired',
        alpha: params.alpha || 0.05,
        alternative,
      },
      context: {
        scenario: analysisConfig.scenario,
        description: analysisConfig.description,
        variable_names: {
          sample1_name: analysisConfig.column1,
          sample2_name: analysisConfig.column2,
        },
      },
    };
  }

  /**
   * 生成用戶友好的報告
   */
  generateUserFriendlyReport(parsedData, analysisConfig, statisticalParams, result, userQuestion) {
    const { scenario, testType, column1, column2 } = analysisConfig;
    const { alpha } = statisticalParams.data;
    const isSignificant = result.p_value < alpha;

    let report = `# 📊 統計分析報告\n\n`;

    // 用戶問題理解
    if (userQuestion) {
      report += `## 🤔 您的問題\n\n`;
      report += `**研究問題**: ${userQuestion}\n\n`;
    }

    // AI 理解總結
    report += `## 🧠 AI 分析理解\n\n`;
    report += `- **檢測到的場景**: ${this.getScenarioDescription(scenario)}\n`;
    report += `- **使用的統計方法**: ${this.getTestTypeDescription(testType)}\n`;
    report += `- **分析的數據欄位**: ${column1}${column2 ? ` vs ${column2}` : ''}\n`;
    report += `- **樣本大小**: ${statisticalParams.data.sample1.length}${statisticalParams.data.sample2 ? ` vs ${statisticalParams.data.sample2.length}` : ''} 筆記錄\n\n`;

    // 快速結論
    report += `## 🎯 快速結論\n\n`;
    
    if (scenario === 'medical' && testType === 'paired') {
      const sample1Mean = statisticalParams.data.sample1.reduce((a, b) => a + b, 0) / statisticalParams.data.sample1.length;
      const sample2Mean = statisticalParams.data.sample2.reduce((a, b) => a + b, 0) / statisticalParams.data.sample2.length;
      const difference = sample1Mean - sample2Mean;
      
      if (isSignificant) {
        report += `✅ **治療效果顯著**: 統計分析顯示治療前後有顯著差異 (p = ${result.p_value.toFixed(4)})。\n\n`;
        report += `📈 **效果大小**: 平均改善了 ${Math.abs(difference).toFixed(1)} 個單位`;
        if (difference > 0) {
          report += ` (治療前較高，顯示治療有效)。\n\n`;
        } else {
          report += ` (治療後較高)。\n\n`;
        }
        
        report += `💡 **實務意義**: 這個治療方案在統計上顯示有效，建議可以考慮在臨床實務中應用。\n\n`;
      } else {
        report += `❌ **治療效果不明顯**: 統計分析顯示治療前後沒有顯著差異 (p = ${result.p_value.toFixed(4)})。\n\n`;
        report += `💡 **實務意義**: 目前的證據不足以支持這個治療方案的有效性，可能需要：\n`;
        report += `- 調整治療劑量或方案\n`;
        report += `- 延長治療時間\n`;
        report += `- 增加樣本大小\n`;
        report += `- 考慮其他治療方法\n\n`;
      }
    } else if (scenario === 'education') {
      if (isSignificant) {
        report += `✅ **教學效果有差異**: 統計分析顯示不同方法有顯著差異 (p = ${result.p_value.toFixed(4)})。\n\n`;
        report += `💡 **教育建議**: 建議採用效果較好的教學方法。\n\n`;
      } else {
        report += `❌ **教學效果無差異**: 統計分析顯示不同方法沒有顯著差異 (p = ${result.p_value.toFixed(4)})。\n\n`;
        report += `💡 **教育建議**: 可以根據其他因素（如成本、資源）選擇教學方法。\n\n`;
      }
    } else if (scenario === 'quality') {
      if (isSignificant) {
        report += `⚠️ **品質異常**: 統計分析顯示測量值偏離標準 (p = ${result.p_value.toFixed(4)})。\n\n`;
        report += `💡 **品質建議**: 需要檢查生產流程，找出異常原因。\n\n`;
      } else {
        report += `✅ **品質正常**: 統計分析顯示測量值符合標準 (p = ${result.p_value.toFixed(4)})。\n\n`;
        report += `💡 **品質建議**: 生產流程正常，品質控制良好。\n\n`;
      }
    } else {
      // 通用結論
      if (isSignificant) {
        report += `✅ **發現顯著差異**: 統計分析顯示有顯著差異 (p = ${result.p_value.toFixed(4)})。\n\n`;
      } else {
        report += `❌ **未發現顯著差異**: 統計分析顯示沒有顯著差異 (p = ${result.p_value.toFixed(4)})。\n\n`;
      }
    }

    // 詳細統計結果
    report += `## 📈 詳細統計結果\n\n`;
    report += `- **t 統計量**: ${result.statistic.toFixed(4)}\n`;
    report += `- **自由度**: ${result.degrees_of_freedom}\n`;
    report += `- **p 值**: ${result.p_value.toFixed(6)}\n`;
    report += `- **顯著水準**: α = ${alpha}\n`;
    
    if (result.confidence_interval) {
      report += `- **95% 信賴區間**: [${result.confidence_interval[0].toFixed(4)}, ${result.confidence_interval[1].toFixed(4)}]\n`;
    }
    
    // 效果量資訊
    if (result.effect_size !== null && result.effect_size !== undefined) {
      report += `- **效果量 (Cohen's d)**: ${result.effect_size.toFixed(4)}\n`;
      if (result.effect_size_interpretation) {
        report += `- **效果大小**: ${result.effect_size_interpretation}\n`;
      }
    }
    
    report += `\n`;

    // 數據摘要
    report += `## 📊 數據摘要\n\n`;
    const sample1Mean = statisticalParams.data.sample1.reduce((a, b) => a + b, 0) / statisticalParams.data.sample1.length;
    const sample1Std = Math.sqrt(
      statisticalParams.data.sample1.reduce((a, b) => a + Math.pow(b - sample1Mean, 2), 0) / 
      (statisticalParams.data.sample1.length - 1)
    );

    report += `**${column1}**:\n`;
    report += `- 樣本數: ${statisticalParams.data.sample1.length}\n`;
    report += `- 平均值: ${sample1Mean.toFixed(2)}\n`;
    report += `- 標準差: ${sample1Std.toFixed(2)}\n\n`;

    if (statisticalParams.data.sample2) {
      const sample2Mean = statisticalParams.data.sample2.reduce((a, b) => a + b, 0) / statisticalParams.data.sample2.length;
      const sample2Std = Math.sqrt(
        statisticalParams.data.sample2.reduce((a, b) => a + Math.pow(b - sample2Mean, 2), 0) / 
        (statisticalParams.data.sample2.length - 1)
      );

      report += `**${column2}**:\n`;
      report += `- 樣本數: ${statisticalParams.data.sample2.length}\n`;
      report += `- 平均值: ${sample2Mean.toFixed(2)}\n`;
      report += `- 標準差: ${sample2Std.toFixed(2)}\n\n`;
    }

    return report;
  }

  /**
   * 獲取場景描述
   */
  getScenarioDescription(scenario) {
    const descriptions = {
      'medical': '醫療/臨床研究',
      'education': '教育/學習研究', 
      'quality': '品質控制/製造',
      'general': '一般統計分析',
    };
    return descriptions[scenario] || scenario;
  }

  /**
   * 獲取檢定類型描述
   */
  getTestTypeDescription(testType) {
    const descriptions = {
      'paired': '配對樣本 t 檢定',
      'independent': '獨立樣本 t 檢定',
      'one-sample': '單樣本 t 檢定',
    };
    return descriptions[testType] || testType;
  }
} 