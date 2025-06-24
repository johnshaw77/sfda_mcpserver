/**
 * 圖表創建 MCP 工具
 *
 * 提供各種圖表創建功能，支援圓餅圖、長條圖、折線圖
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import logger from "../../config/logger.js";

/**
 * 圖表創建工具
 */
export class CreateChartTool extends BaseTool {
  constructor() {
    super(
      "create_chart",
      "創建各種類型的圖表，包括圓餅圖、長條圖、折線圖",
      {
        type: "object",
        properties: {
          chart_type: {
            type: "string",
            enum: ["pie", "bar", "line"],
            description: "圖表類型: pie(圓餅圖), bar(長條圖), line(折線圖)",
          },
          labels: {
            type: "array",
            items: { type: "string" },
            description: "圖表標籤陣列",
            minItems: 1,
          },
          values: {
            type: "array",
            items: { type: "number" },
            description: "圖表數值陣列",
            minItems: 1,
          },
          title: {
            type: "string",
            description: "圖表標題",
          },
          x_axis_label: {
            type: "string",
            description: "X軸標籤 (適用於長條圖和折線圖)",
          },
          y_axis_label: {
            type: "string",
            description: "Y軸標籤 (適用於長條圖和折線圖)",
          },
        },
        required: ["chart_type", "labels", "values"],
      },
      "stat",
    );
  }

  async execute(args) {
    try {
      logger.info("收到圖表創建請求", {
        chartType: args.chart_type,
        dataPointsCount: args.labels?.length,
        title: args.title,
      });

      // 驗證輸入參數
      this.validateInput(args);

      // 調用統計分析服務創建圖表
      const chartResult = await this.createChartViaAPI(args);

      // 生成回應內容
      const response = this.generateChartResponse(chartResult, args);

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
        // 🎯 重要：返回圖表數據供前端使用
        _meta: {
          chart_data: chartResult,
          tool_type: "chart_creation",
          chart_type: args.chart_type,
        },
      };
    } catch (error) {
      logger.error("圖表創建失敗", {
        error: error.message,
        args: {
          chart_type: args.chart_type,
          labels_count: args.labels?.length,
          values_count: args.values?.length,
        },
      });

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      throw new ToolExecutionError(
        ToolErrorType.EXECUTION_ERROR,
        `圖表創建失敗: ${error.message}`,
      );
    }
  }

  /**
   * 驗證輸入參數
   */
  validateInput(args) {
    if (!args.chart_type) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "圖表類型不能為空",
      );
    }

    if (!["pie", "bar", "line"].includes(args.chart_type)) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        `不支援的圖表類型: ${args.chart_type}`,
      );
    }

    if (
      !args.labels ||
      !Array.isArray(args.labels) ||
      args.labels.length === 0
    ) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "標籤陣列不能為空",
      );
    }

    if (
      !args.values ||
      !Array.isArray(args.values) ||
      args.values.length === 0
    ) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "數值陣列不能為空",
      );
    }

    if (args.labels.length !== args.values.length) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "標籤和數值的數量必須相同",
      );
    }

    // 折線圖需要至少2個數據點
    if (args.chart_type === "line" && args.values.length < 2) {
      throw new ToolExecutionError(
        ToolErrorType.INVALID_INPUT,
        "折線圖至少需要2個數據點",
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
  }

  /**
   * 通過 API 創建圖表
   */
  async createChartViaAPI(args) {
    try {
      // 構建請求數據
      const requestData = {
        labels: args.labels,
        values: args.values,
        chart_type: args.chart_type,
        title: args.title,
      };

      // 調用統計分析服務的圖表 API
      const response = await fetch(
        "http://localhost:8000/api/v1/charts/simple",
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
        throw new Error(result.reasoning || "圖表創建失敗");
      }

      return result;
    } catch (error) {
      logger.error("圖表 API 調用失敗", { error: error.message });
      throw error;
    }
  }

  /**
   * 生成圖表回應內容
   */
  generateChartResponse(chartResult, args) {
    let response = "";

    // 標題
    const chartTypeNames = {
      pie: "圓餅圖",
      bar: "長條圖",
      line: "折線圖",
    };

    const chartTypeName = chartTypeNames[args.chart_type] || args.chart_type;
    response += `# 📊 ${chartTypeName}創建成功\n\n`;

    if (args.title) {
      response += `**圖表標題**: ${args.title}\n\n`;
    }

    // 數據概覽
    response += "## 📈 數據概覽\n\n";
    response += `- **圖表類型**: ${chartTypeName}\n`;
    response += `- **數據點數量**: ${args.labels.length}\n`;

    if (args.chart_type === "pie") {
      const total = args.values.reduce((sum, val) => sum + val, 0);
      response += `- **總值**: ${total}\n`;
    } else {
      const max = Math.max(...args.values);
      const min = Math.min(...args.values);
      response += `- **數值範圍**: ${min} - ${max}\n`;
    }

    response += "\n";

    // 數據詳情
    response += "## 📋 數據詳情\n\n";

    if (args.chart_type === "pie") {
      const total = args.values.reduce((sum, val) => sum + val, 0);
      args.labels.forEach((label, index) => {
        const value = args.values[index];
        const percentage = ((value / total) * 100).toFixed(1);
        response += `- **${label}**: ${value} (${percentage}%)\n`;
      });
    } else {
      args.labels.forEach((label, index) => {
        const value = args.values[index];
        response += `- **${label}**: ${value}\n`;
      });
    }

    response += "\n";

    // 成功信息
    response += "## ✅ 創建狀態\n\n";
    response += `圖表已成功創建！${chartResult.reasoning}\n\n`;

    if (args.chart_type === "pie") {
      response += "💡 **圓餅圖說明**: 適合展示各部分占整體的比例關係\n";
    } else if (args.chart_type === "bar") {
      response += "💡 **長條圖說明**: 適合比較不同類別的數值大小\n";
    } else if (args.chart_type === "line") {
      response +=
        "💡 **折線圖說明**: 適合展示數據隨時間或其他連續變量的變化趨勢\n";
    }

    return response;
  }
}
