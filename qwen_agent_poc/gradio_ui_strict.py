"""
SFDA Nexus × Qwen-Agent Gradio 測試界面 (嚴格模式)
專門解決 AI 編造資料問題的版本
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
    from config_strict import GRADIO_CONFIG, TEST_CASES, AGENT_CONFIG
    from mcp_tools import test_mcp_connection, get_tools_status
    print("✅ 成功導入 Qwen-Agent 相關模組 (嚴格模式)")
except ImportError as e:
    print(f"❌ 模組導入失敗: {e}")
    print("請確認所有依賴套件已正確安裝")

class StrictGradioQwenAgentUI:
    """嚴格模式 Gradio UI 管理類"""
    
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
            
            # 使用嚴格配置
            import config_strict
            import qwen_agent_demo
            qwen_agent_demo.AGENT_CONFIG = config_strict.AGENT_CONFIG
            qwen_agent_demo.QWEN_MODEL_CONFIG = config_strict.QWEN_MODEL_CONFIG
            
            self.agent = SFDAQwenAgent()
            self.agent_status = "就緒 (嚴格模式)"
            logger.info("✅ Qwen Agent 嚴格模式初始化成功")
            
            # 更新工具狀態
            self.update_tools_status()
            
        except Exception as e:
            self.agent_status = f"初始化失敗: {str(e)}"
            logger.error(f"❌ Qwen Agent 初始化失敗: {e}")
    
    def update_tools_status(self):
        """更新工具狀態"""
        try:
            if hasattr(self.agent, 'mcp_client'):
                self.tools_status = self.agent.mcp_client.get_tools_status()
            else:
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
            # 特別處理員工查詢
            if "員工編號" in message or "A123" in message:
                logger.warning(f"🔍 員工查詢請求: {message}")
                # 添加額外的提醒訊息
                processing_msg = "🤔 正在調用 HR 工具查詢員工資料，請稍候...\n\n⚠️ 注意：系統只會顯示工具返回的真實結果"
            else:
                processing_msg = "🤔 正在思考並調用相關工具..."
            
            history.append((message, processing_msg))
            
            # 呼叫 Agent 處理
            start_time = time.time()
            response = self.agent.chat(message)
            end_time = time.time()
            
            # 檢查回應內容
            if "員工編號" in message:
                logger.info(f"📊 員工查詢回應: {response[:200]}...")
                
                # 檢查是否包含可疑的編造內容
                suspicious_names = ["陳志強", "陳志", "招聘經理", "HR001"]
                for suspicious in suspicious_names:
                    if suspicious in response:
                        logger.error(f"🚨 偵測到可疑的編造內容: {suspicious}")
                        response = f"🚨 系統錯誤：偵測到 AI 可能編造了資料。\n\n原始回應：{response}\n\n⚠️ 請重新查詢或聯絡技術支援。"
                        break
            
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
    
    def get_system_status(self) -> str:
        """取得系統狀態"""
        status_info = f"""
## 🤖 SFDA Qwen-Agent 系統狀態 (嚴格模式)

### Agent 狀態
- **狀態**: {self.agent_status}
- **模式**: 嚴格防編造模式
- **對話記錄**: {len(self.conversation_history)} 筆

### MCP Server 連接狀態
"""
        
        if self.tools_status:
            if "error" in self.tools_status:
                status_info += f"- **連接狀態**: ❌ 錯誤\n- **錯誤訊息**: {self.tools_status['error']}\n"
            elif "connection_status" in self.tools_status:
                status_info += f"- **連接狀態**: {self.tools_status['connection_status']}\n"
                if self.tools_status.get("error_message"):
                    status_info += f"- **錯誤訊息**: {self.tools_status['error_message']}\n"
                else:
                    tools_count = self.tools_status.get("tools_count", 0)
                    tools_list = self.tools_status.get("tools_list", [])
                    status_info += f"\n### 可用工具\n- **工具總數**: {tools_count} 個\n"
                    for tool_name in tools_list:
                        status_info += f"  - {tool_name}\n"
        
        status_info += f"""
### 已知正確員工資料
- **A123456**: 張小明 (資訊技術部)
- **A123457**: 李小華 (人力資源部)

### 測試說明
- 查詢存在員工應返回真實資料
- 查詢不存在員工應返回錯誤訊息
- 系統不應編造任何虛假資料

### 系統資訊
- **更新時間**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        return status_info

def create_strict_gradio_interface():
    """建立嚴格模式 Gradio 介面"""
    ui = StrictGradioQwenAgentUI()
    
    with gr.Blocks(
        title=GRADIO_CONFIG["title"],
        theme=GRADIO_CONFIG["theme"]
    ) as demo:
        
        gr.Markdown(f"""
        # {GRADIO_CONFIG["title"]}
        
        {GRADIO_CONFIG["description"]}
        
        🚨 **嚴格模式說明**：此版本專門防止 AI 編造資料，所有回應都基於工具的真實執行結果。
        
        ---
        """)
        
        with gr.Tab("💬 智能對話 (嚴格模式)"):
            with gr.Row():
                with gr.Column(scale=2):
                    chatbot = gr.Chatbot(
                        label="與 SFDA 智能助理對話 (嚴格模式)",
                        height=400
                    )
                    
                    with gr.Row():
                        msg_input = gr.Textbox(
                            placeholder="請輸入您的問題...",
                            label="訊息輸入",
                            lines=2,
                            scale=4
                        )
                        send_btn = gr.Button("🚀 發送", scale=1, variant="primary")
                
                with gr.Column(scale=1):
                    gr.Markdown("### 🧪 測試案例")
                    
                    test_btn_1 = gr.Button("測試存在員工 A123456", variant="secondary")
                    test_btn_2 = gr.Button("測試不存在員工 A999999", variant="secondary") 
                    test_btn_3 = gr.Button("測試格式錯誤 12345", variant="secondary")
                    
                    gr.Markdown("""
                    ### 📋 已知正確資料
                    - **A123456**: 張小明 (資訊技術部)
                    - **A123457**: 李小華 (人力資源部)
                    
                    ### ⚠️ 注意事項
                    - 系統只會顯示工具返回的真實結果
                    - 不會編造任何虛假員工資料
                    - 如果查詢失敗會顯示實際錯誤訊息
                    """)
        
        with gr.Tab("📊 系統狀態"):
            status_display = gr.Markdown(ui.get_system_status())
            refresh_btn = gr.Button("🔄 更新狀態")
        
        # 事件綁定
        def send_message(message, history):
            return ui.chat_with_agent(message, history)
        
        def test_existing_employee(history):
            return ui.chat_with_agent("請查詢員工編號 A123456 的資訊", history)
        
        def test_nonexistent_employee(history):
            return ui.chat_with_agent("請查詢員工編號 A999999 的資訊", history)
        
        def test_invalid_format(history):
            return ui.chat_with_agent("請查詢員工編號 12345 的資訊", history)
        
        msg_input.submit(send_message, inputs=[msg_input, chatbot], outputs=[msg_input, chatbot])
        send_btn.click(send_message, inputs=[msg_input, chatbot], outputs=[msg_input, chatbot])
        
        test_btn_1.click(test_existing_employee, inputs=[chatbot], outputs=[msg_input, chatbot])
        test_btn_2.click(test_nonexistent_employee, inputs=[chatbot], outputs=[msg_input, chatbot])
        test_btn_3.click(test_invalid_format, inputs=[chatbot], outputs=[msg_input, chatbot])
        
        refresh_btn.click(lambda: ui.get_system_status(), outputs=[status_display])
    
    return demo

def main():
    """主程式入口"""
    print("🚀 正在啟動 SFDA Nexus × Qwen-Agent Gradio UI (嚴格模式)...")
    
    # 檢查 MCP Server 連接
    if not test_mcp_connection():
        print("⚠️ 警告: MCP Server 連接失敗，某些功能可能無法正常運作")
    
    # 建立並啟動 Gradio 介面
    demo = create_strict_gradio_interface()
    
    print(f"✅ Gradio UI 已啟動 (嚴格模式)")
    print(f"🌐 存取網址: http://localhost:{GRADIO_CONFIG['port'] + 1}")  # 使用不同端口避免衝突
    print("🔄 按 Ctrl+C 停止服務")
    
    demo.launch(
        server_name=GRADIO_CONFIG["server_name"],
        server_port=GRADIO_CONFIG["port"] + 1,  # 使用 7861 端口
        share=GRADIO_CONFIG["share"],
        show_error=True,
        quiet=False
    )

if __name__ == "__main__":
    main()
