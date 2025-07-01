/**
 * MIL 工具：MIL 列表查詢
 *
 * 根據條件查詢 MIL 列表，從 v_mil_kd 視圖獲取資料
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import milService from "../../services/mil/mil-service.js";
import logger from "../../config/logger.js";

/**
 * MIL 列表查詢工具
 */
export class GetMILListTool extends BaseTool {
  /**
   * 獲取 MIL 列表工具的基礎 AI 指導
   * @returns {string} 基礎指導內容
   */
  getBaseInstructions() {
    const instructions = [];

    // 🎯 精簡核心原則
    instructions.push("🎯 **基礎原則**：基於實際數據分析，不編造信息");
    instructions.push("");

    // 🗂️ 核心欄位（只說明最重要的）
    instructions.push("🗂️ **核心欄位**：");
    instructions.push("- SerialNumber: MIL序號");
    instructions.push("- DelayDay: 延遲天數（正數=延遲，負數=提前）");
    instructions.push("- Proposal_Name: 提案人");
    instructions.push("- IssueDiscription: 問題描述內容");
    instructions.push("- DRI_EmpName: 負責人");
    instructions.push("");

    // 🧠 分析重點（簡化版）
    instructions.push("🧠 **分析重點**：");
    instructions.push("- 識別高風險專案（延遲天數>10）");
    instructions.push("- 識別 CEO, COO 關注的專案");
    instructions.push("- 評估負責人工作負荷");
    instructions.push("- 提供改善建議");
    instructions.push("");

    return instructions.join("\n");
  }
  constructor() {
    super(
      "get-mil-list",
      `根據條件查詢 MIL 列表(分配到清單上的任務或專案)
      
返回欄位說明：
• SerialNumber: MIL 序號 (如 G250619001)
• DelayDay: 延遲天數 (負數=提前完成，正數=延遲，0=準時)
• Status: 處理狀態 (OnGoing=進行中, Completed=已完成, Cancelled=已取消)
• DRI_EmpName: DRI負責人姓名 (Directly Responsible Individual)
• DRI_Dept: DRI負責部門
• Proposer_Name: 提案者姓名
• Proposer_Dept: 提案者部門
• IssueDiscription: 問題描述內容
• PlanFinishDate: 計劃完成日期
• ActualFinishDate: 實際完成日期 (null=尚未完成)
• Importance: 重要度 (H=高, M=中, L=低)
• TypeName: MIL類別 (如 廠內Issue, 品質ISSUE管理等)
• ProposalFactory: 提案廠別 (JK/KH/KS)
• Location: 發生地點
• Solution: 解決方案`,
      {
        type: "object",
        properties: {
          typeName: {
            type: "string",
            description: "MIL 類別(選填) ",
            example:
              "三現,值班幹部巡檢,兩廠資訊處,品質雷達控管,KH MIL,CEO/COO追蹤待辦事項,稽核追蹤,生產入庫進度雷達管控,KS FPC清潔公司,品質ISSUE管理,OQC/IPQC/LAB Issue,A公司MIL,資訊安全稽核,LPA稽核追蹤,會議管理,SmartFactory,廠內Issue,系統稽核類,內部issue管理,LessonLearnt,FPCA第三方稽核",
          },
          status: {
            type: "string",
            description: "MIL 處理狀態（選填）",
            example: "已結案",
          },
          proposalFactory: {
            type: "string",
            description: "負責人廠別（選填）",
            example: "JK,KH,KS",
          },
          proposerName: {
            type: "string",
            description: "提出人姓名（選填），支援模糊查詢",
            example: "張三",
          },
          serialNumber: {
            type: "string",
            description: "MIL 編號（選填），支援模糊查詢",
            example: "MIL-2025",
          },
          importance: {
            type: "string",
            description: "重要度（選填）",
            example: "高",
          },
          delayDayMin: {
            type: "integer",
            description: "最小延遲天數（選填）- 查詢延遲天數大於等於此值的 MIL",
            example: 5,
          },
          delayDayMax: {
            type: "integer",
            description: "最大延遲天數（選填）- 查詢延遲天數小於等於此值的 MIL",
            example: 30,
          },
          driName: {
            type: "string",
            description: "負責人姓名（選填），支援模糊查詢",
            example: "張三",
          },
          driEmpNo: {
            type: "string",
            description: "負責人工號（選填）",
            example: "U0700034",
          },
          driDept: {
            type: "string",
            description: "負責部門（選填）",
            example: "品保處",
          },
          location: {
            type: "string",
            description: "地點/區域（選填），支援模糊查詢",
            example: "A棟2F",
          },
          isApply: {
            type: "string",
            description: "是否已申請結案（選填）",
            enum: ["Y", "N"],
            example: "Y",
          },
          page: {
            type: "integer",
            description: "頁數（選填，預設 1）",
            default: 1,
            minimum: 1,
          },
          limit: {
            type: "integer",
            description: "每頁返回結果數量限制（選填，預設 100）",
            default: 100,
            minimum: 1,
            maximum: 1000,
          },
          fields: {
            type: "array",
            description:
              "指定要返回的欄位（選填）。如果不指定，則返回預設欄位：SerialNumber, ProposalFactory, Solution",
            items: {
              type: "string",
              enum: [
                "SerialNumber",
                "TypeName",
                "MidTypeName",
                "DelayDay",
                "is_APPLY",
                "Importance",
                "Status",
                "RecordDate",
                "ProposalFactory",
                "Proposer_EmpNo",
                "Proposer_Name",
                "Proposer_Dept",
                "Proposer_Superior_Dept",
                "DRI_EmpNo",
                "DRI_EmpName",
                "DRI_Dept",
                "DRI_Superior_Dept",
                "IssueDiscription",
                "Remark",
                "Location",
                "PlanFinishDate",
                "ChangeFinishDate",
                "ActualFinishDate",
                "Solution",
              ],
            },
            example: ["SerialNumber", "ProposalFactory", "Solution"],
          },
        },
        required: [],
      },
      {
        cacheable: false, // 暫時關閉緩存
        cacheExpiry: 60 * 5, // 5 分鐘
        module: "mil",
        requiredDatabases: ["mil"],
      },
    );
  }

  /**
   * 執行工具
   * @param {Object} params - 工具參數
   */
  async _execute(params) {
    try {
      // 參數處理
      const filters = {};
      if (params.typeName) filters.typeName = params.typeName;
      if (params.status) filters.status = params.status;
      if (params.proposalFactory)
        filters.proposalFactory = params.proposalFactory;
      if (params.proposerName) filters.proposerName = params.proposerName;
      if (params.serialNumber) filters.serialNumber = params.serialNumber;
      if (params.importance) filters.importance = params.importance;
      if (params.delayDayMin !== undefined)
        filters.delayDayMin = params.delayDayMin;
      if (params.delayDayMax !== undefined)
        filters.delayDayMax = params.delayDayMax;

      // 負責人相關參數
      if (params.driName) filters.driName = params.driName;
      if (params.driEmpNo) filters.driEmpNo = params.driEmpNo;
      if (params.driDept) filters.driDept = params.driDept;

      // 地點相關參數
      if (params.location) filters.location = params.location;

      // 申請結案狀態參數
      if (params.isApply) filters.isApply = params.isApply;

      // 🎯 新增：欄位選擇參數
      const selectedFields = params.fields;

      // 分頁參數
      const page = params.page || 1;
      const limit = params.limit || 100;

      // 呼叫服務取得資料
      const result = await milService.getMILList(
        filters,
        page,
        limit,
        "RecordDate",
        "OnGoing",
        selectedFields,
      );

      // 記錄執行資訊
      logger.info("MIL 列表查詢成功", {
        toolName: this.name,
        filters: JSON.stringify(filters),
        page: page,
        limit: limit,
        count: result.data.length,
        totalRecords: result.totalRecords,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 記錄錯誤
      logger.error("MIL 列表查詢失敗", {
        toolName: this.name,
        params: JSON.stringify(params),
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `MIL 列表查詢失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }
}
