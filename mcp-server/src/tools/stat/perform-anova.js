/**
 * ANOVA 檢定 MCP 工具
 *
 * 支援單因子變異數分析
 * 提供智能數據分析和結果解釋
 */

import statService from "../../services/stat/stat-service.js";
import logger from "../../config/logger.js";

export const performANOVA = {
  name: "perform_anova",
  description: "執行單因子變異數分析 (One-way ANOVA)",
  inputSchema: {
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
          description: {
            type: "string",
            description: "研究問題描述",
          },
          variable_names: {
            type: "object",
            properties: {
              dependent_variable: { type: "string", description: "依變數名稱" },
              independent_variable: {
                type: "string",
                description: "自變數名稱",
              },
              group_names: {
                type: "array",
                items: { type: "string" },
                description: "各組名稱",
              },
            },
          },
        },
      },
    },
    required: ["data"],
  },
};

export async function handlePerformANOVA(args) {
  try {
    logger.info("收到 ANOVA 檢定請求", {
      groupCount: args.data.groups?.length,
      groupSizes: args.data.groups?.map(g => g.length),
      scenario: args.context?.scenario,
    });

    // 驗證輸入數據
    if (!args.data.groups || args.data.groups.length < 2) {
      throw new Error("至少需要 2 個組別的數據");
    }

    // 檢查每組是否有足夠的數據
    args.data.groups.forEach((group, index) => {
      if (!group || group.length < 2) {
        throw new Error(`第 ${index + 1} 組必須包含至少 2 個數值`);
      }
    });

    // 執行 ANOVA 檢定
    const result = await statService.performANOVA(args.data, args.context);

    // 產生報告
    const report = generateANOVAReport(result, args.data, args.context);

    logger.info("ANOVA 檢定完成", {
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
    logger.error("ANOVA 檢定執行失敗", { error: error.message });

    return {
      content: [
        {
          type: "text",
          text: `ANOVA 檢定執行失敗: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

function generateANOVAReport(result, inputData, context) {
  const {
    statistic,
    p_value,
    degrees_of_freedom,
    reject_null,
    interpretation,
  } = result;

  // 取得變數名稱
  const varNames = context?.variable_names || {};
  const depVar = varNames.dependent_variable || "依變數";
  const indepVar = varNames.independent_variable || "組別";
  const groupNames =
    varNames.group_names || inputData.groups.map((_, i) => `組別${i + 1}`);

  let report = `# 單因子變異數分析 (One-way ANOVA) 報告\n\n`;

  // 分析描述
  if (context?.description) {
    report += `## 研究問題\n${context.description}\n\n`;
  }

  // 假設設定
  report += `## 假設設定\n`;
  report += `- **虛無假設 (H₀)**: 所有組別的平均數相等 (μ₁ = μ₂ = ... = μₖ)\n`;
  report += `- **對立假設 (H₁)**: 至少有一組的平均數與其他組不同\n`;
  report += `- **顯著水準 (α)**: ${inputData.alpha || 0.05}\n\n`;

  // 描述性統計
  report += `## 描述性統計\n`;
  report += `| ${indepVar} | 樣本數 | 平均數 | 標準差 |\n`;
  report += `|---------|--------|--------|--------|\n`;

  inputData.groups.forEach((group, index) => {
    const n = group.length;
    const mean = group.reduce((sum, val) => sum + val, 0) / n;
    const variance =
      group.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);

    report += `| ${groupNames[index]} | ${n} | ${mean.toFixed(3)} | ${std.toFixed(3)} |\n`;
  });
  report += `\n`;

  // 檢定結果
  report += `## ANOVA 檢定結果\n`;
  report += `- **F統計量**: ${statistic.toFixed(4)}\n`;

  if (degrees_of_freedom) {
    const dfBetween = degrees_of_freedom.between || degrees_of_freedom[0];
    const dfWithin = degrees_of_freedom.within || degrees_of_freedom[1];
    report += `- **自由度**: 組間 = ${dfBetween}, 組內 = ${dfWithin}\n`;
  }

  report += `- **p值**: ${p_value.toFixed(6)}\n`;
  report += `- **結論**: ${reject_null ? "拒絕虛無假設" : "不拒絕虛無假設"}\n\n`;

  // 統計解釋
  report += `## 統計解釋\n`;
  report += `${interpretation.summary}\n\n`;

  // 效果量 (如果有的話)
  if (result.effect_size) {
    report += `## 效果量\n`;
    report += `**Eta-squared (η²)**: ${result.effect_size.toFixed(4)}\n`;
    const effectInterpretation = getEtaSquaredInterpretation(
      result.effect_size,
    );
    report += `效果量為${effectInterpretation}，表示組別因子解釋的變異量比例。\n\n`;
  }

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

  // 後續分析建議
  if (reject_null) {
    report += `## 後續分析建議\n`;
    report += `由於發現組間存在顯著差異，建議進行事後比較 (Post-hoc tests) 以確定具體哪些組別間存在差異：\n`;
    report += `- Tukey HSD 檢定 (控制整體型一錯誤率)\n`;
    report += `- Bonferroni 校正\n`;
    report += `- Scheffé 檢定 (較保守)\n\n`;
  }

  // 注意事項
  report += `## 注意事項\n`;
  report += `- ANOVA 假設各組變異數相等 (同質性假設)\n`;
  report += `- ANOVA 假設資料呈常態分佈\n`;
  report += `- ANOVA 假設各觀察值相互獨立\n`;
  if (reject_null) {
    report += `- ANOVA 只能告訴我們組間存在差異，無法指出具體哪些組不同\n`;
  }

  return report;
}

function getEtaSquaredInterpretation(etaSquared) {
  if (etaSquared < 0.01) return "微弱";
  if (etaSquared < 0.06) return "小";
  if (etaSquared < 0.14) return "中等";
  return "大";
}
