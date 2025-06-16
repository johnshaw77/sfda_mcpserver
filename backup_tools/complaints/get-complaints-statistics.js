/**
 * 客訴管理工具：客訴統計分析
 *
 * 提供客訴的統計分析功能，包括狀態分佈、優先級分佈、類型分佈等
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import complaintsService from "../../services/complaints/complaints-service.js";
import logger from "../../config/logger.js";

/**
 * 客訴統計分析工具
 */
export class GetComplaintsStatisticsTool extends BaseTool {
  constructor() {
    super(
      "get_complaints_statistics",
      "取得客訴統計分析資料，包括按狀態、優先級、類型的分佈統計，支援日期範圍篩選",
      {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "統計開始日期（YYYY-MM-DD 格式，選填）",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2024-01-01",
          },
          endDate: {
            type: "string",
            description: "統計結束日期（YYYY-MM-DD 格式，選填）",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2024-12-31",
          },
        },
        required: [],
      },
      {
        cacheable: true,
        cacheTimeout: 600, // 10分鐘快取
      },
    );
  }

  /**
   * 執行客訴統計分析
   */
  async _execute(params, options) {
    const { startDate, endDate } = params;

    try {
      logger.info("開始查詢客訴統計", {
        toolName: this.name,
        dateRange: { startDate, endDate },
      });

      // 驗證日期格式
      if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new ToolExecutionError(
          "開始日期格式錯誤，請使用 YYYY-MM-DD 格式",
          ToolErrorType.VALIDATION_ERROR,
          { invalidDate: startDate },
        );
      }

      if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new ToolExecutionError(
          "結束日期格式錯誤，請使用 YYYY-MM-DD 格式",
          ToolErrorType.VALIDATION_ERROR,
          { invalidDate: endDate },
        );
      }

      // 驗證日期邏輯
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new ToolExecutionError(
          "開始日期不能晚於結束日期",
          ToolErrorType.VALIDATION_ERROR,
          { startDate, endDate },
        );
      }

      // 調用服務層取得統計資料
      const statistics = await complaintsService.getComplaintsStatistics({
        startDate,
        endDate,
      });

      // 格式化回應
      let responseText = `📊 **客訴統計分析報告**\n\n`;

      // 顯示統計期間
      if (startDate || endDate) {
        responseText += `📅 **統計期間:** `;
        if (startDate && endDate) {
          responseText += `${startDate} 至 ${endDate}\n`;
        } else if (startDate) {
          responseText += `${startDate} 至今\n`;
        } else {
          responseText += `截至 ${endDate}\n`;
        }
        responseText += "\n";
      } else {
        responseText += `📅 **統計期間:** 全部記錄\n\n`;
      }

      // 計算總數
      const totalByStatus = statistics.byStatus.reduce(
        (sum, item) => sum + item.count,
        0,
      );
      const totalByPriority = statistics.byPriority.reduce(
        (sum, item) => sum + item.count,
        0,
      );
      const totalByType = statistics.byType.reduce(
        (sum, item) => sum + item.count,
        0,
      );

      responseText += `📋 **總客訴數量:** ${totalByStatus} 筆\n\n`;

      // 狀態分佈統計
      if (statistics.byStatus.length > 0) {
        responseText += `🏷️ **按狀態分佈:**\n`;

        // 排序：按數量遞減
        const sortedByStatus = statistics.byStatus.sort(
          (a, b) => b.count - a.count,
        );

        sortedByStatus.forEach(item => {
          const percentage = ((item.count / totalByStatus) * 100).toFixed(1);
          const statusEmoji =
            {
              新建: "🆕",
              處理中: "⏳",
              待回覆: "💬",
              已解決: "✅",
              已關閉: "🔒",
              重新開啟: "🔄",
            }[item.status] || "📋";

          responseText += `  ${statusEmoji} ${item.status}: **${item.count}** 筆 (${percentage}%)\n`;
        });
        responseText += "\n";
      }

      // 優先級分佈統計
      if (statistics.byPriority.length > 0) {
        responseText += `⚡ **按優先級分佈:**\n`;

        // 自定義排序：緊急 > 高 > 中 > 低
        const priorityOrder = { 緊急: 1, 高: 2, 中: 3, 低: 4 };
        const sortedByPriority = statistics.byPriority.sort((a, b) => {
          return (
            (priorityOrder[a.priority_level] || 999) -
            (priorityOrder[b.priority_level] || 999)
          );
        });

        sortedByPriority.forEach(item => {
          const percentage = ((item.count / totalByPriority) * 100).toFixed(1);
          const priorityEmoji =
            {
              緊急: "🔴",
              高: "🟠",
              中: "🟡",
              低: "🟢",
            }[item.priority_level] || "⚪";

          responseText += `  ${priorityEmoji} ${item.priority_level}: **${item.count}** 筆 (${percentage}%)\n`;
        });
        responseText += "\n";
      }

      // 類型分佈統計
      if (statistics.byType.length > 0) {
        responseText += `📂 **按類型分佈:**\n`;

        // 排序：按數量遞減
        const sortedByType = statistics.byType.sort(
          (a, b) => b.count - a.count,
        );

        sortedByType.forEach(item => {
          const percentage = ((item.count / totalByType) * 100).toFixed(1);
          const typeEmoji =
            {
              產品品質: "🏭",
              服務態度: "🤝",
              交期延遲: "⏰",
              價格爭議: "💰",
              其他: "📄",
            }[item.complaint_type] || "📁";

          responseText += `  ${typeEmoji} ${item.complaint_type}: **${item.count}** 筆 (${percentage}%)\n`;
        });
        responseText += "\n";
      }

      // 重點分析
      responseText += `💡 **重點分析:**\n`;

      // 找出最多的狀態
      if (statistics.byStatus.length > 0) {
        const topStatus = statistics.byStatus.reduce((max, item) =>
          item.count > max.count ? item : max,
        );
        responseText += `• 最多客訴狀態: **${topStatus.status}** (${topStatus.count} 筆)\n`;
      }

      // 找出最多的優先級
      if (statistics.byPriority.length > 0) {
        const topPriority = statistics.byPriority.reduce((max, item) =>
          item.count > max.count ? item : max,
        );
        responseText += `• 最多優先級: **${topPriority.priority_level}** (${topPriority.count} 筆)\n`;
      }

      // 找出最多的類型
      if (statistics.byType.length > 0) {
        const topType = statistics.byType.reduce((max, item) =>
          item.count > max.count ? item : max,
        );
        responseText += `• 最多客訴類型: **${topType.complaint_type}** (${topType.count} 筆)\n`;
      }

      // 緊急或高優先級警示
      const urgentCount =
        statistics.byPriority.find(item => item.priority_level === "緊急")
          ?.count || 0;
      const highCount =
        statistics.byPriority.find(item => item.priority_level === "高")
          ?.count || 0;

      if (urgentCount > 0 || highCount > 0) {
        responseText += `\n⚠️ **注意事項:**\n`;
        if (urgentCount > 0) {
          responseText += `• 🔴 有 **${urgentCount}** 筆緊急客訴需要立即處理\n`;
        }
        if (highCount > 0) {
          responseText += `• 🟠 有 **${highCount}** 筆高優先級客訴需要優先關注\n`;
        }
      }

      responseText += `\n📅 **報告產生時間:** ${new Date(statistics.generatedAt).toLocaleString("zh-TW")}`;

      logger.info("客訴統計查詢完成", {
        toolName: this.name,
        dateRange: { startDate, endDate },
        totalComplaints: totalByStatus,
        statusTypes: statistics.byStatus.length,
        priorityTypes: statistics.byPriority.length,
        complaintTypes: statistics.byType.length,
      });

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }

      logger.error("客訴統計查詢失敗", {
        toolName: this.name,
        dateRange: { startDate, endDate },
        error: error.message,
        stack: error.stack,
      });

      throw new ToolExecutionError(
        `查詢客訴統計時發生錯誤: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        {
          originalError: error.message,
          dateRange: { startDate, endDate },
        },
      );
    }
  }
}

export default new GetComplaintsStatisticsTool();
