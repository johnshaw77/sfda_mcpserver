"""
Qwen-Agent 工具定義
基於 BaseTool 創建 SFDA MCP Server 工具
"""

import json
import logging
from qwen_agent.tools import BaseTool
from mcp_tools import (
    get_employee_info, get_employee_list, get_attendance_record, get_department_list,
    create_task, get_task_list, get_budget_status
)
from tool_result_enforcer import tool_result_enforcer

logger = logging.getLogger(__name__)

class GetEmployeeInfoTool(BaseTool):
    name = "get_employee_info"
    description = "查詢員工基本資訊，包括個人資料、部門、職位等"
    parameters = [
        {
            "name": "employeeId",
            "type": "string", 
            "description": "員工編號（格式：A123456）",
            "required": True
        },
        {
            "name": "includeDetails",
            "type": "boolean",
            "description": "是否包含詳細資訊",
            "required": False
        }
    ]
    
    def call(self, parameters, **kwargs):
        """執行工具並強制結果使用"""
        employeeId = parameters.get("employeeId")
        includeDetails = parameters.get("includeDetails", True)
        
        # 執行工具
        result = get_employee_info(employeeId, includeDetails)
        
        # 註冊工具結果
        call_id = tool_result_enforcer.register_tool_result(
            "get_employee_info", parameters, result
        )
        
        # 記錄詳細執行過程
        logger.info(f"🔧 執行 get_employee_info: {employeeId} -> {result}")
        
        # 檢查結果類型並強制返回實際結果
        if isinstance(result, dict) and "error" in result:
            # 如果是錯誤結果，直接返回錯誤訊息
            return f"❌ 查詢失敗：{result.get('error', '未知錯誤')}"
        elif isinstance(result, dict) and "data" in result:
            # 如果是成功結果，返回格式化的員工資料
            employee_data = result["data"]
            return f"""✅ 員工資料查詢成功

員工編號：{employee_data.get('employeeId', 'N/A')}
姓名：{employee_data.get('name', 'N/A')}
部門：{employee_data.get('department', 'N/A')}
職位：{employee_data.get('jobTitle', 'N/A')}
電子郵件：{employee_data.get('email', 'N/A')}
電話：{employee_data.get('phone', 'N/A')}
入職日期：{employee_data.get('hireDate', 'N/A')}
狀態：{employee_data.get('status', 'N/A')}

[工具執行ID: {call_id}]"""
        else:
            # 其他情況，返回原始結果
            return f"🔧 工具執行結果：{result}\n[工具執行ID: {call_id}]"

class GetEmployeeListTool(BaseTool):
    name = "get_employee_list"
    description = "查詢員工名單，可依部門、職位、狀態等條件過濾"
    parameters = [
        {
            "name": "department",
            "type": "string",
            "description": "部門代碼或名稱",
            "required": False
        },
        {
            "name": "jobTitle", 
            "type": "string",
            "description": "職位名稱",
            "required": False
        },
        {
            "name": "status",
            "type": "string",
            "description": "員工狀態 (active/inactive/all)",
            "required": False
        }
    ]
    
    def call(self, parameters, **kwargs):
        department = parameters.get("department")
        jobTitle = parameters.get("jobTitle")
        status = parameters.get("status", "active")
        return get_employee_list(department, jobTitle, status)

class GetAttendanceRecordTool(BaseTool):
    name = "get_attendance_record"
    description = "查詢員工出勤記錄，包括打卡、請假、加班等記錄"
    parameters = [
        {
            "name": "employeeId",
            "type": "string",
            "description": "員工編號",
            "required": True
        },
        {
            "name": "startDate",
            "type": "string", 
            "description": "查詢起始日期 (YYYY-MM-DD)",
            "required": True
        },
        {
            "name": "endDate",
            "type": "string",
            "description": "查詢結束日期 (YYYY-MM-DD)",
            "required": True
        }
    ]
    
    def call(self, parameters, **kwargs):
        employeeId = parameters.get("employeeId")
        startDate = parameters.get("startDate") 
        endDate = parameters.get("endDate")
        return get_attendance_record(employeeId, startDate, endDate)

class GetDepartmentListTool(BaseTool):
    name = "get_department_list"
    description = "查詢公司部門清單，包括部門資訊和人員統計"
    parameters = [
        {
            "name": "includeInactive",
            "type": "boolean",
            "description": "是否包含已停用的部門",
            "required": False
        },
        {
            "name": "includeStats",
            "type": "boolean",
            "description": "是否包含部門統計資訊", 
            "required": False
        }
    ]
    
    def call(self, parameters, **kwargs):
        includeInactive = parameters.get("includeInactive", False)
        includeStats = parameters.get("includeStats", True)
        return get_department_list(includeInactive, includeStats)

class CreateTaskTool(BaseTool):
    name = "create_task"
    description = "創建新的任務項目，支援多種任務類型和優先級設定"
    parameters = [
        {
            "name": "title",
            "type": "string",
            "description": "任務標題",
            "required": True
        },
        {
            "name": "description",
            "type": "string", 
            "description": "任務詳細描述",
            "required": True
        },
        {
            "name": "type",
            "type": "string",
            "description": "任務類型 (development/maintenance/meeting/review/documentation/research/bug_fix/testing)",
            "required": True
        },
        {
            "name": "assignee_id",
            "type": "string",
            "description": "指派給的用戶 ID",
            "required": True
        },
        {
            "name": "due_date",
            "type": "string",
            "description": "截止日期 (YYYY-MM-DD)",
            "required": True
        },
        {
            "name": "department",
            "type": "string",
            "description": "負責部門",
            "required": True
        },
        {
            "name": "priority",
            "type": "string",
            "description": "任務優先級 (low/medium/high/urgent)",
            "required": False
        }
    ]
    
    def call(self, parameters, **kwargs):
        title = parameters.get("title")
        description = parameters.get("description")
        task_type = parameters.get("type")
        assignee_id = parameters.get("assignee_id")
        due_date = parameters.get("due_date")
        department = parameters.get("department")
        priority = parameters.get("priority", "medium")
        
        return create_task(title, description, task_type, assignee_id, due_date, department, priority)

class GetTaskListTool(BaseTool):
    name = "get_task_list"
    description = "獲取任務列表，支援多種過濾條件和排序方式"
    parameters = [
        {
            "name": "status",
            "type": "string",
            "description": "任務狀態過濾",
            "required": False
        },
        {
            "name": "priority",
            "type": "string",
            "description": "優先級過濾",
            "required": False
        },
        {
            "name": "assignee_id",
            "type": "string",
            "description": "指派人員 ID 過濾",
            "required": False
        }
    ]
    
    def call(self, parameters, **kwargs):
        status = parameters.get("status", "all")
        priority = parameters.get("priority", "all")
        assignee_id = parameters.get("assignee_id")
        return get_task_list(status, priority, assignee_id=assignee_id)

class GetBudgetStatusTool(BaseTool):
    name = "get_budget_status"
    description = "查詢部門或專案的預算狀態，包括預算使用情況和預測分析"
    parameters = [
        {
            "name": "budgetType",
            "type": "string",
            "description": "預算類型 (department/project/category/all)",
            "required": False
        },
        {
            "name": "budgetId",
            "type": "string", 
            "description": "預算ID（部門代碼、專案代碼或類別代碼）",
            "required": False
        },
        {
            "name": "fiscalYear",
            "type": "integer",
            "description": "會計年度",
            "required": False
        }
    ]
    
    def call(self, parameters, **kwargs):
        budgetType = parameters.get("budgetType", "department")
        budgetId = parameters.get("budgetId")
        fiscalYear = parameters.get("fiscalYear", 2025)
        return get_budget_status(budgetType, budgetId, fiscalYear)

# 工具列表
QWEN_TOOLS = [
    GetEmployeeInfoTool(),
    GetEmployeeListTool(), 
    GetAttendanceRecordTool(),
    GetDepartmentListTool(),
    CreateTaskTool(),
    GetTaskListTool(),
    GetBudgetStatusTool()
]

def get_qwen_tools():
    """返回所有 Qwen-Agent 工具實例"""
    return QWEN_TOOLS

def get_tool_names():
    """返回工具名稱列表"""
    return [tool.name for tool in QWEN_TOOLS]

def get_tool_descriptions():
    """返回工具描述列表"""
    descriptions = []
    for tool in QWEN_TOOLS:
        descriptions.append(f"- {tool.name}: {tool.description}")
    return "\n".join(descriptions) 