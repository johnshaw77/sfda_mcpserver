import { BaseTool } from "../base-tool.js";
import logger from "../../config/logger.js";

/**
 * 創建任務工具
 * 支援創建各種類型的任務，包括工作項目、專案任務、維護任務等
 */
export class CreateTaskTool extends BaseTool {
  constructor() {
    super("create_task", "創建新的任務項目，支援多種任務類型和優先級設定", {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "任務標題",
        },
        description: {
          type: "string",
          description: "任務詳細描述",
        },
        type: {
          type: "string",
          enum: [
            "development",
            "maintenance",
            "meeting",
            "review",
            "documentation",
            "research",
            "bug_fix",
            "testing",
          ],
          description: "任務類型",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "任務優先級",
          default: "medium",
        },
        assignee_id: {
          type: "string",
          description: "指派給的用戶 ID",
        },
        project_id: {
          type: "string",
          description: "關聯的專案 ID（可選）",
        },
        due_date: {
          type: "string",
          format: "date",
          description: "截止日期 (YYYY-MM-DD)",
        },
        estimated_hours: {
          type: "number",
          description: "預估工時（小時）",
          minimum: 0.5,
          maximum: 200,
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
          description: "任務標籤（可選）",
        },
        department: {
          type: "string",
          description: "負責部門",
        },
      },
      required: [
        "title",
        "description",
        "type",
        "assignee_id",
        "due_date",
        "department",
      ],
    });

    // 任務 ID 計數器（實際應用中應使用資料庫自動遞增）
    this.taskIdCounter = 1000;

    // 模擬資料庫 - 任務存儲
    this.tasks = new Map();

    // 模擬用戶資料
    this.users = new Map([
      [
        "user001",
        {
          id: "user001",
          name: "張小明",
          department: "IT",
          email: "ming.zhang@company.com",
        },
      ],
      [
        "user002",
        {
          id: "user002",
          name: "李小華",
          department: "HR",
          email: "hua.li@company.com",
        },
      ],
      [
        "user003",
        {
          id: "user003",
          name: "王小美",
          department: "Finance",
          email: "mei.wang@company.com",
        },
      ],
      [
        "user004",
        {
          id: "user004",
          name: "陳小強",
          department: "IT",
          email: "qiang.chen@company.com",
        },
      ],
      [
        "user005",
        {
          id: "user005",
          name: "林小文",
          department: "Marketing",
          email: "wen.lin@company.com",
        },
      ],
    ]);

    // 模擬專案資料
    this.projects = new Map([
      [
        "proj001",
        {
          id: "proj001",
          name: "數位轉型專案",
          department: "IT",
          status: "active",
        },
      ],
      [
        "proj002",
        {
          id: "proj002",
          name: "人資系統升級",
          department: "HR",
          status: "active",
        },
      ],
      [
        "proj003",
        {
          id: "proj003",
          name: "財務流程優化",
          department: "Finance",
          status: "planning",
        },
      ],
      [
        "proj004",
        {
          id: "proj004",
          name: "市場分析報告",
          department: "Marketing",
          status: "active",
        },
      ],
    ]);
  }

  async _execute(params, options) {
    try {
      logger.info("開始創建任務", { params });

      // 驗證必要參數
      const validation = this.validateRequiredParams(params, [
        "title",
        "description",
        "type",
        "assignee_id",
        "due_date",
        "department",
      ]);
      if (!validation.isValid) {
        throw new Error(`參數驗證失敗: ${validation.missingParams.join(", ")}`);
      }

      // 驗證指派用戶存在
      if (!this.users.has(params.assignee_id)) {
        throw new Error(`找不到指派用戶: ${params.assignee_id}`);
      }

      // 驗證專案存在（如果提供）
      if (params.project_id && !this.projects.has(params.project_id)) {
        throw new Error(`找不到指定專案: ${params.project_id}`);
      }

      // 驗證日期格式
      const dueDate = new Date(params.due_date);
      if (isNaN(dueDate.getTime())) {
        throw new Error("截止日期格式無效");
      }

      // 檢查截止日期不能是過去
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        throw new Error("截止日期不能是過去的日期");
      }

      // 生成任務 ID
      const taskId = `TASK${String(++this.taskIdCounter).padStart(4, "0")}`;

      // 獲取指派用戶資訊
      const assignee = this.users.get(params.assignee_id);

      // 獲取專案資訊（如果有）
      let project = null;
      if (params.project_id) {
        project = this.projects.get(params.project_id);
      }

      // 創建任務物件
      const task = {
        id: taskId,
        title: params.title.trim(),
        description: params.description.trim(),
        type: params.type,
        priority: params.priority || "medium",
        status: "pending",
        assignee: {
          id: assignee.id,
          name: assignee.name,
          department: assignee.department,
          email: assignee.email,
        },
        project: project
          ? {
              id: project.id,
              name: project.name,
              department: project.department,
            }
          : null,
        department: params.department,
        due_date: params.due_date,
        estimated_hours: params.estimated_hours || null,
        actual_hours: 0,
        tags: params.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: "system", // 實際應用中應該是當前用戶
        completion_percentage: 0,
        attachments: [],
        comments: [],
      };

      // 計算任務緊急度評分
      task.urgency_score = this.calculateUrgencyScore(task);

      // 儲存任務
      this.tasks.set(taskId, task);

      // 生成建議和提醒
      const suggestions = this.generateTaskSuggestions(task);

      logger.info("任務創建成功", { taskId, title: task.title });

      return {
        success: true,
        task: task,
        message: "任務創建成功",
        suggestions: suggestions,
        next_actions: [
          "可以使用 get_task_list 查看所有任務",
          "可以通知指派用戶新任務已創建",
          "建議設定任務提醒和進度追蹤",
        ],
      };
    } catch (error) {
      logger.error("創建任務失敗", error, { params });
      return {
        success: false,
        error: error.message,
        error_code: "TASK_CREATION_FAILED",
      };
    }
  }

  /**
   * 計算任務緊急度評分
   */
  calculateUrgencyScore(task) {
    let score = 0;

    // 優先級評分
    const priorityScores = {
      low: 10,
      medium: 25,
      high: 50,
      urgent: 100,
    };
    score += priorityScores[task.priority] || 25;

    // 截止日期評分（距離截止日期越近分數越高）
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 1) score += 40;
    else if (daysUntilDue <= 3) score += 30;
    else if (daysUntilDue <= 7) score += 20;
    else if (daysUntilDue <= 14) score += 10;

    // 任務類型評分
    const typeScores = {
      bug_fix: 30,
      urgent: 25,
      maintenance: 15,
      development: 10,
      testing: 10,
      meeting: 5,
      documentation: 5,
      research: 5,
      review: 5,
    };
    score += typeScores[task.type] || 10;

    // 預估工時評分（工時越多可能越重要）
    if (task.estimated_hours) {
      if (task.estimated_hours >= 40) score += 20;
      else if (task.estimated_hours >= 20) score += 15;
      else if (task.estimated_hours >= 10) score += 10;
      else if (task.estimated_hours >= 5) score += 5;
    }

    return Math.min(score, 200); // 最高分 200
  }

  /**
   * 生成任務建議
   */
  generateTaskSuggestions(task) {
    const suggestions = [];

    // 基於優先級的建議
    if (task.priority === "urgent") {
      suggestions.push("這是緊急任務，建議立即通知指派人員並設定每日進度追蹤");
    } else if (task.priority === "high") {
      suggestions.push("高優先級任務，建議設定每週進度檢查");
    }

    // 基於截止日期的建議
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 3) {
      suggestions.push("任務截止日期臨近，建議增加資源或調整範圍");
    } else if (daysUntilDue <= 7) {
      suggestions.push("建議開始規劃任務執行細節和里程碑");
    }

    // 基於工時的建議
    if (task.estimated_hours) {
      if (task.estimated_hours >= 40) {
        suggestions.push("大型任務建議拆分為多個子任務，便於管理和追蹤");
      } else if (task.estimated_hours >= 20) {
        suggestions.push("中型任務建議設定中間檢查點");
      }
    }

    // 基於任務類型的建議
    switch (task.type) {
      case "bug_fix":
        suggestions.push("錯誤修復任務建議先評估影響範圍並建立測試計劃");
        break;
      case "development":
        suggestions.push("開發任務建議先進行需求確認和技術評估");
        break;
      case "testing":
        suggestions.push("測試任務建議準備完整的測試用例和測試資料");
        break;
      case "documentation":
        suggestions.push("文件任務建議明確文件格式和審核標準");
        break;
    }

    // 專案相關建議
    if (task.project) {
      suggestions.push(
        `此任務屬於專案「${task.project.name}」，建議確認與其他專案任務的依賴關係`,
      );
    }

    return suggestions;
  }

  /**
   * 驗證必要參數
   */
  validateRequiredParams(params, requiredFields) {
    const missingParams = requiredFields.filter(
      field =>
        params[field] === undefined ||
        params[field] === null ||
        params[field] === "",
    );

    return {
      isValid: missingParams.length === 0,
      missingParams,
    };
  }
}
