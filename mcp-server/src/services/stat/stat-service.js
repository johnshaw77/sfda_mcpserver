/**
 * 統計分析服務實作
 *
 * 提供各種統計假設檢定功能，包括 T檢定、卡方檢定、ANOVA 等
 * 支援智能數據分析和結果解釋
 */

import logger from "../../config/logger.js";
import fetch from "node-fetch";

class StatService {
  constructor() {
    this.apiBaseUrl = "http://localhost:8000/api/v1";
  }

  /**
   * 執行 T 檢定
   * @param {Object} data - 檢定數據
   * @param {Array} data.sample1 - 樣本1數據
   * @param {Array} data.sample2 - 樣本2數據 (可選)
   * @param {boolean} data.paired - 是否為配對檢定
   * @param {number} data.alpha - 顯著水準 (預設 0.05)
   * @param {string} data.alternative - 對立假設 (預設 "two-sided")
   * @param {Object} context - 分析上下文
   * @returns {Object} 檢定結果和解釋
   */
  async performTTest(data, context = {}) {
    try {
      logger.info("開始執行 T 檢定", {
        sampleSizes: [data.sample1?.length, data.sample2?.length],
        paired: data.paired,
        context: context.scenario,
      });

      // 調用 FastAPI 進行統計計算
      const apiResult = await this.callStatAPI("/inferential/ttest", {
        sample1: data.sample1,
        sample2: data.sample2,
        paired: data.paired || false,
        alpha: data.alpha || 0.05,
        alternative: data.alternative || "two-sided",
      });

      // 解釋結果
      const interpretation = this.interpretTTestResult(
        apiResult,
        data,
        context,
      );

      return {
        ...apiResult,
        interpretation,
        context,
      };
    } catch (error) {
      logger.error("T 檢定執行失敗", { error: error.message });
      throw new Error(`T 檢定執行失敗: ${error.message}`);
    }
  }

  /**
   * 執行卡方檢定
   * @param {Object} data - 檢定數據
   * @param {Array} data.observed - 觀察值矩陣
   * @param {Array} data.expected - 期望值矩陣 (可選)
   * @param {Object} context - 分析上下文
   * @returns {Object} 檢定結果和解釋
   */
  async performChiSquareTest(data, context = {}) {
    try {
      logger.info("開始執行卡方檢定", {
        observedShape: [data.observed?.length, data.observed?.[0]?.length],
        context: context.scenario,
      });

      const apiResult = await this.callStatAPI("/inferential/chisquare", {
        observed: data.observed,
        expected: data.expected,
      });

      const interpretation = this.interpretChiSquareResult(
        apiResult,
        data,
        context,
      );

      return {
        ...apiResult,
        interpretation,
        context,
      };
    } catch (error) {
      logger.error("卡方檢定執行失敗", { error: error.message });
      throw new Error(`卡方檢定執行失敗: ${error.message}`);
    }
  }

  /**
   * 執行 ANOVA 檢定
   * @param {Object} data - 檢定數據
   * @param {Array} data.groups - 各組數據
   * @param {Object} context - 分析上下文
   * @returns {Object} 檢定結果和解釋
   */
  async performANOVA(data, context = {}) {
    try {
      logger.info("開始執行 ANOVA 檢定", {
        groupCount: data.groups?.length,
        groupSizes: data.groups?.map(g => g.length),
        context: context.scenario,
      });

      const apiResult = await this.callStatAPI("/inferential/anova", {
        groups: data.groups,
      });

      const interpretation = this.interpretANOVAResult(
        apiResult,
        data,
        context,
      );

      return {
        ...apiResult,
        interpretation,
        context,
      };
    } catch (error) {
      logger.error("ANOVA 檢定執行失敗", { error: error.message });
      throw new Error(`ANOVA 檢定執行失敗: ${error.message}`);
    }
  }

  /**
   * 執行 ANOVA 檢定（新版本，與其他檢定方法一致）
   * @param {Object} data - 檢定數據
   * @param {Array} data.groups - 各組數據
   * @param {number} data.alpha - 顯著水準
   * @returns {Object} 檢定結果
   */
  async performANOVATest(data) {
    try {
      logger.info("執行 ANOVA 檢定", {
        groupCount: data.groups?.length,
        alpha: data.alpha,
      });

      // 調用 FastAPI 進行統計計算
      const apiResult = await this.callStatAPI("/inferential/anova", {
        groups: data.groups,
      });

      return {
        ...apiResult,
        alpha: data.alpha || 0.05,
      };
    } catch (error) {
      logger.error("ANOVA 檢定執行失敗", { error: error.message });
      throw new Error(`ANOVA 檢定執行失敗: ${error.message}`);
    }
  }

  /**
   * 智能分析 CSV 數據結構
   * @param {string} csvData - CSV 數據內容
   * @returns {Object} 數據分析結果
   */
  async analyzeDataStructure(csvData) {
    try {
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",");
      const dataRows = lines.slice(1).map(line => line.split(","));

      const analysis = {
        rowCount: dataRows.length,
        columnCount: headers.length,
        columns: headers.map((header, index) => {
          const values = dataRows.map(row => row[index]);
          const numericValues = values.filter(v => !isNaN(parseFloat(v)));

          return {
            name: header.trim(),
            type:
              numericValues.length > values.length * 0.8
                ? "numeric"
                : "categorical",
            sampleValues: values.slice(0, 3),
            uniqueCount: new Set(values).size,
          };
        }),
      };

      logger.info("數據結構分析完成", { analysis });
      return analysis;
    } catch (error) {
      logger.error("數據結構分析失敗", { error: error.message });
      throw new Error(`數據結構分析失敗: ${error.message}`);
    }
  }

  /**
   * 智能建議適合的統計檢定
   * @param {Object} dataStructure - 數據結構分析結果
   * @param {Object} context - 分析上下文
   * @returns {Object} 檢定建議
   */
  async suggestAppropriateTest(dataStructure, context = {}) {
    try {
      const numericColumns = dataStructure.columns.filter(
        col => col.type === "numeric",
      );
      const categoricalColumns = dataStructure.columns.filter(
        col => col.type === "categorical",
      );

      let suggestions = [];

      // T檢定建議
      if (numericColumns.length >= 1) {
        if (
          categoricalColumns.length === 1 &&
          categoricalColumns[0].uniqueCount === 2
        ) {
          suggestions.push({
            test: "ttest",
            type: "independent",
            confidence: 0.9,
            reason: "發現一個數值變數和一個二分類變數，適合獨立樣本 t 檢定",
          });
        }

        if (numericColumns.length >= 2) {
          suggestions.push({
            test: "ttest",
            type: "paired",
            confidence: 0.8,
            reason: "發現多個數值變數，可能適合配對 t 檢定",
          });
        }
      }

      // 卡方檢定建議
      if (categoricalColumns.length >= 2) {
        suggestions.push({
          test: "chisquare",
          type: "independence",
          confidence: 0.85,
          reason: "發現多個分類變數，適合卡方獨立性檢定",
        });
      }

      // ANOVA檢定建議
      if (numericColumns.length >= 1 && categoricalColumns.length >= 1) {
        const groupVar = categoricalColumns.find(col => col.uniqueCount > 2);
        if (groupVar) {
          suggestions.push({
            test: "anova",
            type: "oneway",
            confidence: 0.85,
            reason: `發現數值變數和多組分類變數(${groupVar.uniqueCount}組)，適合單因子 ANOVA`,
          });
        }
      }

      // 按信心度排序
      suggestions.sort((a, b) => b.confidence - a.confidence);

      logger.info("統計檢定建議完成", { suggestions });
      return {
        dataStructure,
        suggestions,
        recommendation: suggestions[0] || null,
      };
    } catch (error) {
      logger.error("統計檢定建議失敗", { error: error.message });
      throw new Error(`統計檢定建議失敗: ${error.message}`);
    }
  }

  /**
   * 解釋 T 檢定結果
   * @param {Object} result - API 回傳結果
   * @param {Object} data - 原始數據
   * @param {Object} context - 分析上下文
   * @returns {Object} 結果解釋
   */
  interpretTTestResult(result, data, context) {
    const { statistic, p_value, reject_null, confidence_interval } = result;

    let interpretation = {
      summary: "",
      conclusion: "",
      practical_significance: "",
      recommendations: [],
    };

    // 基本結論
    if (reject_null) {
      interpretation.summary = `在 α=${data.alpha || 0.05} 的顯著水準下，拒絕虛無假設，具有統計上的顯著差異`;
      interpretation.conclusion = "有統計上的顯著差異";
    } else {
      interpretation.summary = `在 α=${data.alpha || 0.05} 的顯著水準下，不拒絕虛無假設，沒有統計上的顯著差異`;
      interpretation.conclusion = "沒有統計上的顯著差異";
    }

    // 根據情境提供實用建議
    if (context.scenario) {
      switch (context.scenario.toLowerCase()) {
        case "medical":
        case "treatment":
          if (reject_null) {
            interpretation.practical_significance =
              "治療效果顯著，具有臨床意義";
            interpretation.recommendations.push(
              "建議考慮將此治療方案納入標準療程",
            );
          } else {
            interpretation.practical_significance = "治療效果不明顯";
            interpretation.recommendations.push(
              "可能需要調整劑量或考慮其他治療方案",
            );
          }
          break;
        case "education":
        case "teaching":
          if (reject_null) {
            interpretation.practical_significance = "教學方法效果顯著不同";
            interpretation.recommendations.push("建議採用效果較好的教學方法");
          } else {
            interpretation.practical_significance = "教學方法效果無顯著差異";
            interpretation.recommendations.push(
              "可根據其他因素(成本、資源)選擇教學方法",
            );
          }
          break;
        case "quality":
        case "manufacturing":
          if (reject_null) {
            interpretation.practical_significance = "產品品質偏離標準規格";
            interpretation.recommendations.push("需要立即檢查生產線設定");
          } else {
            interpretation.practical_significance = "產品品質符合標準規格";
            interpretation.recommendations.push("生產過程正常，品質控制良好");
          }
          break;
        default:
          interpretation.practical_significance = reject_null
            ? "發現顯著差異"
            : "未發現顯著差異";
      }
    }

    return interpretation;
  }

  /**
   * 解釋卡方檢定結果
   * @param {Object} result - API 回傳結果
   * @param {Object} data - 原始數據
   * @param {Object} context - 分析上下文
   * @returns {Object} 結果解釋
   */
  interpretChiSquareResult(result, data, context) {
    const { statistic, p_value, reject_null } = result;

    return {
      summary: reject_null ? "變數間存在顯著關聯性" : "變數間不存在顯著關聯性",
      conclusion: reject_null ? "有關聯性" : "無關聯性",
      practical_significance: reject_null
        ? "發現變數間的依賴關係"
        : "變數間相互獨立",
    };
  }

  /**
   * 解釋 ANOVA 檢定結果
   * @param {Object} result - API 回傳結果
   * @param {Object} data - 原始數據
   * @param {Object} context - 分析上下文
   * @returns {Object} 結果解釋
   */
  interpretANOVAResult(result, data, context) {
    const { statistic, p_value, reject_null } = result;

    return {
      summary: reject_null ? "各組間存在顯著差異" : "各組間無顯著差異",
      conclusion: reject_null ? "組間有差異" : "組間無差異",
      practical_significance: reject_null
        ? "至少有一組的平均值與其他組顯著不同"
        : "所有組的平均值沒有顯著差異",
    };
  }

  /**
   * 執行 Mann-Whitney U 檢定
   * @param {Object} data - 檢定數據
   * @param {Array} data.sample1 - 樣本1數據
   * @param {Array} data.sample2 - 樣本2數據
   * @param {number} data.alpha - 顯著水準 (預設 0.05)
   * @param {string} data.alternative - 對立假設 (預設 "two-sided")
   * @param {Object} context - 分析上下文
   * @returns {Object} 檢定結果和解釋
   */
  async performMannWhitneyTest(data, context = {}) {
    try {
      logger.info("開始執行 Mann-Whitney U 檢定", {
        sample1Size: data.sample1?.length,
        sample2Size: data.sample2?.length,
        context: context.scenario,
      });

      const apiResult = await this.callStatAPI("/inferential/mann_whitney", {
        sample1: data.sample1,
        sample2: data.sample2,
        alpha: data.alpha || 0.05,
        alternative: data.alternative || "two-sided",
      });

      return {
        ...apiResult,
        context,
      };
    } catch (error) {
      logger.error("Mann-Whitney U 檢定執行失敗", { error: error.message });
      throw new Error(`Mann-Whitney U 檢定執行失敗: ${error.message}`);
    }
  }

  /**
   * 執行 Wilcoxon 符號等級檢定
   * @param {Object} data - 檢定數據
   * @param {Array} data.sample1 - 第一次測量數據
   * @param {Array} data.sample2 - 第二次測量數據
   * @param {number} data.alpha - 顯著水準 (預設 0.05)
   * @param {string} data.alternative - 對立假設 (預設 "two-sided")
   * @param {Object} context - 分析上下文
   * @returns {Object} 檢定結果和解釋
   */
  async performWilcoxonTest(data, context = {}) {
    try {
      logger.info("開始執行 Wilcoxon 符號等級檢定", {
        sample1Size: data.sample1?.length,
        sample2Size: data.sample2?.length,
        context: context.scenario,
      });

      const apiResult = await this.callStatAPI("/inferential/wilcoxon", {
        sample1: data.sample1,
        sample2: data.sample2,
        alpha: data.alpha || 0.05,
        alternative: data.alternative || "two-sided",
      });

      return {
        ...apiResult,
        context,
      };
    } catch (error) {
      logger.error("Wilcoxon 符號等級檢定執行失敗", { error: error.message });
      throw new Error(`Wilcoxon 符號等級檢定執行失敗: ${error.message}`);
    }
  }

  /**
   * 執行 Kruskal-Wallis 檢定
   * @param {Object} data - 檢定數據
   * @param {Array} data.groups - 各組數據
   * @param {number} data.alpha - 顯著水準 (預設 0.05)
   * @param {Object} context - 分析上下文
   * @returns {Object} 檢定結果和解釋
   */
  async performKruskalWallisTest(data, context = {}) {
    try {
      logger.info("開始執行 Kruskal-Wallis 檢定", {
        groupCount: data.groups?.length,
        groupSizes: data.groups?.map(g => g.length),
        context: context.scenario,
      });

      const apiResult = await this.callStatAPI("/inferential/kruskal_wallis", {
        groups: data.groups,
        alpha: data.alpha || 0.05,
      });

      return {
        ...apiResult,
        context,
      };
    } catch (error) {
      logger.error("Kruskal-Wallis 檢定執行失敗", { error: error.message });
      throw new Error(`Kruskal-Wallis 檢定執行失敗: ${error.message}`);
    }
  }

  /**
   * 調用統計 API
   * @param {string} endpoint - API 端點
   * @param {Object} payload - 請求數據
   * @returns {Object} API 回應
   */
  async callStatAPI(endpoint, payload) {
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `API 調用失敗: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      logger.info("統計 API 調用成功", { endpoint, status: response.status });

      return result;
    } catch (error) {
      logger.error("統計 API 調用失敗", { endpoint, error: error.message });
      throw error;
    }
  }
}

export default new StatService();
