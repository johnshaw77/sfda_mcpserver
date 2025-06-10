"""
Qwen-Agent PoC 配置文件
配置 MCP Server 連接、模型參數和 Agent 行為設定
"""
import os
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# MCP Server 配置
MCP_SERVER_CONFIG = {
    "base_url": os.getenv("MCP_SERVER_URL", "http://localhost:8080"),
    "timeout": 30,
    "retry_attempts": 3,
    "retry_delay": 1.0,
}

# Qwen 模型配置
QWEN_MODEL_CONFIG = {
    # 使用本地 Ollama 模型（用戶已安裝）
    "model": "qwen3:30b",  # 使用用戶現有的 qwen3:30b 模型
    "api_base": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") + "/v1",  # Ollama 端點
    "api_key": "ollama",  # Ollama 不需要真實 API key
    
    # 或者使用其他可用模型
    # "model": "qwen2.5vl:32b",  # 多模態模型
    # "model": "deepseek-r1:32b",  # DeepSeek R1 模型
    
    # 或者使用 DashScope API（阿里雲）
    # "model": "qwen-max",
    # "api_key": os.getenv("DASHSCOPE_API_KEY"),
    
    # 模型參數
    "temperature": 0.7,
    "max_tokens": 4000,  # 增加 token 限制以支持更長的回應
    "top_p": 0.8,
    # 移除 stream 參數，由 Agent 內部管理
}

# Agent 人格和行為設定
AGENT_CONFIG = {
    "name": os.getenv("AGENT_NAME", "SFDA 智能助理"),
    "description": os.getenv("AGENT_DESCRIPTION", "專業的企業助理，擅長處理人力資源、任務管理和財務查詢"),
    "instructions": """
你是一個專業的企業智能助理，具備以下特點：

🎯 **核心能力**：
- 人力資源管理：員工資料查詢、部門管理、出勤記錄
- 任務管理：任務建立、進度追蹤、工作流程優化
- 財務分析：預算查詢、支出分析、成本控制

🗣️ **對話風格**：
- 使用繁體中文回應
- 語氣專業但親切
- 回答準確且有條理
- 主動提供相關建議

🔧 **工具使用原則**：
1. 優先使用最相關的工具
2. 必要時組合多個工具
3. 清楚說明執行的步驟
4. 提供數據解釋和建議

💡 **服務準則**：
- 保護敏感資訊
- 提供可行的解決方案
- 主動識別潛在問題
- 持續優化工作流程
""",
    "tools_preference": {
        "hr": "優先用於員工相關查詢",
        "tasks": "用於任務和專案管理",
        "finance": "用於預算和財務分析"
    }
}

# 測試案例配置
TEST_CASES = [
    {
        "name": "單工具測試-HR",
        "description": "測試 HR 工具的基本功能",
        "prompt": "請查詢員工編號 A123456 的基本資訊",
        "expected_tools": ["get_employee_info"]
    },
    {
        "name": "單工具測試-Task",
        "description": "測試 Task 工具的基本功能", 
        "prompt": "請建立一個新任務：準備下週的部門會議，指派給 user123，截止日期是下週五",
        "expected_tools": ["create_task"]
    },
    {
        "name": "單工具測試-Finance",
        "description": "測試 Finance 工具的基本功能",
        "prompt": "請查詢技術部門 2025 年的預算使用狀況",
        "expected_tools": ["get_budget_status"]
    },
    {
        "name": "多工具協作測試-1",
        "description": "查詢員工資訊並建立相關任務",
        "prompt": "請查詢李四的假期記錄，然後安排下週的績效評估會議",
        "expected_tools": ["get_attendance_record", "create_task"]
    },
    {
        "name": "多工具協作測試-2", 
        "description": "財務查詢與任務規劃",
        "prompt": "檢視本月的支出情況，並建立下月預算規劃任務",
        "expected_tools": ["get_budget_status", "create_task"]
    },
    {
        "name": "複雜協作測試",
        "description": "跨部門資源規劃",
        "prompt": "查詢人力資源部的人員清單，安排團隊建設活動，並估算所需預算",
        "expected_tools": ["get_department_list", "create_task", "get_budget_status"]
    }
]

# Gradio UI 配置
GRADIO_CONFIG = {
    "title": "🤖 SFDA Nexus × Qwen-Agent PoC 測試平台",
    "description": """
    這是 Qwen-Agent 與 SFDA MCP Server 整合的概念驗證平台。
    
    **可用工具**：
    - 🏢 HR 工具：員工查詢、部門管理、出勤記錄
    - 📋 Task 工具：任務建立、進度管理
    - 💰 Finance 工具：預算查詢、財務分析
    
    **測試建議**：
    試試看讓 AI 組合使用多個工具完成複雜任務！
    """,
    "theme": "soft",
    "port": int(os.getenv("GRADIO_SERVER_PORT", "7860")),
    "share": os.getenv("GRADIO_SHARE", "false").lower() == "true",
    "server_name": os.getenv("GRADIO_SERVER_NAME", "0.0.0.0")
}

# 日誌配置
LOGGING_CONFIG = {
    "level": os.getenv("LOG_LEVEL", "INFO"),
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "qwen_agent_poc.log"
} 