/**
 * MIL 工具：MIL 類型列表查詢
 *
 * 獲取所有 MIL 類型的唯一列表
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import milService from "../../services/mil/mil-service.js";
import logger from "../../config/logger.js";

/**
 * MIL 類型列表查詢工具
 */
export class GetMILTypeListTool extends BaseTool {
  constructor() {
    super(
      "get-mil-type-list",
      `取得所有 MIL 類別的完整清單，用於了解系統中有哪些分類

返回資料說明：
• TypeName: MIL 類別名稱的唯一列表
• 常見類別包括：
  - 廠內Issue: 廠區內部問題
  - 品質ISSUE管理: 品質相關問題
  - CEO/COO追蹤待辦事項: 高層追蹤項目
  - 兩廠資訊處: 資訊系統相關
  - 稽核追蹤: 稽核發現項目
  - 生產入庫進度雷達管控: 生產相關
  - OQC/IPQC/LAB Issue: 品管檢驗問題
  - 資訊安全稽核: 資安相關
  - SmartFactory: 智慧工廠項目
  - LessonLearnt: 經驗學習項目
  - 其他業務分類

用途：
- 了解 MIL 系統的分類架構
- 作為篩選條件的參考
- 統計分析各類別的分布`,
      {
        type: "object",
        properties: {},
        required: [],
      },
      {
        cacheable: true,
        cacheExpiry: 60 * 30, // 30 分鐘快取，類型列表變動較少
        module: "mil",
        requiredDatabases: ["mil"],
      },
    );
  }

  /**
   * 執行工具
   * @param {Object} params - 工具參數（此工具不需要參數）
   */
  async _execute(params) {
    try {
      // 呼叫服務取得資料
      const result = await milService.getMILTypeList();

      // 記錄執行資訊
      logger.info("MIL 類型列表查詢成功", {
        toolName: this.name,
        typeCount: result.data.length,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 記錄錯誤
      logger.error("MIL 類型列表查詢失敗", {
        toolName: this.name,
        params: JSON.stringify(params),
        error: error.message,
        stack: error.stack,
      });

      // 拋出工具執行錯誤
      throw new ToolExecutionError(
        `MIL 類型列表查詢失敗: ${error.message}`,
        ToolErrorType.EXECUTION_ERROR,
        { originalError: error.message },
      );
    }
  }
}
