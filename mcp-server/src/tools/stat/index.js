/**
 * 統計分析工具註冊
 *
 * 註冊所有統計相關的 MCP 工具
 */

import { performTTest, handlePerformTTest } from "./perform-ttest.js";
import { analyzeData, handleAnalyzeData } from "./analyze-data.js";
import {
  performChiSquare,
  handlePerformChiSquare,
} from "./perform-chisquare.js";
import { performANOVA, handlePerformANOVA } from "./perform-anova.js";

// 導出所有工具定義
export const tools = [
  performTTest,
  analyzeData,
  performChiSquare,
  performANOVA,
];

// 導出工具處理器映射
export const handlers = {
  perform_ttest: handlePerformTTest,
  analyze_data: handleAnalyzeData,
  perform_chisquare: handlePerformChiSquare,
  perform_anova: handlePerformANOVA,
};

// 工具類別資訊
export const toolsInfo = {
  category: "統計分析",
  description: "提供各種統計假設檢定和數據分析功能",
  tools: [
    {
      name: "perform_ttest",
      displayName: "T檢定分析",
      description: "執行單樣本、雙樣本獨立或配對 T檢定",
      examples: [
        "比較兩組學生的考試成績",
        "分析藥物治療前後的效果",
        "檢測產品重量是否符合標準",
      ],
    },
    {
      name: "analyze_data",
      displayName: "智能數據分析",
      description: "分析 CSV 數據結構並建議適合的統計方法",
      examples: [
        "分析實驗數據並推薦統計檢定",
        "檢查數據品質和變數類型",
        "提供統計分析建議",
      ],
    },
    {
      name: "perform_chisquare",
      displayName: "卡方檢定分析",
      description: "執行卡方適合度檢定和獨立性檢定",
      examples: [
        "檢驗性別與職業選擇的關聯性",
        "分析顧客滿意度分佈是否符合預期",
        "檢測基因型頻率是否符合哈溫平衡",
      ],
    },
    {
      name: "perform_anova",
      displayName: "變異數分析",
      description: "執行單因子變異數分析 (One-way ANOVA)",
      examples: [
        "比較不同治療方法的療效",
        "分析不同教學法對學習成果的影響",
        "檢驗不同品牌產品的品質差異",
      ],
    },
  ],
};
