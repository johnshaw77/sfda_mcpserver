"""
工具結果強制執行器
確保 AI 只使用實際的工具執行結果，防止編造資料
"""

import json
import logging
import time
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class ToolResultEnforcer:
    """工具結果強制執行器"""
    
    def __init__(self):
        self.tool_results = {}
        self.fabrication_indicators = {
            "employee_info": [
                "陳志強", "陳志", "招聘經理", "2020-03-15",
                "chenzq@company.com", "(02) 2345-6789",
                "人力資源經理", "chenzq"
                # 移除單純的 "HR" 關鍵字，因為真實HR部門員工會觸發誤報
            ],
            "generic_fabricated": [
                "根據我的了解", "據我所知", "通常來說", "一般而言",
                "可能是", "推測", "估計", "大概", "應該是"
            ],
            "specific_fabricated_patterns": [
                "陳志強.*HR", "陳志強.*人力資源", "陳志強.*招聘",
                "chenzq@company.com", "2020-03-15.*入職"
            ]
        }
        
    def register_tool_result(self, tool_name: str, parameters: Dict[str, Any], result: Any) -> str:
        """註冊工具執行結果"""
        call_id = f"{tool_name}_{hash(str(parameters))}"
        self.tool_results[call_id] = {
            "tool_name": tool_name,
            "parameters": parameters,
            "result": result,
            "timestamp": time.time()
        }
        logger.info(f"📝 註冊工具結果: {call_id}")
        return call_id
    
    def get_tool_result(self, call_id: str) -> Optional[Any]:
        """獲取工具執行結果"""
        return self.tool_results.get(call_id, {}).get("result")
    
    def _is_context_valid(self, indicator: str, response: str, context: Dict[str, Any]) -> bool:
        """智能檢測：驗證指標是否在正確的上下文中"""
        
        # 獲取最近的工具調用結果
        recent_tool_results = list(self.tool_results.values())[-3:]  # 檢查最近3次調用
        
        for tool_result in recent_tool_results:
            if tool_result["tool_name"] == "get_employee_info":
                result_data = tool_result["result"]
                
                # 如果是成功的員工查詢
                if (isinstance(result_data, dict) and 
                    result_data.get("success") and 
                    "result" in result_data):
                    
                    employee_data = result_data["result"]
                    if isinstance(employee_data, dict) and "data" in employee_data:
                        dept_info = employee_data["data"].get("department", {})
                        
                        # 如果員工真的在HR部門，且指標是"HR"相關，則不算編造
                        if (indicator == "HR" and 
                            dept_info.get("departmentCode") == "HR"):
                            return True
                            
                        # 如果員工真的是HR部門，且提到人力資源，則不算編造
                        if (indicator == "人力資源經理" and 
                            dept_info.get("departmentName") == "人力資源部"):
                            return True
        
        return False
    
    def validate_response(self, response: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """驗證回應是否包含編造內容"""
        validation_result = {
            "is_valid": True,
            "fabricated_content": [],
            "corrected_response": response,
            "confidence": 1.0
        }
        
        # 檢查是否包含編造指示器
        for category, indicators in self.fabrication_indicators.items():
            for indicator in indicators:
                if indicator in response:
                    # 智能檢測：檢查是否在正確上下文中
                    if not self._is_context_valid(indicator, response, context):
                        validation_result["is_valid"] = False
                        validation_result["fabricated_content"].append({
                            "category": category,
                            "indicator": indicator,
                            "position": response.find(indicator)
                        })
        
        # 如果發現編造內容，嘗試修正
        if not validation_result["is_valid"]:
            validation_result["corrected_response"] = self._correct_fabricated_response(
                response, context, validation_result["fabricated_content"]
            )
            validation_result["confidence"] = 0.0
        
        return validation_result
    
    def _correct_fabricated_response(self, response: str, context: Dict[str, Any], 
                                   fabricated_items: List[Dict]) -> str:
        """修正包含編造內容的回應"""
        logger.warning(f"🚨 偵測到編造內容: {fabricated_items}")
        
        # 檢查是否為員工查詢相關
        if any(item["category"] == "employee_info" for item in fabricated_items):
            return self._handle_employee_fabrication(context)
        
        # 通用編造處理
        return f"""🚨 系統安全警告：偵測到可能的 AI 編造內容

原始回應：
{response}

⚠️ 問題說明：
系統偵測到回應中包含未經工具驗證的資訊，這可能是 AI 基於訓練資料的推測，而非實際的系統資料。

🔧 建議操作：
1. 請重新查詢或調整查詢條件
2. 確認輸入參數格式正確
3. 如問題持續，請聯絡技術支援

偵測到的可疑內容：
{json.dumps(fabricated_items, ensure_ascii=False, indent=2)}
"""
    
    def _handle_employee_fabrication(self, context: Dict[str, Any]) -> str:
        """處理員工資料編造"""
        employee_id = context.get("employee_id", "未知")
        
        return f"""🚨 員工資料查詢錯誤

查詢員工編號：{employee_id}

⚠️ 錯誤說明：
系統偵測到 AI 可能編造了不存在的員工資料。這違反了數據安全原則。

✅ 正確的處理方式：
1. 如果員工編號不存在，應明確告知「員工編號不存在」
2. 如果查詢失敗，應報告具體的錯誤原因
3. 絕不能提供未經系統驗證的員工資料

🔍 測試用員工編號：
- A123456：張小明（資訊技術部）
- A123457：李小華（人力資源部）

請重新使用正確的員工編號查詢。
"""
    
    def enforce_tool_only_response(self, tool_calls: List[Dict], raw_response: str) -> str:
        """強制只使用工具結果的回應"""
        if not tool_calls:
            return "⚠️ 沒有執行任何工具調用，無法提供資料。"
        
        # 構建基於工具結果的回應
        tool_based_response = "🔧 工具執行結果：\n\n"
        
        for i, tool_call in enumerate(tool_calls, 1):
            tool_name = tool_call.get("name", "未知工具")
            parameters = tool_call.get("parameters", {})
            result = tool_call.get("result", "無結果")
            
            tool_based_response += f"{i}. **{tool_name}**\n"
            tool_based_response += f"   參數：{json.dumps(parameters, ensure_ascii=False)}\n"
            tool_based_response += f"   結果：{result}\n\n"
        
        # 驗證原始回應
        validation = self.validate_response(raw_response, {})
        
        if not validation["is_valid"]:
            tool_based_response += f"⚠️ **注意**：原始 AI 回應包含可疑內容，已被系統過濾。\n\n"
            tool_based_response += "✅ 以上為實際工具執行的真實結果。"
        else:
            tool_based_response += f"💬 **AI 分析**：\n{raw_response}"
        
        return tool_based_response
    
    def clear_old_results(self, max_age_seconds: int = 3600):
        """清理過期的工具結果"""
        current_time = time.time()
        expired_keys = [
            key for key, value in self.tool_results.items()
            if current_time - value["timestamp"] > max_age_seconds
        ]
        
        for key in expired_keys:
            del self.tool_results[key]
        
        if expired_keys:
            logger.info(f"🧹 清理了 {len(expired_keys)} 個過期工具結果")

# 全局實例
tool_result_enforcer = ToolResultEnforcer()
