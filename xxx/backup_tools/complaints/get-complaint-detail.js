/**
 * 客訴管理工具：客訴詳情查詢
 *
 * 根據客訴 ID 或編號查詢詳細資訊
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import complaintsService from "../../services/complaints/complaints-service.js";
import logger from "../../config/logger.js";

/**
 * 客訴詳情查詢工具
 */
export class GetComplaintDetailTool extends BaseTool {
  constructor() {
    super(
      "get_complaint_detail",
      "根據客訴 ID 或客訴編號查詢詳細資訊，包括客戶資料、處理進度、解決方案等完整內容",
      {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "客訴記錄 ID（數字）",
            pattern: "^\\d+$",
            example: "123",
          },
          vocNo: {
            type: "string",
            description: "客訴編號（如：VOC-2024-001）",
            pattern: "^[A-Z]+-\\d{4}-\\d{3}$",
            example: "VOC-2024-001",
          },
        },
        required: [],
        oneOf: [{ required: ["id"] }, { required: ["vocNo"] }],
      },
      {
        cacheable: true,
        cacheTimeout: 300, // 5分鐘快取
      },
    );
  }

  /**
   * 執行客訴詳情查詢
   */
  async _execute(params, options) {
    const { id, vocNo } = params;

    try {
      // 驗證參數
      if (!id && !vocNo) {
        throw new ToolExecutionError(
          "請提供客訴 ID 或客訴編號其中一個參數",
          ToolErrorType.VALIDATION_ERROR,
          { providedParams: params },
        );
      }

      if (id && vocNo) {
        throw new ToolExecutionError(
          "請只提供客訴 ID 或客訴編號其中一個參數，不要同時提供",
          ToolErrorType.VALIDATION_ERROR,
          { providedParams: params },
        );
      }

      logger.info("開始查詢客訴詳情", {
        toolName: this.name,
        searchBy: id ? "id" : "vocNo",
        searchValue: id || vocNo,
      });

      // 調用服務層查詢客訴詳情
      let complaint;
      if (id) {
        // 驗證 ID 格式
        if (!/^\d+$/.test(id)) {
          throw new ToolExecutionError(
            "客訴 ID 格式錯誤，必須是純數字",
            ToolErrorType.VALIDATION_ERROR,
            { invalidId: id },
          );
        }
        complaint = await complaintsService.getComplaintById(parseInt(id));
      } else {
        // 驗證客訴編號格式
        if (!/^[A-Z]+-\d{4}-\d{3}$/.test(vocNo)) {
          throw new ToolExecutionError(
            "客訴編號格式錯誤，正確格式：VOC-2024-001",
            ToolErrorType.VALIDATION_ERROR,
            { invalidVocNo: vocNo },
          );
        }
        complaint = await complaintsService.getComplaintByVocNo(vocNo);
      }

      // 格式化回應
      const statusEmoji =
        {
          新建: "🆕",
          處理中: "⏳",
          待回覆: "💬",
          已解決: "✅",
          已關閉: "🔒",
          重新開啟: "🔄",
        }[complaint.status] || "📋";

      const priorityEmoji =
        {
          緊急: "🔴",
          高: "🟠",
          中: "🟡",
          低: "🟢",
        }[complaint.priority_level] || "⚪";

      let responseText = `📋 **客訴詳細資訊**\n\n`;

      // 基本資訊
      responseText += `🏷️ **基本資訊**\n`;
      responseText += `• 客訴編號: **${complaint.voc_no}**\n`;
      responseText += `• 記錄 ID: ${complaint.id}\n`;
      responseText += `• 狀態: ${statusEmoji} **${complaint.status}**\n`;
      responseText += `• 優先級: ${priorityEmoji} **${complaint.priority_level}**\n`;
      responseText += `• 類型: ${complaint.complaint_type}\n`;
      if (complaint.complaint_category) {
        responseText += `• 分類: ${complaint.complaint_category}\n`;
      }

      // 客戶資訊
      responseText += `\n👤 **客戶資訊**\n`;
      responseText += `• 客戶名稱: **${complaint.customer_name}**\n`;
      if (complaint.customer_contact) {
        responseText += `• 聯絡方式: ${complaint.customer_contact}\n`;
      }

      // 客訴內容
      responseText += `\n📝 **客訴內容**\n`;
      responseText += `• 主旨: **${complaint.complaint_subject}**\n`;
      responseText += `• 詳細內容:\n${complaint.complaint_content}\n`;

      // 處理資訊
      responseText += `\n⚙️ **處理資訊**\n`;
      if (complaint.assigned_to) {
        responseText += `• 負責人: **${complaint.assigned_to}**\n`;
      } else {
        responseText += `• 負責人: *尚未指派*\n`;
      }

      if (complaint.response_deadline) {
        const deadline = new Date(complaint.response_deadline);
        const now = new Date();
        const isOverdue = deadline < now;
        responseText += `• 回覆期限: ${deadline.toLocaleString("zh-TW")} ${isOverdue ? "⚠️ **已逾期**" : ""}\n`;
      }

      // 解決方案（如果有）
      if (complaint.resolution_notes) {
        responseText += `\n✅ **解決方案**\n`;
        responseText += `${complaint.resolution_notes}\n`;

        if (complaint.resolution_date) {
          responseText += `• 解決日期: ${new Date(complaint.resolution_date).toLocaleString("zh-TW")}\n`;
        }
      }

      // 客戶滿意度（如果有）
      if (complaint.customer_satisfaction) {
        const satisfactionEmoji =
          {
            非常滿意: "😍",
            滿意: "😊",
            普通: "😐",
            不滿意: "😞",
            非常不滿意: "😡",
          }[complaint.customer_satisfaction] || "📊";

        responseText += `\n📊 **客戶滿意度**\n`;
        responseText += `${satisfactionEmoji} ${complaint.customer_satisfaction}\n`;
      }

      // 時間戳記
      responseText += `\n🕒 **時間記錄**\n`;
      responseText += `• 建立時間: ${new Date(complaint.created_date).toLocaleString("zh-TW")}\n`;
      responseText += `• 最後更新: ${new Date(complaint.updated_date).toLocaleString("zh-TW")}\n`;

      logger.info("客訴詳情查詢完成", {
        toolName: this.name,
        searchBy: id ? "id" : "vocNo",
        searchValue: id || vocNo,
        foundVocNo: complaint.voc_no,
        status: complaint.status,
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

      logger.error("客訴詳情查詢失敗", {
        toolName: this.name,
        searchBy: id ? "id" : "vocNo",
        searchValue: id || vocNo,
        error: error.message,
        stack: error.stack,
      });

      // 根據錯誤類型提供更友善的錯誤訊息
      if (error.message.includes("找不到")) {
        throw new ToolExecutionError(
          `${error.message}。請確認${id ? "客訴 ID" : "客訴編號"}是否正確。`,
          ToolErrorType.NOT_FOUND,
          {
            searchBy: id ? "id" : "vocNo",
            searchValue: id || vocNo,
            suggestion: "請使用 get_complaints_list 工具查看可用的客訴記錄",
          },
        );
      }

      throw new ToolExecutionError(
        `查詢客訴詳情時發生錯誤: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        {
          originalError: error.message,
          searchBy: id ? "id" : "vocNo",
          searchValue: id || vocNo,
        },
      );
    }
  }
}

export default new GetComplaintDetailTool();
