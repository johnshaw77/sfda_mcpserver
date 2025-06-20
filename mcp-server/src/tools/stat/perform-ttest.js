/**
 * T檢定 MCP 工具
 *
 * 支援單樣本、雙樣本獨立、配對 t 檢定
 * 提供智能數據分析和結果解釋
 */

import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

export const performTTest = {
  name: "perform_ttest",
  description: "執行 T 檢定分析，支援單樣本、雙樣本獨立、配對檢定",
  inputSchema: {
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
              sample1_name: { type: "string", description: "第一組數據名稱" },
              sample2_name: { type: "string", description: "第二組數據名稱" },
            },
          },
        },
      },
    },
    required: ["data"],
  },
};

export async function handlePerformTTest(args) {
  try {
    logger.info("收到 T檢定請求", {
      sample1Size: args.data.sample1?.length,
      sample2Size: args.data.sample2?.length,
      paired: args.data.paired,
      scenario: args.context?.scenario,
    });

    // 驗證輸入數據
    if (!args.data.sample1 || args.data.sample1.length < 2) {
      throw new Error("sample1 必須包含至少 2 個數值");
    }

    if (args.data.sample2 && args.data.sample2.length < 2) {
      throw new Error("sample2 必須包含至少 2 個數值");
    }

    if (
      args.data.paired &&
      (!args.data.sample2 ||
        args.data.sample1.length !== args.data.sample2.length)
    ) {
      throw new Error("配對檢定要求兩組樣本大小相同");
    }

    // 執行統計檢定
    const result = await statService.performTTest(
      args.data,
      args.context || {},
    );

    // 生成詳細報告
    const report = generateTTestReport(result, args);

    return {
      content: [
        {
          type: "text",
          text: report,
        },
      ],
    };
  } catch (error) {
    logger.error("T檢定執行失敗", { error: error.message, args });

    return {
      content: [
        {
          type: "text",
          text: `❌ T檢定執行失敗: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 生成 T檢定詳細報告
 * @param {Object} result - 檢定結果
 * @param {Object} args - 原始參數
 * @returns {string} 格式化報告
 */
function generateTTestReport(result, args) {
  const { data, context } = args;
  const {
    statistic,
    p_value,
    degrees_of_freedom,
    critical_value,
    reject_null,
    confidence_interval,
    interpretation,
  } = result;

  let report = "";

  // 標題和研究設計
  report += "# 📊 T檢定分析報告\n\n";

  if (context?.description) {
    report += `**研究問題**: ${context.description}\n\n`;
  }

  // 檢定類型
  let testType = "";
  if (!data.sample2) {
    testType = "單樣本 t 檢定";
  } else if (data.paired) {
    testType = "配對樣本 t 檢定";
  } else {
    testType = "獨立樣本 t 檢定";
  }

  report += `**檢定類型**: ${testType}\n\n`;

  // 描述性統計
  report += "## 📈 描述性統計\n\n";

  const sample1Name = context?.variable_names?.sample1_name || "樣本1";
  const sample2Name = context?.variable_names?.sample2_name || "樣本2";

  const mean1 = data.sample1.reduce((a, b) => a + b, 0) / data.sample1.length;
  report += `- **${sample1Name}**: 平均值 = ${mean1.toFixed(3)}, 樣本大小 = ${data.sample1.length}\n`;

  if (data.sample2) {
    const mean2 = data.sample2.reduce((a, b) => a + b, 0) / data.sample2.length;
    report += `- **${sample2Name}**: 平均值 = ${mean2.toFixed(3)}, 樣本大小 = ${data.sample2.length}\n`;
    report += `- **差異**: ${(mean1 - mean2).toFixed(3)}\n`;
  }

  report += "\n";

  // 假設設定
  report += "## 🎯 假設檢定\n\n";

  if (!data.sample2) {
    report += "- **虛無假設 H₀**: μ = 0 (母體平均數等於 0)\n";
    report += "- **對立假設 H₁**: ";
    switch (data.alternative) {
      case "two-sided":
        report += "μ ≠ 0 (母體平均數不等於 0)\n";
        break;
      case "less":
        report += "μ < 0 (母體平均數小於 0)\n";
        break;
      case "greater":
        report += "μ > 0 (母體平均數大於 0)\n";
        break;
    }
  } else {
    report += "- **虛無假設 H₀**: μ₁ = μ₂ (兩組平均數相等)\n";
    report += "- **對立假設 H₁**: ";
    switch (data.alternative) {
      case "two-sided":
        report += "μ₁ ≠ μ₂ (兩組平均數不相等)\n";
        break;
      case "less":
        report += "μ₁ < μ₂ (第一組平均數小於第二組)\n";
        break;
      case "greater":
        report += "μ₁ > μ₂ (第一組平均數大於第二組)\n";
        break;
    }
  }

  report += `- **顯著水準 α**: ${data.alpha || 0.05}\n\n`;

  // 檢定結果
  report += "## 📊 檢定結果\n\n";
  report += `- **t 統計量**: ${statistic.toFixed(4)}\n`;
  report += `- **自由度**: ${degrees_of_freedom}\n`;
  report += `- **p 值**: ${p_value.toFixed(6)}\n`;
  report += `- **臨界值**: ±${critical_value.toFixed(4)}\n`;

  if (confidence_interval) {
    report += `- **95% 信賴區間**: [${confidence_interval[0].toFixed(4)}, ${confidence_interval[1].toFixed(4)}]\n`;
  }

  report += "\n";

  // 統計結論
  report += "## 🎯 統計結論\n\n";
  report += `**決策**: ${reject_null ? "🔴 拒絕虛無假設" : "🟢 不拒絕虛無假設"}\n\n`;
  report += `**結論**: ${interpretation.summary}\n\n`;

  // 實務意義
  if (interpretation.practical_significance) {
    report += "## 💡 實務意義\n\n";
    report += `${interpretation.practical_significance}\n\n`;
  }

  // 建議
  if (
    interpretation.recommendations &&
    interpretation.recommendations.length > 0
  ) {
    report += "## 📋 建議\n\n";
    interpretation.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += "\n";
  }

  // 效果量解釋
  if (data.sample2) {
    const pooledStd = Math.sqrt(
      ((data.sample1.length - 1) *
        Math.pow(getStandardDeviation(data.sample1), 2) +
        (data.sample2.length - 1) *
          Math.pow(getStandardDeviation(data.sample2), 2)) /
        (data.sample1.length + data.sample2.length - 2),
    );
    const cohensD =
      Math.abs(
        mean1 - data.sample2.reduce((a, b) => a + b, 0) / data.sample2.length,
      ) / pooledStd;

    report += "## 📏 效果量\n\n";
    report += `**Cohen's d**: ${cohensD.toFixed(3)}\n`;
    report += `**效果大小**: ${getEffectSizeInterpretation(cohensD)}\n\n`;
  }

  return report;
}

/**
 * 計算標準差
 * @param {Array} data - 數據陣列
 * @returns {number} 標準差
 */
function getStandardDeviation(data) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance =
    data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (data.length - 1);
  return Math.sqrt(variance);
}

/**
 * 解釋效果量大小
 * @param {number} cohensD - Cohen's d 值
 * @returns {string} 效果量解釋
 */
function getEffectSizeInterpretation(cohensD) {
  if (cohensD < 0.2) return "微小效果";
  if (cohensD < 0.5) return "小效果";
  if (cohensD < 0.8) return "中等效果";
  return "大效果";
}
