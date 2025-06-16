/**
 * 客訴管理工具：更新客訴狀態
 *
 * 提供更新客訴處理狀態的功能，支援添加處理備註
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import complaintsService from "../../services/complaints/complaints-service.js";
import logger from "../../config/logger.js";

/**
 * 客訴狀態更新工具
 */
export class UpdateComplaintStatusTool extends BaseTool {
  constructor() {
    super(
      "update_complaint_status",
      "更新客訴記錄的處理狀態，可選擇性添加處理備註或解決方案說明",
      {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "客訴記錄 ID（必填）",
            pattern: "^\\d+$",
            example: "123",
          },
          status: {
            type: "string",
            description: "新的客訴狀態（必填）",
            enum: ["新建", "處理中", "待回覆", "已解決", "已關閉", "重新開啟"],
          },
          notes: {
            type: "string",
            description: "處理備註或解決方案說明（選填）",
            maxLength: 2000,
            example: "已聯絡客戶確認問題，預計明日提供解決方案",
          },
        },
        required: ["id", "status"],
      },
      {
        cacheable: false, // 狀態更新不使用快取
      },
    );
  }

  /**
   * 執行客訴狀態更新
   */
  async _execute(params, options) {
    const { id, status, notes } = params;

    try {
      logger.info("開始更新客訴狀態", {
        toolName: this.name,
        id,
        newStatus: status,
        hasNotes: !!notes,
      });

      // 驗證 ID 格式
      if (!/^\d+$/.test(id)) {
        throw new ToolExecutionError(
          "客訴 ID 格式錯誤，必須是純數字",
          ToolErrorType.VALIDATION_ERROR,
          { invalidId: id },
        );
      }

      // 驗證狀態值
      const validStatuses = [
        "新建",
        "處理中",
        "待回覆",
        "已解決",
        "已關閉",
        "重新開啟",
      ];
      if (!validStatuses.includes(status)) {
        throw new ToolExecutionError(
          `無效的狀態值，有效選項為: ${validStatuses.join(", ")}`,
          ToolErrorType.VALIDATION_ERROR,
          { invalidStatus: status, validStatuses },
        );
      }

      // 驗證備註長度
      if (notes && notes.length > 2000) {
        throw new ToolExecutionError(
          "處理備註長度不能超過 2000 個字元",
          ToolErrorType.VALIDATION_ERROR,
          { notesLength: notes.length, maxLength: 2000 },
        );
      }

      // 先查詢原始客訴資料以確認存在
      let originalComplaint;
      try {
        originalComplaint = await complaintsService.getComplaintById(
          parseInt(id),
        );
      } catch (error) {
        if (error.message.includes("找不到")) {
          throw new ToolExecutionError(
            `找不到 ID 為 ${id} 的客訴記錄，請確認 ID 是否正確`,
            ToolErrorType.NOT_FOUND,
            {
              invalidId: id,
              suggestion: "請使用 get_complaints_list 工具查看可用的客訴記錄",
            },
          );
        }
        throw error;
      }

      // 檢查狀態變更的合理性
      const statusTransitions = {
        新建: ["處理中", "已關閉"],
        處理中: ["待回覆", "已解決", "已關閉"],
        待回覆: ["處理中", "已解決", "已關閉"],
        已解決: ["已關閉", "重新開啟"],
        已關閉: ["重新開啟"],
        重新開啟: ["處理中", "待回覆", "已解決", "已關閉"],
      };

      const currentStatus = originalComplaint.status;
      const allowedTransitions = statusTransitions[currentStatus] || [];

      if (currentStatus === status) {
        // 如果狀態相同但有新備註，仍然允許更新
        if (!notes) {
          return {
            content: [
              {
                type: "text",
                text: `⚠️ **狀態更新結果**\n\n客訴 **${originalComplaint.voc_no}** 的狀態已經是 **${status}**，無需更新。\n\n如果需要添加處理備註，請在 notes 參數中提供相關說明。`,
              },
            ],
          };
        }
      } else if (!allowedTransitions.includes(status)) {
        logger.warn("嘗試無效的狀態轉換", {
          toolName: this.name,
          id,
          currentStatus,
          attemptedStatus: status,
          allowedTransitions,
        });

        throw new ToolExecutionError(
          `狀態轉換無效。目前狀態「${currentStatus}」無法直接變更為「${status}」。\n允許的狀態轉換: ${allowedTransitions.join(", ")}`,
          ToolErrorType.VALIDATION_ERROR,
          {
            currentStatus,
            attemptedStatus: status,
            allowedTransitions,
          },
        );
      }

      // 執行狀態更新
      const updateResult = await complaintsService.updateComplaintStatus(
        parseInt(id),
        status,
        notes,
      );

      // 格式化成功回應
      const statusEmoji =
        {
          新建: "🆕",
          處理中: "⏳",
          待回覆: "💬",
          已解決: "✅",
          已關閉: "🔒",
          重新開啟: "🔄",
        }[status] || "📋";

      const oldStatusEmoji =
        {
          新建: "🆕",
          處理中: "⏳",
          待回覆: "💬",
          已解決: "✅",
          已關閉: "🔒",
          重新開啟: "🔄",
        }[currentStatus] || "📋";

      let responseText = `✅ **客訴狀態更新成功**\n\n`;
      responseText += `📋 **客訴資訊:**\n`;
      responseText += `• 客訴編號: **${originalComplaint.voc_no}**\n`;
      responseText += `• 客戶名稱: ${originalComplaint.customer_name}\n`;
      responseText += `• 客訴主旨: ${originalComplaint.complaint_subject}\n\n`;

      responseText += `🔄 **狀態變更:**\n`;
      responseText += `• 原狀態: ${oldStatusEmoji} ${currentStatus}\n`;
      responseText += `• 新狀態: ${statusEmoji} **${status}**\n`;
      responseText += `• 更新時間: ${new Date().toLocaleString("zh-TW")}\n`;

      if (notes) {
        responseText += `\n📝 **處理備註:**\n${notes}\n`;
      }

      // 特殊狀態的提醒
      if (status === "已解決") {
        responseText += `\n💡 **提醒:** 客訴已標記為「已解決」，建議後續追蹤客戶滿意度。`;
      } else if (status === "已關閉") {
        responseText += `\n🔒 **提醒:** 客訴已關閉，如需重新處理請使用「重新開啟」狀態。`;
      } else if (status === "重新開啟") {
        responseText += `\n🔄 **提醒:** 客訴已重新開啟，請盡快安排後續處理。`;
      }

      logger.info("客訴狀態更新成功", {
        toolName: this.name,
        id,
        vocNo: originalComplaint.voc_no,
        oldStatus: currentStatus,
        newStatus: status,
        hasNotes: !!notes,
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

      logger.error("客訴狀態更新失敗", {
        toolName: this.name,
        id,
        status,
        hasNotes: !!notes,
        error: error.message,
        stack: error.stack,
      });

      throw new ToolExecutionError(
        `更新客訴狀態時發生錯誤: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        {
          originalError: error.message,
          id,
          status,
          hasNotes: !!notes,
        },
      );
    }
  }
}

export default new UpdateComplaintStatusTool();
