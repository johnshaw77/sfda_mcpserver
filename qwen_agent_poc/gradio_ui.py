"""
SFDA Nexus × 強化版反AI幻覺保護系統 - Gradio 測試界面
防止AI編造員工資料，確保數據真實性
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
    from config import GRADIO_CONFIG, TEST_CASES, AGENT_CONFIG
    from mcp_tools import test_mcp_connection, get_tools_status, get_employee_info
    from tool_result_enforcer import tool_result_enforcer
    print("✅ 成功導入強化版模組")
except ImportError as e:
    print(f"❌ 模組導入失敗: {e}")
    print("請確認所有依賴套件已正確安裝")

class GradioQwenAgentUI:
    """強化版 Gradio UI 管理類"""
    
    def __init__(self):
        """初始化 UI"""
        self.agent = None
        self.conversation_history = []
        self.agent_status = "強化版已就緒 (無需 BasicAgent)"
        self.tools_status = {}
        self.anti_hallucination_stats = {
            "total_queries": 0,
            "hallucination_detected": 0,
            "real_data_returned": 0
        }
        self.init_enhanced_system()
    
    def init_enhanced_system(self):
        """初始化強化版系統"""
        try:
            self.agent_status = "初始化強化版系統中..."
            # 不再使用 SFDAQwenAgent，直接使用工具
            self.agent_status = "強化版反AI幻覺系統已就緒"
            logger.info("✅ 強化版系統初始化成功")
            
            # 更新工具狀態
            self.update_tools_status()
            
        except Exception as e:
            self.agent_status = f"初始化失敗: {str(e)}"
            logger.error(f"❌ 強化版系統初始化失敗: {e}")
    
    def update_tools_status(self):
        """更新工具狀態"""
        try:
            # 使用 MCP 客戶端的方法
            if hasattr(self.agent, 'mcp_client'):
                self.tools_status = self.agent.mcp_client.get_tools_status()
            else:
                self.tools_status = get_tools_status()
        except Exception as e:
            logger.error(f"更新工具狀態失敗: {e}")
            self.tools_status = {"error": str(e)}
    
    def chat_with_agent(self, message: str, history: List[Tuple[str, str]]) -> Tuple[str, List[Tuple[str, str]]]:
        """強化版對話處理 - 直接使用工具，無需 BasicAgent"""
        if not message.strip():
            return "", history
        
        try:
            # 更新統計
            self.anti_hallucination_stats["total_queries"] += 1
            
            # 顯示處理中狀態
            processing_msg = "🛡️ 強化版反AI幻覺保護系統處理中..."
            history.append((message, processing_msg))
            
            start_time = time.time()
            
            # 檢查員工查詢
            import re
            employee_match = re.search(r'A\d{6}', message)
            
            if employee_match:
                employee_id = employee_match.group(0)
                response = self._handle_employee_query_enhanced(employee_id, message)
            else:
                response = self._handle_general_query(message)
            
            end_time = time.time()
            
            # 執行反幻覺檢測
            validation_result = tool_result_enforcer.validate_response(
                response, 
                {"employee_id": employee_match.group(0) if employee_match else ""}
            )
            
            if not validation_result["is_valid"]:
                self.anti_hallucination_stats["hallucination_detected"] += 1
                response = validation_result["corrected_response"]
                response += "\n\n🚨 **系統警告**: 原始回應包含可疑內容，已自動修正"
            else:
                response += "\n\n✅ **安全檢查**: 已驗證，無編造內容"
            
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
                "execution_time": end_time - start_time,
                "validation_result": validation_result,
                "employee_id": employee_match.group(0) if employee_match else None
            })
            
            logger.info(f"強化版對話完成，執行時間: {end_time - start_time:.2f} 秒")
            
        except Exception as e:
            error_msg = f"❌ 處理對話時發生錯誤: {str(e)}"
            history[-1] = (message, error_msg)
            logger.error(f"對話處理錯誤: {e}")
        
        return "", history
    
    def _handle_employee_query_enhanced(self, employee_id: str, message: str) -> str:
        """處理員工查詢 - 強化版"""
        try:
            logger.info(f"處理員工查詢: {employee_id}")
            
            # 調用真實工具
            tool_result = get_employee_info(employee_id, True)
            
            # 註冊工具結果
            call_id = tool_result_enforcer.register_tool_result(
                "get_employee_info",
                {"employeeId": employee_id, "includeDetails": True},
                tool_result
            )
            
            # 解析工具結果
            if isinstance(tool_result, str):
                tool_data = json.loads(tool_result)
            else:
                tool_data = tool_result
            
            if (tool_data.get("success") and 
                "result" in tool_data and 
                tool_data["result"].get("success") and
                "data" in tool_data["result"]["result"]):
                
                # 成功獲取員工資料
                self.anti_hallucination_stats["real_data_returned"] += 1
                
                employee_data = tool_data["result"]["result"]["data"]
                basic_info = employee_data.get("basic", {})
                department_info = employee_data.get("department", {})
                position_info = employee_data.get("position", {})
                contact_info = employee_data.get("contact", {})
                
                response = f"""✅ **員工資料查詢成功** (強化版反AI幻覺保護)

👤 **基本資料**
• 員工編號：`{basic_info.get('employeeId', 'N/A')}`
• 姓名：**{basic_info.get('name', 'N/A')}**
• 英文姓名：{basic_info.get('englishName', 'N/A')}
• 性別：{basic_info.get('gender', 'N/A')}
• 生日：{basic_info.get('birthDate', 'N/A')}
• 入職日期：{basic_info.get('hireDate', 'N/A')}

🏢 **部門資訊**
• 部門：**{department_info.get('departmentName', 'N/A')}**
• 部門代碼：{department_info.get('departmentCode', 'N/A')}
• 主管：{department_info.get('manager', 'N/A')}
• 辦公地點：{department_info.get('location', 'N/A')}

💼 **職位資訊**
• 職位：**{position_info.get('jobTitle', 'N/A')}**
• 職等：{position_info.get('jobLevel', 'N/A')}
• 職類：{position_info.get('jobFamily', 'N/A')}
• 直屬主管：{position_info.get('reportingManager', 'N/A')}

📞 **聯絡資訊**
• 電子郵件：{contact_info.get('email', 'N/A')}
• 電話：{contact_info.get('phone', 'N/A')}

🛡️ **安全保證**：此資料來自實際 MCP 工具調用，非AI編造
🔧 **工具執行ID**：`{call_id}`"""
                
                return response
            else:
                # 員工不存在或查詢失敗
                return f"""❌ **員工查詢失敗**

查詢的員工編號：`{employee_id}`

**可能原因：**
• 員工編號不存在
• 員工編號格式錯誤
• 系統暫時無法查詢

**測試用員工編號：**
• `A123456`：張小明 (資訊技術部)
• `A123457`：李小華 (人力資源部)

🛡️ **重要**: 系統不會編造不存在的員工資料"""
            
        except Exception as e:
            logger.error(f"員工查詢處理錯誤: {e}")
            return f"❌ **查詢處理錯誤**\n\n錯誤詳情：{str(e)}"
    
    def _handle_general_query(self, message: str) -> str:
        """處理一般查詢"""
        return f"""💡 **一般查詢處理**

收到查詢：{message}

**強化版系統功能：**
• 🛡️ 反AI幻覺員工資料保護
• 🔍 編造內容自動檢測  
• ⚙️ 工具結果強制執行
• 📊 實時安全統計

**支援的查詢類型：**
• 員工資料查詢（格式：請查詢員工編號 A123456）

**測試範例：**
• 請查詢員工編號 A123456 的基本資料
• 請查詢員工編號 A123457 的基本資料
• 請查詢員工編號 A999999 的基本資料（不存在）"""
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
            elif "connection_status" in self.tools_status:
                # 新格式 - 來自 get_tools_status()
                status_info += f"- **連接狀態**: {self.tools_status['connection_status']}\n"
                if self.tools_status.get("error_message"):
                    status_info += f"- **錯誤訊息**: {self.tools_status['error_message']}\n"
                else:
                    tools_count = self.tools_status.get("tools_count", 0)
                    tools_list = self.tools_status.get("tools_list", [])
                    status_info += f"\n### 可用工具\n- **工具總數**: {tools_count} 個\n"
                    for tool_name in tools_list:
                        status_info += f"  - {tool_name}\n"
            else:
                # 舊格式 - 保持相容性
                status_info += "- **連接狀態**: ✅ 正常\n\n### 可用工具\n"
                for category, tools in self.tools_status.items():
                    if isinstance(tools, list):
                        status_info += f"- **{category}**: {len(tools)} 個工具\n"
                        for tool in tools:
                            if isinstance(tool, dict):
                                status_info += f"  - {tool.get('name', 'N/A')}: {tool.get('description', 'N/A')}\n"
                            else:
                                status_info += f"  - {tool}\n"
        
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