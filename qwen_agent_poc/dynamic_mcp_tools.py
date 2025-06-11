"""
動態 MCP 工具發現機制
自動從 SFDA MCP Server 獲取工具列表並生成 Qwen-Agent 可用的工具包裝器
"""

import requests
import json
import logging
from typing import Dict, List, Any, Callable
from functools import wraps
import inspect

from config import MCP_SERVER_CONFIG

logger = logging.getLogger(__name__)

class DynamicMCPToolManager:
    """動態 MCP 工具管理器"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or MCP_SERVER_CONFIG["base_url"]
        self.tools_cache = {}
        self.tool_functions = {}
        
    def discover_tools(self) -> Dict[str, List[Dict]]:
        """從 MCP Server 發現所有可用工具"""
        try:
            discovered_tools = {}
            
            # 獲取所有模組的工具
            modules = ["hr", "tasks", "finance"]  # 可以動態獲取 TODO: 如果有新增 例如 客訴、品保 ?
            
            for module in modules:
                try:
                    response = requests.get(
                        f"{self.base_url}/api/{module}/tools",
                        timeout=10
                    )
                    response.raise_for_status()
                    
                    tools_data = response.json()
                    if tools_data.get("success") and "tools" in tools_data:
                        discovered_tools[module] = tools_data["tools"]
                        logger.info(f"✅ 發現 {module} 模組的 {len(tools_data['tools'])} 個工具")
                    
                except Exception as e:
                    logger.warning(f"⚠️ 無法獲取 {module} 模組工具: {e}")
            
            self.tools_cache = discovered_tools
            return discovered_tools
            
        except Exception as e:
            logger.error(f"❌ 工具發現失敗: {e}")
            return {}
    
    def generate_tool_function(self, module: str, tool_info: Dict) -> Callable:
        """動態生成工具函數"""
        tool_name = tool_info.get("name")
        tool_description = tool_info.get("description", "")
        tool_parameters = tool_info.get("parameters", {})
        
        def dynamic_tool_function(**kwargs) -> str:
            """動態生成的工具函數"""
            try:
                # 驗證參數
                validated_params = self._validate_parameters(kwargs, tool_parameters)
                
                # 調用 MCP 工具
                response = requests.post(
                    f"{self.base_url}/api/{module}/{tool_name}",
                    json=validated_params,
                    timeout=30
                )
                response.raise_for_status()
                
                result = response.json()
                return json.dumps(result, ensure_ascii=False, indent=2)
                
            except Exception as e:
                return f"調用工具 {module}.{tool_name} 時發生錯誤: {str(e)}"
        
        # 設定函數元數據
        dynamic_tool_function.__name__ = f"{module}_{tool_name}"
        dynamic_tool_function.__doc__ = f"""
        {tool_description}
        
        模組: {module}
        工具: {tool_name}
        
        參數:
        {self._format_parameters_doc(tool_parameters)}
        """
        
        return dynamic_tool_function
    
    def _validate_parameters(self, params: Dict, schema: Dict) -> Dict:
        """驗證和處理參數"""
        validated = {}
        
        # 簡單的參數驗證邏輯
        for key, value in params.items():
            if value is not None:
                validated[key] = value
        
        return validated
    
    def _format_parameters_doc(self, parameters: Dict) -> str:
        """格式化參數文檔"""
        if not parameters:
            return "無參數"
        
        doc_lines = []
        for param_name, param_info in parameters.items():
            param_type = param_info.get("type", "any")
            param_desc = param_info.get("description", "")
            required = param_info.get("required", False)
            
            required_text = " (必填)" if required else " (選填)"
            doc_lines.append(f"- {param_name} ({param_type}){required_text}: {param_desc}")
        
        return "\n        ".join(doc_lines)
    
    def get_qwen_agent_tools(self) -> List[Callable]:
        """獲取 Qwen-Agent 可用的工具函數列表"""
        if not self.tools_cache:
            self.discover_tools()
        
        tool_functions = []
        
        for module, tools in self.tools_cache.items():
            for tool_info in tools:
                try:
                    tool_function = self.generate_tool_function(module, tool_info)
                    tool_functions.append(tool_function)
                    
                    # 快取函數
                    function_name = f"{module}_{tool_info.get('name')}"
                    self.tool_functions[function_name] = tool_function
                    
                except Exception as e:
                    logger.error(f"❌ 生成工具函數失敗 {module}.{tool_info.get('name')}: {e}")
        
        logger.info(f"✅ 動態生成了 {len(tool_functions)} 個工具函數")
        return tool_functions
    
    def get_tools_description(self) -> str:
        """獲取工具描述，用於 system prompt"""
        if not self.tools_cache:
            self.discover_tools()
        
        descriptions = []
        for module, tools in self.tools_cache.items():
            descriptions.append(f"\n**{module.upper()} 工具**:")
            for tool in tools:
                name = tool.get("name", "unknown")
                desc = tool.get("description", "無描述")
                descriptions.append(f"- {name}: {desc}")
        
        return "\n".join(descriptions)
    
    def refresh_tools(self):
        """刷新工具快取"""
        logger.info("🔄 刷新工具快取...")
        self.tools_cache.clear()
        self.tool_functions.clear()
        self.discover_tools()

# 全局動態工具管理器實例
dynamic_tool_manager = DynamicMCPToolManager()

def get_dynamic_qwen_tools() -> List[Callable]:
    """獲取動態發現的 Qwen-Agent 工具"""
    return dynamic_tool_manager.get_qwen_agent_tools()

def get_dynamic_tools_description() -> str:
    """獲取動態工具描述"""
    return dynamic_tool_manager.get_tools_description()

def refresh_dynamic_tools():
    """刷新動態工具"""
    dynamic_tool_manager.refresh_tools()

# 使用示例
if __name__ == "__main__":
    # 測試動態工具發現
    print("🔍 開始動態工具發現...")
    
    tools = get_dynamic_qwen_tools()
    print(f"✅ 發現 {len(tools)} 個工具")
    
    print("\n📋 工具描述:")
    print(get_dynamic_tools_description())
    
    # 測試工具調用
    if tools:
        print(f"\n🧪 測試第一個工具: {tools[0].__name__}")
        try:
            # 這裡可以測試工具調用
            print(f"工具文檔: {tools[0].__doc__}")
        except Exception as e:
            print(f"測試失敗: {e}") 