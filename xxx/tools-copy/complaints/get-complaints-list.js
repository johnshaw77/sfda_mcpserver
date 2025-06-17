/**
 * 客訴管理工具：客訴列表查詢
 *
 * 提供客訴記錄的查詢和篩選功能
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import complaintsService from "../../services/complaints/complaints-service.js";
import logger from "../../config/logger.js";

/**
 * 客訴列表查詢工具
 */
export class GetComplaintsListTool extends BaseTool {
  constructor() {
    super(
      "get_complaints_list",
      "查詢客訴記錄列表，支援多種篩選條件，包括狀態、優先級、類型、負責人、客戶名稱和日期範圍",
      {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "客訴狀態篩選（選填）",
            enum: ["新建", "處理中", "待回覆", "已解決", "已關閉", "重新開啟"],
          },
          priorityLevel: {
            type: "string",
            description: "優先級篩選（選填）",
            enum: ["低", "中", "高", "緊急"],
          },
          complaintType: {
            type: "string",
            description: "客訴類型篩選（選填）",
            enum: ["產品品質", "服務態度", "交期延遲", "價格爭議", "其他"],
          },
          assignedTo: {
            type: "string",
            description: "負責人篩選（選填）",
            example: "張三",
          },
          customerName: {
            type: "string",
            description: "客戶名稱搜尋（模糊搜尋，選填）",
            example: "ABC公司",
          },
          startDate: {
            type: "string",
            description: "開始日期（YYYY-MM-DD 格式，選填）",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2024-01-01",
          },
          endDate: {
            type: "string",
            description: "結束日期（YYYY-MM-DD 格式，選填）",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2024-12-31",
          },
          limit: {
            type: "number",
            description: "查詢筆數限制（選填，預設不限制）",
            minimum: 1,
            maximum: 1000,
            example: 50,
          },
        },
        required: [],
      },
      {
        cacheable: true,
        cacheTimeout: 300, // 5分鐘快取
      },
    );
  }

  /**
   * 執行客訴列表查詢
   */
  async _execute(params, options) {
    const {
      status,
      priorityLevel,
      complaintType,
      assignedTo,
      customerName,
      startDate,
      endDate,
      limit,
    } = params;

    try {
      logger.info("開始查詢客訴列表", {
        toolName: this.name,
        filters: params,
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

      // 調用服務層查詢客訴列表
      const complaints = await complaintsService.getComplaintsList({
        status,
        priorityLevel,
        complaintType,
        assignedTo,
        customerName,
        startDate,
        endDate,
        limit,
      });

      // 格式化回應
      if (complaints.length === 0) {
        return {
          content: [
            {
              type: "text",
              text:
                "📝 **客訴查詢結果**\n\n🔍 查詢條件下沒有找到任何客訴記錄。\n\n**篩選條件:**\n" +
                (status ? `• 狀態: ${status}\n` : "") +
                (priorityLevel ? `• 優先級: ${priorityLevel}\n` : "") +
                (complaintType ? `• 類型: ${complaintType}\n` : "") +
                (assignedTo ? `• 負責人: ${assignedTo}\n` : "") +
                (customerName ? `• 客戶名稱: ${customerName}\n` : "") +
                (startDate ? `• 開始日期: ${startDate}\n` : "") +
                (endDate ? `• 結束日期: ${endDate}\n` : "") +
                "\n💡 **建議:** 嘗試調整篩選條件或擴大查詢範圍。",
            },
          ],
        };
      }

      // 建立詳細的客訴列表文字
      let responseText = `📝 **客訴查詢結果** (共 ${complaints.length} 筆)\n\n`;

      // 顯示篩選條件
      if (Object.keys(params).some(key => params[key] !== undefined)) {
        responseText += "🔍 **查詢條件:**\n";
        if (status) responseText += `• 狀態: ${status}\n`;
        if (priorityLevel) responseText += `• 優先級: ${priorityLevel}\n`;
        if (complaintType) responseText += `• 類型: ${complaintType}\n`;
        if (assignedTo) responseText += `• 負責人: ${assignedTo}\n`;
        if (customerName) responseText += `• 客戶名稱: ${customerName}\n`;
        if (startDate) responseText += `• 開始日期: ${startDate}\n`;
        if (endDate) responseText += `• 結束日期: ${endDate}\n`;
        responseText += "\n";
      }

      responseText += "📋 **客訴清單:**\n";

      complaints.forEach((complaint, index) => {
        const priorityEmoji =
          {
            緊急: "🔴",
            高: "🟠",
            中: "🟡",
            低: "🟢",
          }[complaint.priority_level] || "⚪";

        const statusEmoji =
          {
            新建: "🆕",
            處理中: "⏳",
            待回覆: "💬",
            已解決: "✅",
            已關閉: "🔒",
            重新開啟: "🔄",
          }[complaint.status] || "📋";

        responseText += `\n${index + 1}. **${complaint.voc_no}** ${statusEmoji}\n`;
        responseText += `   • 客戶: **${complaint.customer_name}**\n`;
        responseText += `   • 主旨: ${complaint.complaint_subject}\n`;
        responseText += `   • 類型: ${complaint.complaint_type}\n`;
        responseText += `   • 狀態: ${complaint.status}\n`;
        responseText += `   • 優先級: ${priorityEmoji} ${complaint.priority_level}\n`;
        if (complaint.assigned_to) {
          responseText += `   • 負責人: ${complaint.assigned_to}\n`;
        }
        responseText += `   • 建立時間: ${new Date(complaint.created_date).toLocaleString("zh-TW")}\n`;
        if (complaint.response_deadline) {
          responseText += `   • 回覆期限: ${new Date(complaint.response_deadline).toLocaleString("zh-TW")}\n`;
        }
      });

      if (limit && complaints.length >= limit) {
        responseText += `\n⚠️ **注意:** 查詢結果已達到限制 (${limit} 筆)，可能還有更多記錄。`;
      }

      logger.info("客訴列表查詢完成", {
        toolName: this.name,
        resultCount: complaints.length,
        hasFilters: Object.keys(params).some(key => params[key] !== undefined),
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

      logger.error("客訴列表查詢失敗", {
        toolName: this.name,
        filters: params,
        error: error.message,
        stack: error.stack,
      });

      throw new ToolExecutionError(
        `查詢客訴列表時發生錯誤: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        {
          originalError: error.message,
          filters: params,
        },
      );
    }
  }
}

export default new GetComplaintsListTool();
