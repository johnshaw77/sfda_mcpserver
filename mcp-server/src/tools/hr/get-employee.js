/**
 * HR 工具：員工資訊查詢
 *
 * 根據員工編號查詢員工詳細資訊，從 org_employee 資料表獲取資料
 */

import { BaseTool, ToolExecutionError, ToolErrorType } from "../base-tool.js";
import employeeService from "../../services/hr/employee-service.js";
import logger from "../../config/logger.js";

/**
 * 員工資訊查詢工具
 */
export class GetEmployeeTool extends BaseTool {
  constructor() {
    super(
      "get_employee",
      `根據員工編號查詢特定員工的詳細資訊，支援欄位分組選擇

欄位分組說明：
【basic - 基本資料群組】
• employee_no: 員工編號 (公司唯一識別碼)
• name: 員工姓名
• eng_name: 英文姓名
• sex: 性別 (M=男性, F=女性)
• birthday: 生日日期
• id_card: 身份證字號
• is_suspended: 停用狀態 (0=正常, 1=停用/離職)

【contact - 聯絡方式群組】
• email: 公司電子郵件
• mobile: 手機號碼
• telphone: 聯絡電話
• ext_num: 分機號碼
• address: 聯絡地址

【department - 部門資訊群組】
• group_code: 部門代碼 (如 IT, HR, QA)
• group_name: 部門名稱 (如 資訊部, 人力資源部)

【position - 職位資訊群組】
• title_code: 職位代碼
• title_name: 職位名稱 (如 軟體工程師, 部門經理)
• user_type: 使用者類型

【employment - 雇用資訊群組】
• arrive_date: 到職日期
• leave_date: 離職日期 (在職者為 null)
• last_suspended_date: 最後停用日期
• domain: 網域帳號
• account: 系統帳號
• lang: 語言設定

使用說明：
- 預設返回 basic、contact、department、position 四個群組
- 可根據需要自訂返回的欄位群組
- 敏感資訊僅在明確請求時返回`,
      {
        type: "object",
        properties: {
          employeeNo: {
            type: "string",
            description: "員工編號（必填），對應資料庫中的 employee_no 欄位",
            example: "A116592",
          },
          fields: {
            type: "array",
            description:
              "指定返回的欄位群組（選填，預設包含基本資訊、聯絡方式、部門和職位）。這些群組是對資料表欄位的邏輯分類，不是資料表中的實際欄位名稱。",
            items: {
              type: "string",
              enum: [
                "basic", // 基本資料群組：映射 name, employee_no, sex, birthday, is_suspended 欄位
                "contact", // 聯絡方式群組：映射 email, mobile, telphone, ext_num, address 欄位
                "department", // 部門資訊群組：映射 group_name, group_code 欄位
                "position", // 職位資訊群組：映射 title_name, user_type 欄位
                "employment", // 雇用資訊群組：映射 arrive_date, leave_date, last_suspended_date, domain, account, lang 欄位
              ],
            },
            default: ["basic", "contact", "department", "position"],
          },
        },
        required: ["employeeNo"],
      },
      {
        cacheable: false, // 停用快取，避免個人資料被誤用
      },
    );
  }

  /**
   * 執行員工資訊查詢
   */
  async _execute(params, options) {
    const {
      employeeNo,
      fields = ["basic", "contact", "department", "position"],
    } = params;

    try {
      logger.info(`Querying employee info for: ${employeeNo}`, {
        toolName: this.name,
        employeeNo,
        fields,
      });

      // 從資料庫獲取員工資料
      const employeeData = await employeeService.getEmployeeById(
        employeeNo,
        true, // includeDetails
        fields,
      );

      // 加強錯誤處理：明確檢查員工是否存在
      if (!employeeData || Object.keys(employeeData).length === 0) {
        logger.warn(`Employee not found in database: ${employeeNo}`, {
          toolName: this.name,
          employeeNo,
          searchedFields: fields,
        });

        throw new ToolExecutionError(
          `找不到員工資料：員工編號 ${employeeNo} 不存在於系統中。請確認員工編號是否正確。`,
          ToolErrorType.NOT_FOUND,
          {
            employeeNo,
            message: "員工不存在",
            suggestedAction:
              "請檢查員工編號格式是否正確，或聯絡人資部門確認員工資料",
          },
        );
      }

      // 建構返回結果
      const result = {
        employeeNo,
        queryTime: new Date().toISOString(),
        data: employeeData,
        fields: fields,
      };

      logger.info(`Employee info retrieved successfully: ${employeeNo}`, {
        toolName: this.name,
        employeeNo,
        fieldsCount: Object.keys(employeeData).length,
      });

      return result;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }

      // 包裝其他錯誤
      throw new ToolExecutionError(
        `查詢員工資訊失敗: ${error.message}`,
        ToolErrorType.API_ERROR,
        { employeeNo, originalError: error.message },
      );
    }
  }

  /**
   * 驗證輸入參數
   */
  validateInput(params) {
    // 呼叫父類別的基本驗證
    super.validateInput(params);

    const { employeeNo } = params;

    // 檢查員工編號是否為空
    if (!employeeNo || employeeNo.trim() === "") {
      throw new ToolExecutionError(
        "員工編號不能為空",
        ToolErrorType.VALIDATION_ERROR,
        {
          employeeNo,
          message: "請提供有效的員工編號",
        },
      );
    }

    // 檢查員工編號格式，根據資料庫欄位長度限制
    if (employeeNo.length > 50) {
      throw new ToolExecutionError(
        "員工編號格式不正確。員工編號不應超過50個字符",
        ToolErrorType.VALIDATION_ERROR,
        {
          employeeNo,
          message: "請提供有效的員工編號",
        },
      );
    }

    return true;
  }
}
