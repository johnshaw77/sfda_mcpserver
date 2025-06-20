/**
 * 卡方檢定 MCP 工具
 *
 * 支援適合度檢定、獨立性檢定
 * 提供智能數據分析和結果解釋
 */

import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

export const performChiSquare = {
  name: "perform_chisquare",
  description: "執行卡方檢定分析，支援適合度檢定和獨立性檢定",
  inputSchema: {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          observed: {
            type: "array",
            description: "觀察頻數陣列 (一維或二維陣列)",
            items: {
              oneOf: [
                { type: "number" },
                { type: "array", items: { type: "number" } },
              ],
            },
            minItems: 2,
          },
          expected: {
            type: "array",
            description: "期望頻數陣列 (適合度檢定時使用)",
            items: { type: "number" },
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
        required: ["observed"],
      },
      context: {
        type: "object",
        properties: {
          scenario: {
            type: "string",
            description: "分析場景 (medical, survey, quality, business, etc.)",
            examples: ["medical", "survey", "quality", "business", "genetics"],
          },
          description: {
            type: "string",
            description: "研究問題描述",
          },
          variable_names: {
            type: "object",
            properties: {
              row_variable: { type: "string", description: "列變數名稱" },
              column_variable: { type: "string", description: "行變數名稱" },
              categories: {
                type: "array",
                items: { type: "string" },
                description: "類別名稱",
              },
            },
          },
        },
      },
    },
    required: ["data"],
  },
};

export async function handlePerformChiSquare(args) {
  try {
    logger.info("收到卡方檢定請求", {
      observedSize: args.data.observed?.length,
      hasExpected: !!args.data.expected,
      scenario: args.context?.scenario,
    });

    // 驗證輸入數據
    if (!args.data.observed || args.data.observed.length < 2) {
      throw new Error("observed 必須包含至少 2 個數值或頻數");
    }

    // 檢查是否為二維陣列 (獨立性檢定)
    const isContingencyTable = Array.isArray(args.data.observed[0]);

    if (isContingencyTable) {
      // 驗證列聯表
      const rows = args.data.observed.length;
      const cols = args.data.observed[0].length;

      if (rows < 2 || cols < 2) {
        throw new Error("列聯表必須至少為 2x2");
      }

      // 檢查所有列的長度是否一致
      const inconsistentRows = args.data.observed.some(
        row => row.length !== cols,
      );
      if (inconsistentRows) {
        throw new Error("列聯表的所有列必須具有相同的長度");
      }
    }

    // 執行卡方檢定
    const result = await statService.performChiSquareTest(
      args.data,
      args.context,
    );

    // 產生報告
    const report = generateChiSquareReport(result, args.data, args.context);

    logger.info("卡方檢定完成", {
      pValue: result.p_value,
      significant: result.reject_null,
    });

    return {
      content: [
        {
          type: "text",
          text: report,
        },
      ],
    };
  } catch (error) {
    logger.error("卡方檢定執行失敗", { error: error.message });

    return {
      content: [
        {
          type: "text",
          text: `卡方檢定執行失敗: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

function generateChiSquareReport(result, inputData, context) {
  const {
    statistic,
    p_value,
    degrees_of_freedom,
    reject_null,
    interpretation,
  } = result;
  const isContingencyTable = Array.isArray(inputData.observed[0]);
  const testType = isContingencyTable ? "獨立性檢定" : "適合度檢定";

  // 取得變數名稱
  const varNames = context?.variable_names || {};
  const rowVar = varNames.row_variable || "變數A";
  const colVar = varNames.column_variable || "變數B";
  const categories = varNames.categories || [];

  let report = `# 卡方檢定分析報告\n\n`;

  // 分析描述
  if (context?.description) {
    report += `## 研究問題\n${context.description}\n\n`;
  }

  report += `## 檢定類型\n${testType}\n\n`;

  // 假設設定
  report += `## 假設設定\n`;
  if (isContingencyTable) {
    report += `- **虛無假設 (H₀)**: ${rowVar} 和 ${colVar} 相互獨立\n`;
    report += `- **對立假設 (H₁)**: ${rowVar} 和 ${colVar} 存在關聯性\n`;
  } else {
    report += `- **虛無假設 (H₀)**: 觀察頻數符合期望分佈\n`;
    report += `- **對立假設 (H₁)**: 觀察頻數不符合期望分佈\n`;
  }
  report += `- **顯著水準 (α)**: ${inputData.alpha || 0.05}\n\n`;

  // 觀察數據
  report += `## 觀察數據\n`;
  if (isContingencyTable) {
    report += `**列聯表**:\n`;
    report += formatContingencyTable(inputData.observed, varNames);
  } else {
    report += `**觀察頻數**: ${inputData.observed.join(", ")}\n`;
    if (inputData.expected) {
      report += `**期望頻數**: ${inputData.expected.join(", ")}\n`;
    }
  }
  report += `\n`;

  // 檢定結果
  report += `## 檢定結果\n`;
  report += `- **卡方統計量 (χ²)**: ${statistic.toFixed(4)}\n`;
  report += `- **自由度 (df)**: ${degrees_of_freedom}\n`;
  report += `- **p值**: ${p_value.toFixed(6)}\n`;
  report += `- **結論**: ${reject_null ? "拒絕虛無假設" : "不拒絕虛無假設"}\n\n`;

  // 統計解釋
  report += `## 統計解釋\n`;
  report += `${interpretation.summary}\n\n`;

  // 實務意義
  if (interpretation.practical_significance) {
    report += `## 實務意義\n`;
    report += `${interpretation.practical_significance}\n\n`;
  }

  // 情境建議
  if (
    interpretation.recommendations &&
    interpretation.recommendations.length > 0
  ) {
    report += `## 建議\n`;
    interpretation.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += `\n`;
  }

  // 效果量解釋 (如果有的話)
  if (result.effect_size) {
    report += `## 效果量\n`;
    report += `**Cramér's V**: ${result.effect_size.toFixed(4)}\n`;
    const effectInterpretation = getEffectSizeInterpretation(
      result.effect_size,
    );
    report += `效果量為${effectInterpretation}，表示關聯性的強度。\n\n`;
  }

  // 注意事項
  report += `## 注意事項\n`;
  report += `- 卡方檢定要求所有期望頻數 ≥ 5\n`;
  report += `- 本檢定僅能檢驗關聯性，無法確定因果關係\n`;
  if (isContingencyTable) {
    report += `- 如發現顯著關聯，建議進一步分析殘差以了解關聯模式\n`;
  }

  return report;
}

function formatContingencyTable(observed, varNames) {
  let table = "```\n";

  const rows = observed.length;
  const cols = observed[0].length;

  // 表頭
  table += "       ";
  for (let j = 0; j < cols; j++) {
    table += `    ${varNames.categories?.[j] || `類別${j + 1}`}`.padEnd(8);
  }
  table += "\n";

  // 分隔線
  table += "-------";
  for (let j = 0; j < cols; j++) {
    table += "--------";
  }
  table += "\n";

  // 數據行
  for (let i = 0; i < rows; i++) {
    const rowName = varNames.categories?.[cols + i] || `組別${i + 1}`;
    table += rowName.padEnd(7);
    for (let j = 0; j < cols; j++) {
      table += `${observed[i][j]}`.padStart(8);
    }
    table += "\n";
  }

  table += "```\n";
  return table;
}

function getEffectSizeInterpretation(cramerV) {
  if (cramerV < 0.1) return "微弱";
  if (cramerV < 0.3) return "小";
  if (cramerV < 0.5) return "中等";
  return "大";
}
