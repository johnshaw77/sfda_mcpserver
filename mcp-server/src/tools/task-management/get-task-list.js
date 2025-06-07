import { BaseTool } from "../base-tool.js";
import logger from "../../config/logger.js";

/**
 * 獲取任務列表工具
 * 支援多種過濾、排序和搜尋功能，提供詳細的任務資訊和統計分析
 */
export class GetTaskListTool extends BaseTool {
  constructor() {
    super(
      "get_task_list",
      "獲取任務列表，支援多種過濾條件、排序方式和統計分析",
      {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: [
              "pending",
              "in_progress",
              "completed",
              "cancelled",
              "on_hold",
              "all",
            ],
            description: "任務狀態過濾",
            default: "all",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent", "all"],
            description: "優先級過濾",
            default: "all",
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
              "all",
            ],
            description: "任務類型過濾",
            default: "all",
          },
          assignee_id: {
            type: "string",
            description: "指派人員 ID 過濾",
          },
          department: {
            type: "string",
            description: "部門過濾",
          },
          project_id: {
            type: "string",
            description: "專案 ID 過濾",
          },
          due_date_from: {
            type: "string",
            format: "date",
            description: "截止日期起始範圍 (YYYY-MM-DD)",
          },
          due_date_to: {
            type: "string",
            format: "date",
            description: "截止日期結束範圍 (YYYY-MM-DD)",
          },
          overdue_only: {
            type: "boolean",
            description: "只顯示逾期任務",
            default: false,
          },
          search_keyword: {
            type: "string",
            description: "搜尋關鍵字（標題、描述、標籤）",
          },
          sort_by: {
            type: "string",
            enum: [
              "due_date",
              "priority",
              "status",
              "created_at",
              "updated_at",
              "urgency_score",
              "completion_percentage",
            ],
            description: "排序欄位",
            default: "due_date",
          },
          sort_order: {
            type: "string",
            enum: ["asc", "desc"],
            description: "排序順序",
            default: "asc",
          },
          limit: {
            type: "number",
            description: "返回結果數量限制",
            minimum: 1,
            maximum: 100,
            default: 20,
          },
          offset: {
            type: "number",
            description: "結果偏移量（分頁）",
            minimum: 0,
            default: 0,
          },
          include_statistics: {
            type: "boolean",
            description: "是否包含統計資訊",
            default: true,
          },
          include_suggestions: {
            type: "boolean",
            description: "是否包含管理建議",
            default: false,
          },
        },
      },
    );

    // 模擬任務資料庫
    this.initializeMockTasks();

    // 任務狀態定義
    this.taskStatuses = [
      "pending",
      "in_progress",
      "completed",
      "cancelled",
      "on_hold",
    ];

    // 任務類型定義
    this.taskTypes = [
      "development",
      "maintenance",
      "meeting",
      "review",
      "documentation",
      "research",
      "bug_fix",
      "testing",
    ];

    // 優先級定義
    this.priorities = ["low", "medium", "high", "urgent"];
  }

  /**
   * 初始化模擬任務資料
   */
  initializeMockTasks() {
    this.tasks = new Map();

    // 創建模擬任務資料
    const mockTasks = [
      {
        id: "TASK1001",
        title: "用戶登入系統優化",
        description: "改善用戶登入流程，增加多重身份驗證功能，提升系統安全性",
        type: "development",
        priority: "high",
        status: "in_progress",
        assignee: {
          id: "user001",
          name: "張小明",
          department: "IT",
          email: "ming.zhang@company.com",
        },
        project: {
          id: "proj001",
          name: "數位轉型專案",
          department: "IT",
        },
        department: "IT",
        due_date: "2024-02-15",
        estimated_hours: 32,
        actual_hours: 18,
        completion_percentage: 60,
        tags: ["security", "authentication", "frontend"],
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-25T14:30:00Z",
        urgency_score: 85,
      },
      {
        id: "TASK1002",
        title: "月度財務報表生成",
        description:
          "生成 2024 年 1 月份的詳細財務報表，包含收支分析和預算對比",
        type: "documentation",
        priority: "medium",
        status: "pending",
        assignee: {
          id: "user003",
          name: "王小美",
          department: "Finance",
          email: "mei.wang@company.com",
        },
        project: null,
        department: "Finance",
        due_date: "2024-02-05",
        estimated_hours: 8,
        actual_hours: 0,
        completion_percentage: 0,
        tags: ["finance", "reporting", "monthly"],
        created_at: "2024-01-20T10:15:00Z",
        updated_at: "2024-01-20T10:15:00Z",
        urgency_score: 45,
      },
      {
        id: "TASK1003",
        title: "系統效能問題修復",
        description: "修復用戶反映的系統回應緩慢問題，優化資料庫查詢效能",
        type: "bug_fix",
        priority: "urgent",
        status: "in_progress",
        assignee: {
          id: "user004",
          name: "陳小強",
          department: "IT",
          email: "qiang.chen@company.com",
        },
        project: {
          id: "proj001",
          name: "數位轉型專案",
          department: "IT",
        },
        department: "IT",
        due_date: "2024-02-01",
        estimated_hours: 16,
        actual_hours: 12,
        completion_percentage: 75,
        tags: ["performance", "database", "optimization"],
        created_at: "2024-01-22T15:45:00Z",
        updated_at: "2024-01-26T11:20:00Z",
        urgency_score: 130,
      },
      {
        id: "TASK1004",
        title: "新進員工入職流程檢視",
        description: "檢視並優化新進員工入職流程，包含文件準備和系統權限設定",
        type: "review",
        priority: "medium",
        status: "completed",
        assignee: {
          id: "user002",
          name: "李小華",
          department: "HR",
          email: "hua.li@company.com",
        },
        project: {
          id: "proj002",
          name: "人資系統升級",
          department: "HR",
        },
        department: "HR",
        due_date: "2024-01-30",
        estimated_hours: 12,
        actual_hours: 10,
        completion_percentage: 100,
        tags: ["hr", "onboarding", "process"],
        created_at: "2024-01-10T08:30:00Z",
        updated_at: "2024-01-28T16:45:00Z",
        urgency_score: 25,
      },
      {
        id: "TASK1005",
        title: "市場競爭分析報告",
        description: "分析當前市場競爭狀況，提供策略建議和市場定位分析",
        type: "research",
        priority: "medium",
        status: "on_hold",
        assignee: {
          id: "user005",
          name: "林小文",
          department: "Marketing",
          email: "wen.lin@company.com",
        },
        project: {
          id: "proj004",
          name: "市場分析報告",
          department: "Marketing",
        },
        department: "Marketing",
        due_date: "2024-02-20",
        estimated_hours: 40,
        actual_hours: 8,
        completion_percentage: 20,
        tags: ["market", "analysis", "strategy"],
        created_at: "2024-01-12T13:20:00Z",
        updated_at: "2024-01-24T09:15:00Z",
        urgency_score: 35,
      },
      {
        id: "TASK1006",
        title: "資料庫備份系統測試",
        description: "測試自動資料庫備份系統的可靠性和恢復功能",
        type: "testing",
        priority: "high",
        status: "pending",
        assignee: {
          id: "user004",
          name: "陳小強",
          department: "IT",
          email: "qiang.chen@company.com",
        },
        project: null,
        department: "IT",
        due_date: "2024-02-10",
        estimated_hours: 6,
        actual_hours: 0,
        completion_percentage: 0,
        tags: ["database", "backup", "testing"],
        created_at: "2024-01-25T11:00:00Z",
        updated_at: "2024-01-25T11:00:00Z",
        urgency_score: 70,
      },
    ];

    // 將模擬資料加入 Map
    mockTasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }

  async _execute(params, options) {
    try {
      logger.info("開始獲取任務列表", { params });

      // 設定預設值
      const filters = {
        status: params.status || "all",
        priority: params.priority || "all",
        type: params.type || "all",
        assignee_id: params.assignee_id,
        department: params.department,
        project_id: params.project_id,
        due_date_from: params.due_date_from,
        due_date_to: params.due_date_to,
        overdue_only: params.overdue_only || false,
        search_keyword: params.search_keyword,
      };

      const sorting = {
        sort_by: params.sort_by || "due_date",
        sort_order: params.sort_order || "asc",
      };

      const pagination = {
        limit: params.limit || 20,
        offset: params.offset || 0,
      };

      // 過濾任務
      let filteredTasks = this.filterTasks(
        Array.from(this.tasks.values()),
        filters,
      );

      // 排序任務
      filteredTasks = this.sortTasks(filteredTasks, sorting);

      // 計算總數（分頁前）
      const totalCount = filteredTasks.length;

      // 分頁處理
      const paginatedTasks = filteredTasks.slice(
        pagination.offset,
        pagination.offset + pagination.limit,
      );

      // 準備回應資料
      const response = {
        success: true,
        tasks: paginatedTasks,
        pagination: {
          total_count: totalCount,
          limit: pagination.limit,
          offset: pagination.offset,
          has_more: pagination.offset + pagination.limit < totalCount,
        },
        filters_applied: filters,
        sorting_applied: sorting,
      };

      // 包含統計資訊
      if (params.include_statistics !== false) {
        response.statistics = this.generateStatistics(
          Array.from(this.tasks.values()),
        );
      }

      // 包含管理建議
      if (params.include_suggestions === true) {
        response.suggestions =
          this.generateManagementSuggestions(filteredTasks);
      }

      logger.info("任務列表獲取成功", {
        totalTasks: totalCount,
        returnedTasks: paginatedTasks.length,
      });

      return response;
    } catch (error) {
      logger.error("獲取任務列表失敗", error, { params });
      return {
        success: false,
        error: error.message,
        error_code: "TASK_LIST_FETCH_FAILED",
      };
    }
  }

  /**
   * 過濾任務
   */
  filterTasks(tasks, filters) {
    return tasks.filter(task => {
      // 狀態過濾
      if (filters.status !== "all" && task.status !== filters.status) {
        return false;
      }

      // 優先級過濾
      if (filters.priority !== "all" && task.priority !== filters.priority) {
        return false;
      }

      // 類型過濾
      if (filters.type !== "all" && task.type !== filters.type) {
        return false;
      }

      // 指派人員過濾
      if (filters.assignee_id && task.assignee.id !== filters.assignee_id) {
        return false;
      }

      // 部門過濾
      if (filters.department && task.department !== filters.department) {
        return false;
      }

      // 專案過濾
      if (filters.project_id) {
        if (!task.project || task.project.id !== filters.project_id) {
          return false;
        }
      }

      // 截止日期範圍過濾
      if (filters.due_date_from || filters.due_date_to) {
        const taskDueDate = new Date(task.due_date);

        if (filters.due_date_from) {
          const fromDate = new Date(filters.due_date_from);
          if (taskDueDate < fromDate) {
            return false;
          }
        }

        if (filters.due_date_to) {
          const toDate = new Date(filters.due_date_to);
          if (taskDueDate > toDate) {
            return false;
          }
        }
      }

      // 逾期任務過濾
      if (filters.overdue_only) {
        const now = new Date();
        const dueDate = new Date(task.due_date);
        if (dueDate >= now || task.status === "completed") {
          return false;
        }
      }

      // 關鍵字搜尋
      if (filters.search_keyword) {
        const keyword = filters.search_keyword.toLowerCase();
        const searchText =
          `${task.title} ${task.description} ${task.tags.join(" ")}`.toLowerCase();
        if (!searchText.includes(keyword)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 排序任務
   */
  sortTasks(tasks, sorting) {
    return tasks.sort((a, b) => {
      let valueA, valueB;

      switch (sorting.sort_by) {
        case "due_date":
          valueA = new Date(a.due_date);
          valueB = new Date(b.due_date);
          break;
        case "priority":
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
          valueA = priorityOrder[a.priority];
          valueB = priorityOrder[b.priority];
          break;
        case "status":
          const statusOrder = {
            pending: 1,
            in_progress: 2,
            on_hold: 3,
            completed: 4,
            cancelled: 5,
          };
          valueA = statusOrder[a.status];
          valueB = statusOrder[b.status];
          break;
        case "created_at":
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
        case "updated_at":
          valueA = new Date(a.updated_at);
          valueB = new Date(b.updated_at);
          break;
        case "urgency_score":
          valueA = a.urgency_score;
          valueB = b.urgency_score;
          break;
        case "completion_percentage":
          valueA = a.completion_percentage;
          valueB = b.completion_percentage;
          break;
        default:
          valueA = a[sorting.sort_by];
          valueB = b[sorting.sort_by];
      }

      if (valueA < valueB) {
        return sorting.sort_order === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sorting.sort_order === "asc" ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * 生成統計資訊
   */
  generateStatistics(allTasks) {
    const stats = {
      total_tasks: allTasks.length,
      by_status: {},
      by_priority: {},
      by_type: {},
      by_department: {},
      overdue_count: 0,
      completed_on_time: 0,
      average_completion: 0,
      total_estimated_hours: 0,
      total_actual_hours: 0,
    };

    const now = new Date();
    let totalCompletion = 0;

    allTasks.forEach(task => {
      // 按狀態統計
      stats.by_status[task.status] = (stats.by_status[task.status] || 0) + 1;

      // 按優先級統計
      stats.by_priority[task.priority] =
        (stats.by_priority[task.priority] || 0) + 1;

      // 按類型統計
      stats.by_type[task.type] = (stats.by_type[task.type] || 0) + 1;

      // 按部門統計
      stats.by_department[task.department] =
        (stats.by_department[task.department] || 0) + 1;

      // 逾期任務統計
      const dueDate = new Date(task.due_date);
      if (dueDate < now && task.status !== "completed") {
        stats.overdue_count++;
      }

      // 準時完成統計
      if (task.status === "completed" && dueDate >= now) {
        stats.completed_on_time++;
      }

      // 完成度統計
      totalCompletion += task.completion_percentage;

      // 工時統計
      stats.total_estimated_hours += task.estimated_hours || 0;
      stats.total_actual_hours += task.actual_hours || 0;
    });

    // 計算平均完成度
    stats.average_completion =
      allTasks.length > 0 ? Math.round(totalCompletion / allTasks.length) : 0;

    // 計算工時效率
    stats.hour_efficiency =
      stats.total_estimated_hours > 0
        ? Math.round(
            (stats.total_actual_hours / stats.total_estimated_hours) * 100,
          )
        : 0;

    return stats;
  }

  /**
   * 生成管理建議
   */
  generateManagementSuggestions(tasks) {
    const suggestions = [];
    const now = new Date();

    // 逾期任務建議
    const overdueTasks = tasks.filter(task => {
      const dueDate = new Date(task.due_date);
      return dueDate < now && task.status !== "completed";
    });

    if (overdueTasks.length > 0) {
      suggestions.push({
        type: "warning",
        title: "逾期任務注意",
        message: `有 ${overdueTasks.length} 個任務已逾期，建議立即檢視並調整優先級`,
        action: "檢視逾期任務列表並重新安排資源",
      });
    }

    // 緊急任務建議
    const urgentTasks = tasks.filter(
      task => task.priority === "urgent" && task.status !== "completed",
    );

    if (urgentTasks.length > 0) {
      suggestions.push({
        type: "urgent",
        title: "緊急任務提醒",
        message: `有 ${urgentTasks.length} 個緊急任務需要關注`,
        action: "優先處理緊急任務並增加資源投入",
      });
    }

    // 工作負載建議
    const assigneeWorkload = {};
    tasks
      .filter(
        task => task.status === "in_progress" || task.status === "pending",
      )
      .forEach(task => {
        const assigneeId = task.assignee.id;
        if (!assigneeWorkload[assigneeId]) {
          assigneeWorkload[assigneeId] = {
            name: task.assignee.name,
            tasks: 0,
            estimated_hours: 0,
          };
        }
        assigneeWorkload[assigneeId].tasks++;
        assigneeWorkload[assigneeId].estimated_hours +=
          task.estimated_hours || 0;
      });

    const overloadedAssignees = Object.values(assigneeWorkload).filter(
      assignee => assignee.tasks > 5 || assignee.estimated_hours > 40,
    );

    if (overloadedAssignees.length > 0) {
      suggestions.push({
        type: "info",
        title: "工作負載平衡",
        message: `有 ${overloadedAssignees.length} 位員工工作負載較重，建議重新分配任務`,
        action: "檢視人員工作分配並考慮調整任務分派",
      });
    }

    // 專案進度建議
    const projectProgress = {};
    tasks.forEach(task => {
      if (task.project) {
        const projectId = task.project.id;
        if (!projectProgress[projectId]) {
          projectProgress[projectId] = {
            name: task.project.name,
            total_tasks: 0,
            completed_tasks: 0,
            average_completion: 0,
          };
        }
        projectProgress[projectId].total_tasks++;
        if (task.status === "completed") {
          projectProgress[projectId].completed_tasks++;
        }
        projectProgress[projectId].average_completion +=
          task.completion_percentage;
      }
    });

    Object.values(projectProgress).forEach(project => {
      project.average_completion = Math.round(
        project.average_completion / project.total_tasks,
      );
      if (project.average_completion < 50) {
        suggestions.push({
          type: "warning",
          title: "專案進度落後",
          message: `專案「${project.name}」進度較慢（平均完成度 ${project.average_completion}%）`,
          action: "檢視專案計劃並識別阻礙因素",
        });
      }
    });

    return suggestions;
  }
}
