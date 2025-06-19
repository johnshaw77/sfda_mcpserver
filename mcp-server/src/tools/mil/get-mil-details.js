/**
 * MIL 工具：MIL 詳情查詢
 *
 * 根據 MIL 編號查詢詳細資訊，從 v_mil_kd 視圖獲取資料
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import milService from "../../services/mil/mil-service.js";
import logger from "../../config/logger.js";

/**
 * MIL 詳情查詢工具
 */
export class GetMILDetailsTool extends BaseTool {
  constructor() {
    super(
      "get-mil-details",
      `根據 MIL 編號查詢單筆 MIL 的完整詳細資訊
      
返回完整欄位說明：
• SerialNumber: MIL 序號 (如 G250619001)
• TypeName: MIL 類別 (如 廠內Issue, 品質ISSUE管理, CEO/COO追蹤待辦事項等)
• MidTypeName: 中層分類
• DelayDay: 延遲天數 (負數=提前完成，正數=延遲，0=準時)
• Status: 處理狀態 (OnGoing=進行中, Completed=已完成, Cancelled=已取消)
• Importance: 重要度 (H=高, M=中, L=低)
• RecordDate: 記錄日期
• ProposalFactory: 提案廠別 (JK=JK廠, KH=KH廠, KS=KS廠)

【提案者資訊】
• Proposer_EmpNo: 提案者員工編號
• Proposer_Name: 提案者姓名
• Proposer_Dept: 提案者部門
• Proposer_Superior_Dept: 提案者上級部門

【負責人資訊】  
• DRI_EmpNo: DRI負責人員工編號 (Directly Responsible Individual)
• DRI_EmpName: DRI負責人姓名
• DRI_Dept: DRI負責部門
• DRI_Superior_Dept: DRI負責人上級部門

【問題與解決方案】
• IssueDiscription: 問題詳細描述
• Location: 發生地點
• Solution: 解決方案內容
• Remark: 備註說明

【時程資訊】
• PlanFinishDate: 計劃完成日期
• ChangeFinishDate: 變更後完成日期
• ActualFinishDate: 實際完成日期 (null=尚未完成)

【其他】
• naqi_num: NAQI 編號
• is_APPLY: 是否申請標記`,
      {
        type: "object",
        properties: {
          serialNumber: {
            type: "string",
            description: "MIL 編號（必填）",
            example: "MIL-202506-001",
          },
        },
        required: ["serialNumber"],
      },
      {
        cacheable: true,
        cacheExpiry: 60 * 5, // 5 分鐘
      },
    );
  }

  /**
   * 執行工具
   * @param {Object} params - 工具參數
   */
  async _execute(params) {
    try {
      // 呼叫服務取得資料
      const result = await milService.getMILDetails(params.serialNumber);

      // 記錄執行資訊
      logger.info("MIL 詳情查詢成功", {
        toolName: this.name,
        serialNumber: params.serialNumber,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 檢查是否為找不到資料的錯誤
      if (error.message.includes("找不到 MIL 編號")) {
        throw new ToolExecutionError(
          `找不到 MIL 編號: ${params.serialNumber}`,
          ToolErrorType.NOT_FOUND,
          { serialNumber: params.serialNumber },
        );
      }

      // 記錄錯誤
      logger.error("MIL 詳情查詢失敗", {
        toolName: this.name,
        serialNumber: params.serialNumber,
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `MIL 詳情查詢失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }
}
