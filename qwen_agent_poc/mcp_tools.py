"""
MCP 工具包裝器
將 SFDA MCP Server 的 HTTP API 包裝成 Qwen-Agent 可使用的函數工具
"""

import requests
import json
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging

from config import MCP_SERVER_CONFIG

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCPClient:
    """MCP Server 客戶端，處理與 SFDA MCP Server 的通信"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or MCP_SERVER_CONFIG["base_url"]
        self.timeout = MCP_SERVER_CONFIG["timeout"]
        self.retry_attempts = MCP_SERVER_CONFIG["retry_attempts"]
        self.retry_delay = MCP_SERVER_CONFIG["retry_delay"]
        
    def _make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """發送 HTTP 請求到 MCP Server"""
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(self.retry_attempts):
            try:
                if method.upper() == "GET":
                    response = requests.get(url, params=data, timeout=self.timeout)
                else:
                    response = requests.post(url, json=data, timeout=self.timeout)
                
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"請求失敗 (嘗試 {attempt + 1}/{self.retry_attempts}): {e}")
                if attempt < self.retry_attempts - 1:
                    time.sleep(self.retry_delay)
                else:
                    raise Exception(f"MCP Server 請求失敗: {e}")
    
    def call_tool(self, module: str, tool_name: str, parameters: Dict) -> Dict:
        """調用指定的 MCP 工具"""
        endpoint = f"/api/{module}/{tool_name}"
        logger.info(f"調用工具: {module}.{tool_name} 參數: {parameters}")
        
        result = self._make_request("POST", endpoint, parameters)
        logger.info(f"工具調用結果: {result}")
        return result

# 全局 MCP 客戶端實例
mcp_client = MCPClient()

# ================================
# HR 工具包裝器
# ================================

def get_employee_info(employeeId: str, includeDetails: bool = True, fields: List[str] = None) -> str:
    """
    查詢員工基本資訊
    
    Args:
        employeeId: 員工編號（格式：A123456）
        includeDetails: 是否包含詳細資訊
        fields: 指定返回的欄位
    
    Returns:
        員工資訊的 JSON 字符串
    """
    try:
        params = {
            "employeeId": employeeId,
            "includeDetails": includeDetails
        }
        if fields:
            params["fields"] = fields
            
        result = mcp_client.call_tool("hr", "get_employee_info", params)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"查詢員工資訊時發生錯誤: {str(e)}"

def get_employee_list(department: str = None, jobTitle: str = None, status: str = "active", 
                     page: int = 1, limit: int = 20, includeDetails: bool = False) -> str:
    """
    查詢員工名單
    
    Args:
        department: 部門代碼或名稱
        jobTitle: 職位名稱
        status: 員工狀態 (active/inactive/all)
        page: 頁碼
        limit: 每頁筆數
        includeDetails: 是否包含詳細資訊
    
    Returns:
        員工名單的 JSON 字符串
    """
    try:
        params = {
            "status": status,
            "page": page,
            "limit": limit,
            "includeDetails": includeDetails
        }
        if department:
            params["department"] = department
        if jobTitle:
            params["jobTitle"] = jobTitle
            
        result = mcp_client.call_tool("hr", "get_employee_list", params)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"查詢員工名單時發生錯誤: {str(e)}"

def get_attendance_record(employeeId: str, startDate: str, endDate: str, 
                         recordType: str = "all", includeDetails: bool = True) -> str:
    """
    查詢員工出勤記錄
    
    Args:
        employeeId: 員工編號
        startDate: 查詢起始日期 (YYYY-MM-DD)
        endDate: 查詢結束日期 (YYYY-MM-DD)
        recordType: 記錄類型 (all/attendance/overtime/leave)
        includeDetails: 是否包含詳細資訊
    
    Returns:
        出勤記錄的 JSON 字符串
    """
    try:
        params = {
            "employeeId": employeeId,
            "startDate": startDate,
            "endDate": endDate,
            "recordType": recordType,
            "includeDetails": includeDetails
        }
        
        result = mcp_client.call_tool("hr", "get_attendance_record", params)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"查詢出勤記錄時發生錯誤: {str(e)}"

def get_department_list(includeInactive: bool = False, includeStats: bool = True,
                       parentDepartmentId: str = None, level: int = None) -> str:
    """
    查詢公司部門清單
    
    Args:
        includeInactive: 是否包含已停用的部門
        includeStats: 是否包含部門統計資訊
        parentDepartmentId: 上級部門 ID
        level: 部門層級
    
    Returns:
        部門清單的 JSON 字符串
    """
    try:
        params = {
            "includeInactive": includeInactive,
            "includeStats": includeStats
        }
        if parentDepartmentId:
            params["parentDepartmentId"] = parentDepartmentId
        if level:
            params["level"] = level
            
        result = mcp_client.call_tool("hr", "get_department_list", params)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"查詢部門清單時發生錯誤: {str(e)}"

# ================================
# Task 工具包裝器
# ================================

def create_task(title: str, description: str, type: str, assignee_id: str, 
               due_date: str, department: str, priority: str = "medium",
               project_id: str = None, estimated_hours: float = None, 
               tags: List[str] = None) -> str:
    """
    創建新的任務項目
    
    Args:
        title: 任務標題
        description: 任務詳細描述
        type: 任務類型 (development/maintenance/meeting/review/documentation/research/bug_fix/testing)
        assignee_id: 指派給的用戶 ID
        due_date: 截止日期 (YYYY-MM-DD)
        department: 負責部門
        priority: 任務優先級 (low/medium/high/urgent)
        project_id: 關聯的專案 ID
        estimated_hours: 預估工時
        tags: 任務標籤
    
    Returns:
        創建結果的 JSON 字符串
    """
    try:
        params = {
            "title": title,
            "description": description,
            "type": type,
            "assignee_id": assignee_id,
            "due_date": due_date,
            "department": department,
            "priority": priority
        }
        if project_id:
            params["project_id"] = project_id
        if estimated_hours:
            params["estimated_hours"] = estimated_hours
        if tags:
            params["tags"] = tags
            
        result = mcp_client.call_tool("tasks", "create_task", params)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"創建任務時發生錯誤: {str(e)}"

def get_task_list(status: str = "all", priority: str = "all", type: str = "all",
                 assignee_id: str = None, department: str = None, project_id: str = None,
                 due_date_from: str = None, due_date_to: str = None, overdue_only: bool = False,
                 search_keyword: str = None, sort_by: str = "due_date", sort_order: str = "asc",
                 limit: int = 20, offset: int = 0, include_statistics: bool = True) -> str:
    """
    獲取任務列表
    
    Args:
        status: 任務狀態過濾
        priority: 優先級過濾
        type: 任務類型過濾
        assignee_id: 指派人員 ID 過濾
        department: 部門過濾
        project_id: 專案 ID 過濾
        due_date_from: 截止日期起始範圍
        due_date_to: 截止日期結束範圍
        overdue_only: 只顯示逾期任務
        search_keyword: 搜尋關鍵字
        sort_by: 排序欄位
        sort_order: 排序順序
        limit: 返回結果數量限制
        offset: 結果偏移量
        include_statistics: 是否包含統計資訊
    
    Returns:
        任務列表的 JSON 字符串
    """
    try:
        params = {
            "status": status,
            "priority": priority,
            "type": type,
            "overdue_only": overdue_only,
            "sort_by": sort_by,
            "sort_order": sort_order,
            "limit": limit,
            "offset": offset,
            "include_statistics": include_statistics
        }
        
        # 添加可選參數
        optional_params = {
            "assignee_id": assignee_id,
            "department": department,
            "project_id": project_id,
            "due_date_from": due_date_from,
            "due_date_to": due_date_to,
            "search_keyword": search_keyword
        }
        
        for key, value in optional_params.items():
            if value is not None:
                params[key] = value
                
        result = mcp_client.call_tool("tasks", "get_task_list", params)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"查詢任務列表時發生錯誤: {str(e)}"

# ================================
# Finance 工具包裝器
# ================================

def get_budget_status(budgetType: str = "department", budgetId: str = None,
                     fiscalYear: int = 2025, quarter: int = None, month: int = None,
                     includeDetails: bool = True, includeForecasting: bool = False,
                     currency: str = "TWD", threshold: float = None) -> str:
    """
    查詢部門或專案的預算狀態
    
    Args:
        budgetType: 預算類型 (department/project/category/all)
        budgetId: 預算ID（部門代碼、專案代碼或類別代碼）
        fiscalYear: 會計年度
        quarter: 季度 (1-4)
        month: 月份 (1-12)
        includeDetails: 是否包含詳細支出明細
        includeForecasting: 是否包含預算預測分析
        currency: 貨幣單位 (TWD/USD/EUR)
        threshold: 預算使用率警示門檻
    
    Returns:
        預算狀態的 JSON 字符串
    """
    try:
        params = {
            "budgetType": budgetType,
            "fiscalYear": fiscalYear,
            "includeDetails": includeDetails,
            "includeForecasting": includeForecasting,
            "currency": currency
        }
        
        # 添加可選參數
        optional_params = {
            "budgetId": budgetId,
            "quarter": quarter,
            "month": month,
            "threshold": threshold
        }
        
        for key, value in optional_params.items():
            if value is not None:
                params[key] = value
                
        result = mcp_client.call_tool("finance", "get_budget_status", params)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"查詢預算狀態時發生錯誤: {str(e)}"

# ================================
# 工具註冊列表
# ================================

# Qwen-Agent 工具註冊
AVAILABLE_TOOLS = [
    # HR 工具
    {
        "name": "get_employee_info",
        "description": "查詢員工基本資訊，包括個人資料、部門、職位等",
        "function": get_employee_info
    },
    {
        "name": "get_employee_list", 
        "description": "查詢員工名單，可依部門、職位、狀態等條件過濾",
        "function": get_employee_list
    },
    {
        "name": "get_attendance_record",
        "description": "查詢員工出勤記錄，包括打卡、請假、加班等記錄",
        "function": get_attendance_record
    },
    {
        "name": "get_department_list",
        "description": "查詢公司部門清單，包括部門資訊和人員統計",
        "function": get_department_list
    },
    
    # Task 工具
    {
        "name": "create_task",
        "description": "創建新的任務項目，支援多種任務類型和優先級設定",
        "function": create_task
    },
    {
        "name": "get_task_list",
        "description": "獲取任務列表，支援多種過濾條件和排序方式",
        "function": get_task_list
    },
    
    # Finance 工具
    {
        "name": "get_budget_status",
        "description": "查詢部門或專案的預算狀態，包括預算使用情況和預測分析",
        "function": get_budget_status
    }
]

def get_function_list():
    """返回可用的工具函數列表，供 Qwen-Agent 使用"""
    return [tool["function"] for tool in AVAILABLE_TOOLS]

def get_tool_descriptions():
    """返回工具描述列表，用於生成 system prompt"""
    descriptions = []
    for tool in AVAILABLE_TOOLS:
        descriptions.append(f"- {tool['name']}: {tool['description']}")
    return "\n".join(descriptions)

# 測試函數
def test_mcp_connection():
    """測試 MCP Server 連接"""
    try:
        # 測試健康檢查
        response = requests.get(f"{mcp_client.base_url}/health", timeout=5)
        response.raise_for_status()
        
        print("✅ MCP Server 連接正常")
        
        # 測試基本工具調用
        print("\n🧪 測試基本工具調用...")
        
        # 測試部門列表查詢
        result = get_department_list()
        print(f"部門列表查詢結果: {result[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ MCP Server 連接失敗: {e}")
        return False

if __name__ == "__main__":
    # 執行連接測試
    test_mcp_connection()
    
    # 顯示可用工具
    print(f"\n📋 可用工具列表:")
    print(get_tool_descriptions()) 