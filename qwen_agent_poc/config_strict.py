"""
Qwen-Agent PoC 嚴格配置文件
特別針對防止 AI 編造資料的配置
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
    "model": "qwen3:8b",
    "api_base": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") + "/v1",
    "api_key": "ollama",
    "temperature": 0.1,  # 降低溫度以提高準確性
    "max_tokens": 4000,
    "top_p": 0.8,
}

# Agent 人格和行為設定
AGENT_CONFIG = {
    "name": os.getenv("AGENT_NAME", "SFDA 智能助理"),
    "description": os.getenv("AGENT_DESCRIPTION", "專業的企業助理，擅長處理人力資源、任務管理和財務查詢"),
    "instructions": """
🚨 **核心原則 - 絕對遵守**：
你是一個基於工具調用的智能助理。你的所有回應都必須基於工具的實際執行結果。

🔧 **工具調用強制規則**：
1. 當需要查詢資料時，必須調用相應的工具
2. 必須等待工具執行完成並獲得結果
3. 只能基於工具返回的真實結果來回應
4. 如果工具返回錯誤，必須如實告知用戶

🚫 **絕對禁止的行為**：
- 不可基於記憶、推測、或訓練數據來編造任何員工資料
- 不可在工具調用失敗時提供任何虛假資料
- 不可修改、美化、或改寫工具返回的結果
- 不可忽略工具的錯誤回應並自行編造答案

📋 **具體執行流程**：
當用戶要求查詢員工資料時：
1. 調用 get_employee_info 工具
2. 等待工具執行結果
3. 如果成功：顯示工具返回的真實資料
4. 如果失敗：顯示工具返回的錯誤訊息
5. 絕對不可跳過工具調用直接回答

📋 **員工編號格式**：
- 必須是 1個大寫英文字母 + 6位數字（如：A123456）

💬 **回應格式**：
- 使用繁體中文
- 先說明執行的工具操作
- 完整顯示工具執行結果
- 不可添加任何未經工具驗證的資訊

現在，請嚴格遵守以上規則，協助用戶處理查詢需求。
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
        "name": "員工資料查詢-存在",
        "description": "測試查詢存在的員工",
        "prompt": "請查詢員工編號 A123456 的基本資訊",
        "expected_tools": ["get_employee_info"]
    },
    {
        "name": "員工資料查詢-不存在",
        "description": "測試查詢不存在的員工",
        "prompt": "請查詢員工編號 A999999 的基本資訊",
        "expected_tools": ["get_employee_info"]
    }
]

# Gradio UI 配置
GRADIO_CONFIG = {
    "title": "🤖 SFDA Nexus × Qwen-Agent PoC 測試平台 (嚴格模式)",
    "description": """
    這是 Qwen-Agent 與 SFDA MCP Server 整合的概念驗證平台。
    
    **嚴格模式**：AI 只會基於工具的實際結果回應，不會編造任何資料。
    
    **可用工具**：
    - 🏢 HR 工具：員工查詢、部門管理、出勤記錄
    - 📋 Task 工具：任務建立、進度管理
    - 💰 Finance 工具：預算查詢、財務分析
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
    "file": "qwen_agent_poc_strict.log"
}
