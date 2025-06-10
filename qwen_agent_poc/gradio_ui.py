"""
SFDA Nexus × Qwen-Agent Gradio 測試界面
提供使用者友善的網頁介面來測試 Qwen-Agent 整合功能
"""

import gradio as gr
import json
import logging
import threading
import time
from datetime import datetime
from typing import List, Tuple, Dict, Any
from pathlib import Path

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from qwen_agent_demo import SFDAQwenAgent
    from config import GRADIO_CONFIG, TEST_CASES, AGENT_CONFIG
    from mcp_tools import test_mcp_connection, get_tools_status
    print("✅ 成功導入 Qwen-Agent 相關模組")
except ImportError as e:
    print(f"❌ 模組導入失敗: {e}")
    print("請確認所有依賴套件已正確安裝")

class GradioQwenAgentUI:
    """Gradio UI 管理類"""
    
    def __init__(self):
        """初始化 UI"""
        self.agent = None
        self.conversation_history = []
        self.agent_status = "未初始化"
        self.tools_status = {}
        self.init_agent()
    
    def init_agent(self):
        """初始化 Qwen Agent"""
        try:
            self.agent_status = "初始化中..."
            self.agent = SFDAQwenAgent()
            self.agent_status = "就緒"
            logger.info("✅ Qwen Agent 初始化成功")
            
            # 更新工具狀態
            self.update_tools_status()
            
        except Exception as e:
            self.agent_status = f"初始化失敗: {str(e)}"
            logger.error(f"❌ Qwen Agent 初始化失敗: {e}")
    
    def update_tools_status(self):
        """更新工具狀態"""
        try:
            self.tools_status = get_tools_status()
        except Exception as e:
            logger.error(f"更新工具狀態失敗: {e}")
            self.tools_status = {"error": str(e)}
    
    def chat_with_agent(self, message: str, history: List[Tuple[str, str]]) -> Tuple[str, List[Tuple[str, str]]]:
        """與 Agent 對話"""
        if not self.agent:
            error_msg = "❌ Agent 未初始化，請重新啟動應用程式"
            history.append((message, error_msg))
            return "", history
        
        if not message.strip():
            return "", history
        
        try:
            # 顯示處理中狀態
            processing_msg = "🤔 正在思考並調用相關工具..."
            history.append((message, processing_msg))
            
            # 呼叫 Agent 處理
            start_time = time.time()
            response = self.agent.chat(message)
            end_time = time.time()
            
            # 添加執行時間資訊
            execution_time = f"\n\n⏱️ 執行時間: {end_time - start_time:.2f} 秒"
            response_with_time = response + execution_time
            
            # 更新歷史記錄
            history[-1] = (message, response_with_time)
            
            # 記錄對話
            self.conversation_history.append({
                "timestamp": datetime.now().isoformat(),
                "user_message": message,
                "agent_response": response,
                "execution_time": end_time - start_time
            })
            
            logger.info(f"對話完成，執行時間: {end_time - start_time:.2f} 秒")
            
        except Exception as e:
            error_msg = f"❌ 處理對話時發生錯誤: {str(e)}"
            history[-1] = (message, error_msg)
            logger.error(f"對話處理錯誤: {e}")
        
        return "", history
    
    def run_test_case(self, test_case_name: str) -> Tuple[str, List[Tuple[str, str]]]:
        """執行預設測試案例"""
        # 尋找測試案例
        test_case = None
        for case in TEST_CASES:
            if case["name"] == test_case_name:
                test_case = case
                break
        
        if not test_case:
            return f"❌ 找不到測試案例: {test_case_name}", []
        
        # 執行測試案例
        message = test_case["prompt"]
        history = []
        
        try:
            start_time = time.time()
            response = self.agent.chat(message)
            end_time = time.time()
            
            execution_time = f"\n\n⏱️ 執行時間: {end_time - start_time:.2f} 秒"
            response_with_time = response + execution_time
            
            history.append((f"📋 {test_case['name']}: {message}", response_with_time))
            
            result_msg = f"✅ 測試案例 '{test_case_name}' 執行完成"
            
        except Exception as e:
            error_msg = f"❌ 執行測試案例時發生錯誤: {str(e)}"
            history.append((f"📋 {test_case['name']}: {message}", error_msg))
            result_msg = f"❌ 測試案例 '{test_case_name}' 執行失敗"
        
        return result_msg, history
    
    def get_system_status(self) -> str:
        """取得系統狀態"""
        status_info = f"""
## 🤖 SFDA Qwen-Agent 系統狀態

### Agent 狀態
- **狀態**: {self.agent_status}
- **模型**: {AGENT_CONFIG.get('description', 'N/A')}
- **對話記錄**: {len(self.conversation_history)} 筆

### MCP Server 連接狀態
"""
        
        if self.tools_status:
            if "error" in self.tools_status:
                status_info += f"- **連接狀態**: ❌ 錯誤\n- **錯誤訊息**: {self.tools_status['error']}\n"
            else:
                status_info += "- **連接狀態**: ✅ 正常\n\n### 可用工具\n"
                for category, tools in self.tools_status.items():
                    if isinstance(tools, list):
                        status_info += f"- **{category}**: {len(tools)} 個工具\n"
                        for tool in tools:
                            status_info += f"  - {tool.get('name', 'N/A')}: {tool.get('description', 'N/A')}\n"
        
        status_info += f"\n### 系統資訊\n- **更新時間**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        
        return status_info
    
    def export_conversation_history(self) -> str:
        """匯出對話歷史"""
        if not self.conversation_history:
            return "目前沒有對話記錄"
        
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"qwen_agent_conversation_{timestamp}.json"
            filepath = Path(filename)
            
            export_data = {
                "export_time": datetime.now().isoformat(),
                "agent_config": AGENT_CONFIG,
                "total_conversations": len(self.conversation_history),
                "conversations": self.conversation_history
            }
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, ensure_ascii=False, indent=2)
            
            return f"✅ 對話歷史已匯出至: {filename}"
            
        except Exception as e:
            return f"❌ 匯出失敗: {str(e)}"
    
    def clear_conversation_history(self) -> Tuple[str, List[Tuple[str, str]]]:
        """清除對話歷史"""
        self.conversation_history.clear()
        if self.agent:
            self.agent.conversation_history.clear()
        return "✅ 對話歷史已清除", []
    
    def restart_agent(self) -> str:
        """重新啟動 Agent"""
        try:
            self.agent = None
            self.conversation_history.clear()
            self.init_agent()
            return f"✅ Agent 重新啟動完成，狀態: {self.agent_status}"
        except Exception as e:
            return f"❌ Agent 重新啟動失敗: {str(e)}"

def create_gradio_interface():
    """建立 Gradio 介面"""
    ui = GradioQwenAgentUI()
    
    # 自定義 CSS
    custom_css = """
    .container {
        max-width: 1200px;
        margin: auto;
    }
    .chat-container {
        height: 500px;
    }
    .status-container {
        background-color: #f8f9fa;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
    }
    .test-case-container {
        background-color: #e3f2fd;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
    }
    """
    
    with gr.Blocks(
        title=GRADIO_CONFIG["title"],
        theme=GRADIO_CONFIG["theme"],
        css=custom_css
    ) as demo:
        
        gr.Markdown(f"""
        # {GRADIO_CONFIG["title"]}
        
        {GRADIO_CONFIG["description"]}
        
        ---
        """)
        
        with gr.Tab("💬 智能對話"):
            with gr.Row():
                with gr.Column(scale=2):
                    chatbot = gr.Chatbot(
                        label="與 SFDA 智能助理對話",
                        height=400,
                        container=True,
                        elem_classes=["chat-container"]
                    )
                    
                    with gr.Row():
                        msg_input = gr.Textbox(
                            placeholder="請輸入您的問題或需求...",
                            label="訊息輸入",
                            lines=2,
                            scale=4
                        )
                        send_btn = gr.Button("🚀 發送", scale=1, variant="primary")
                    
                    with gr.Row():
                        clear_btn = gr.Button("🗑️ 清除對話", scale=1)
                        export_btn = gr.Button("📥 匯出記錄", scale=1)
                
                with gr.Column(scale=1):
                    gr.Markdown("### 🎯 快速測試案例")
                    
                    test_case_dropdown = gr.Dropdown(
                        choices=[case["name"] for case in TEST_CASES],
                        label="選擇測試案例",
                        value=TEST_CASES[0]["name"] if TEST_CASES else None
                    )
                    
                    run_test_btn = gr.Button("▶️ 執行測試案例", variant="secondary")
                    test_result = gr.Textbox(label="測試結果", lines=3)
                    
                    gr.Markdown("### 📝 測試案例說明")
                    test_case_info = gr.Markdown()
                    
                    # 動態更新測試案例說明
                    def update_test_case_info(case_name):
                        for case in TEST_CASES:
                            if case["name"] == case_name:
                                return f"""
                                **{case['name']}**
                                
                                📝 {case['description']}
                                
                                💬 範例提示: "{case['prompt']}"
                                
                                🔧 預期工具: {', '.join(case.get('expected_tools', []))}
                                """
                        return "請選擇測試案例"
                    
                    test_case_dropdown.change(
                        update_test_case_info,
                        inputs=[test_case_dropdown],
                        outputs=[test_case_info]
                    )
        
        with gr.Tab("📊 系統狀態"):
            with gr.Row():
                with gr.Column():
                    status_display = gr.Markdown(
                        ui.get_system_status(),
                        elem_classes=["status-container"]
                    )
                    
                    with gr.Row():
                        refresh_status_btn = gr.Button("🔄 更新狀態", scale=1)
                        restart_agent_btn = gr.Button("🔄 重啟 Agent", scale=1, variant="stop")
                    
                    restart_result = gr.Textbox(label="重啟結果", lines=2)
        
        with gr.Tab("📋 使用說明"):
            gr.Markdown("""
            ## 📖 使用指南
            
            ### 🚀 快速開始
            1. 在「智能對話」頁面輸入您的問題
            2. 或選擇右側的「快速測試案例」
            3. 查看 AI 助理如何智能地調用工具並提供回應
            
            ### 💡 功能特色
            - **🧠 智能工具選擇**: AI 會自動選擇最適合的工具組合
            - **🔧 多工具協作**: 能夠同時使用 HR、Task、Finance 等工具
            - **💬 繁體中文支援**: 完全支援繁體中文對話
            - **📊 過程透明**: 顯示工具調用過程和思考邏輯
            
            ### 🎯 測試案例說明
            
            #### 單工具測試
            - **HR 工具**: 測試員工資料查詢功能
            - **Task 工具**: 測試任務建立和管理功能
            - **Finance 工具**: 測試預算和財務查詢功能
            
            #### 多工具協作測試
            - **HR + Task**: 查詢員工資料並建立相關任務
            - **Finance + Task**: 查詢預算狀況並規劃相關任務
            - **跨部門協作**: 綜合使用多種工具完成複雜任務
            
            ### ⚡ 系統要求
            - MCP Server 必須正在運行 (localhost:8080)
            - Ollama qwen3:30b 模型必須可用 (localhost:11434)
            - 所有相關 Python 依賴已安裝
            
            ### 🔧 故障排除
            - 如果 Agent 無回應，請檢查「系統狀態」頁面
            - 如果工具調用失敗，請確認 MCP Server 運行狀態
            - 可以使用「重啟 Agent」功能重新初始化系統
            
            ### 📞 技術支援
            如有問題，請查看控制台日誌或聯繫技術團隊。
            """)
        
        # 事件綁定
        msg_input.submit(
            ui.chat_with_agent,
            inputs=[msg_input, chatbot],
            outputs=[msg_input, chatbot]
        )
        
        send_btn.click(
            ui.chat_with_agent,
            inputs=[msg_input, chatbot],
            outputs=[msg_input, chatbot]
        )
        
        clear_btn.click(
            ui.clear_conversation_history,
            outputs=[test_result, chatbot]
        )
        
        export_btn.click(
            ui.export_conversation_history,
            outputs=[test_result]
        )
        
        run_test_btn.click(
            ui.run_test_case,
            inputs=[test_case_dropdown],
            outputs=[test_result, chatbot]
        )
        
        refresh_status_btn.click(
            lambda: ui.get_system_status(),
            outputs=[status_display]
        )
        
        restart_agent_btn.click(
            ui.restart_agent,
            outputs=[restart_result]
        )
        
        # 初始化測試案例說明
        if TEST_CASES:
            test_case_info.value = f"""
            **{TEST_CASES[0]['name']}**
            
            📝 {TEST_CASES[0]['description']}
            
            💬 範例提示: "{TEST_CASES[0]['prompt']}"
            
            🔧 預期工具: {', '.join(TEST_CASES[0].get('expected_tools', []))}
            """
    
    return demo

def main():
    """主程式入口"""
    print("🚀 正在啟動 SFDA Nexus × Qwen-Agent Gradio UI...")
    
    # 檢查 MCP Server 連接
    if not test_mcp_connection():
        print("⚠️ 警告: MCP Server 連接失敗，某些功能可能無法正常運作")
    
    # 建立並啟動 Gradio 介面
    demo = create_gradio_interface()
    
    print(f"✅ Gradio UI 已啟動")
    print(f"🌐 存取網址: http://localhost:{GRADIO_CONFIG['port']}")
    print(f"📱 如需外部存取，請設定 share=True")
    print("🔄 按 Ctrl+C 停止服務")
    
    demo.launch(
        server_name=GRADIO_CONFIG["server_name"],
        server_port=GRADIO_CONFIG["port"],
        share=GRADIO_CONFIG["share"],
        show_error=True,
        quiet=False
    )

if __name__ == "__main__":
    main() 