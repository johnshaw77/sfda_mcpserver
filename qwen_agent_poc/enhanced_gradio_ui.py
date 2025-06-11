"""
強化版 Gradio UI - 集成反AI幻覺功能
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
    from tool_result_enforcer import tool_result_enforcer
    print("✅ 成功導入強化版模組")
except ImportError as e:
    print(f"❌ 模組導入失敗: {e}")
    print("請確認所有依賴套件已正確安裝")

class EnhancedGradioQwenAgentUI:
    """強化版 Gradio UI 管理類"""
    
    def __init__(self):
        """初始化 UI"""
        self.agent = None
        self.conversation_history = []
        self.agent_status = "未初始化"
        self.tools_status = {}
        self.hallucination_stats = {
            "total_queries": 0,
            "hallucination_detected": 0,
            "corrected_responses": 0
        }
        self.init_agent()
    
    def init_agent(self):
        """初始化 Qwen Agent"""
        try:
            self.agent_status = "初始化中..."
            # 注意：由於 qwen_agent 的 BasicAgent 有初始化問題，
            # 我們這裡先模擬初始化，實際使用直接的工具調用
            self.agent_status = "就緒 (強化版)"
            logger.info("✅ 強化版 Agent 模擬初始化成功")
            
            # 更新工具狀態
            self.update_tools_status()
            
        except Exception as e:
            self.agent_status = f"初始化失敗: {str(e)}"
            logger.error(f"❌ Agent 初始化失敗: {e}")
    
    def update_tools_status(self):
        """更新工具狀態"""
        try:
            self.tools_status = get_tools_status()
            logger.info("✅ 工具狀態更新成功")
        except Exception as e:
            logger.error(f"更新工具狀態失敗: {e}")
            self.tools_status = {"error": str(e)}
    
    def chat_with_agent_enhanced(self, message: str, history: List[Tuple[str, str]]) -> Tuple[str, List[Tuple[str, str]]]:
        """增強版對話功能 - 集成反AI幻覺檢測"""
        
        if not message.strip():
            return "", history
        
        try:
            # 更新統計
            self.hallucination_stats["total_queries"] += 1
            
            # 顯示處理中狀態
            processing_msg = "🔍 正在執行強化版查詢 (反AI幻覺保護已啟用)..."
            history.append((message, processing_msg))
            
            start_time = time.time()
            
            # 檢查是否為員工查詢
            employee_id = self._extract_employee_id(message)
            
            if employee_id:
                # 員工查詢 - 使用強化保護
                response = self._handle_employee_query_enhanced(employee_id, message)
            else:
                # 其他查詢 - 基本處理
                response = self._handle_general_query(message)
            
            end_time = time.time()
            
            # 檢查回應是否被修正
            validation_result = tool_result_enforcer.validate_response(response, {"employee_id": employee_id})
            
            if not validation_result["is_valid"]:
                self.hallucination_stats["hallucination_detected"] += 1
                self.hallucination_stats["corrected_responses"] += 1
                response = validation_result["corrected_response"]
            
            # 添加安全狀態資訊
            safety_info = self._generate_safety_info(validation_result, employee_id)
            response_with_info = response + safety_info
            
            # 添加執行時間
            execution_time = f"\n\n⏱️ 執行時間: {end_time - start_time:.2f} 秒"
            final_response = response_with_info + execution_time
            
            # 更新歷史記錄
            history[-1] = (message, final_response)
            
            # 記錄對話
            self.conversation_history.append({
                "timestamp": datetime.now().isoformat(),
                "user_message": message,
                "agent_response": response,
                "validation_result": validation_result,
                "execution_time": end_time - start_time,
                "employee_id": employee_id
            })
            
            logger.info(f"強化版對話完成，執行時間: {end_time - start_time:.2f} 秒")
            
        except Exception as e:
            error_msg = f"❌ 處理對話時發生錯誤: {str(e)}"
            history[-1] = (message, error_msg)
            logger.error(f"對話處理錯誤: {e}")
        
        return "", history
    
    def _extract_employee_id(self, message: str) -> str:
        """提取員工編號"""
        import re
        match = re.search(r'A\d{6}', message)
        return match.group(0) if match else ""
    
    def _handle_employee_query_enhanced(self, employee_id: str, message: str) -> str:
        """處理員工查詢 - 強化版"""
        try:
            from mcp_tools import get_employee_info
            
            # 直接調用工具並註冊結果
            tool_result = get_employee_info(employee_id, True)
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
                employee_data = tool_data["result"]["result"]["data"]
                basic_info = employee_data.get("basic", {})
                department_info = employee_data.get("department", {})
                position_info = employee_data.get("position", {})
                contact_info = employee_data.get("contact", {})
                
                response = f"""✅ 員工資料查詢成功

📋 **基本資料**
• 員工編號：{basic_info.get('employeeId', 'N/A')}
• 姓名：{basic_info.get('name', 'N/A')}
• 英文姓名：{basic_info.get('englishName', 'N/A')}
• 性別：{basic_info.get('gender', 'N/A')}
• 生日：{basic_info.get('birthDate', 'N/A')}
• 入職日期：{basic_info.get('hireDate', 'N/A')}

🏢 **部門資訊**
• 部門：{department_info.get('departmentName', 'N/A')}
• 部門代碼：{department_info.get('departmentCode', 'N/A')}
• 主管：{department_info.get('manager', 'N/A')}
• 辦公地點：{department_info.get('location', 'N/A')}

💼 **職位資訊**
• 職位：{position_info.get('jobTitle', 'N/A')}
• 職等：{position_info.get('jobLevel', 'N/A')}
• 職類：{position_info.get('jobFamily', 'N/A')}
• 直屬主管：{position_info.get('reportingManager', 'N/A')}

📞 **聯絡資訊**
• 電子郵件：{contact_info.get('email', 'N/A')}
• 電話：{contact_info.get('phone', 'N/A')}

🔒 **資料來源**: 實際工具查詢結果 [ID: {call_id}]"""
            
            else:
                # 查詢失敗或員工不存在
                response = f"❌ 員工編號 {employee_id} 查詢失敗\n\n可能原因：\n• 員工編號不存在\n• 格式錯誤\n• 系統暫時無法查詢\n\n✅ 已知測試員工編號：\n• A123456：張小明\n• A123457：李小華"
            
            return response
            
        except Exception as e:
            return f"❌ 查詢員工 {employee_id} 時發生錯誤: {str(e)}"
    
    def _handle_general_query(self, message: str) -> str:
        """處理一般查詢"""
        # 這裡可以擴展其他工具的調用
        return f"📝 收到查詢: {message}\n\n⚠️ 目前強化版主要支援員工資料查詢 (格式: A123456)\n\n如需查詢員工資料，請提供正確的員工編號。"
    
    def _generate_safety_info(self, validation_result: Dict, employee_id: str) -> str:
        """生成安全資訊"""
        if validation_result["is_valid"]:
            return f"\n\n🛡️ **安全檢查**: ✅ 通過 (信心度: {validation_result['confidence']:.1f})"
        else:
            fabricated_count = len(validation_result["fabricated_content"])
            return f"\n\n🚨 **安全警告**: 偵測到 {fabricated_count} 個可疑編造內容，已自動修正"
    
    def get_hallucination_stats(self) -> str:
        """獲取幻覺統計資訊"""
        stats = self.hallucination_stats
        total = stats["total_queries"]
        detected = stats["hallucination_detected"]
        corrected = stats["corrected_responses"]
        
        if total == 0:
            rate = 0
        else:
            rate = (detected / total) * 100
        
        return f"""📊 **反AI幻覺統計**

• 總查詢次數: {total}
• 偵測到編造: {detected} 次
• 自動修正: {corrected} 次
• 編造率: {rate:.1f}%
• 保護狀態: {'🟢 正常' if rate < 10 else '🟡 需關注' if rate < 30 else '🔴 異常'}"""
    
    def test_known_hallucination(self) -> Tuple[str, str]:
        """測試已知的編造案例"""
        # 模擬之前發現的編造問題
        test_msg = "請查詢員工編號 A123456 的基本資料"
        
        # 模擬編造回應
        fake_response = """員工編號 A123456 的資料：
姓名：陳志強
部門：人力資源部  
職位：招聘經理
入職日期：2020-03-15
電子郵件：chenzq@company.com"""
        
        # 檢測編造
        validation = tool_result_enforcer.validate_response(fake_response, {"employee_id": "A123456"})
        
        if validation["is_valid"]:
            result = "❌ 編造檢測失敗！系統未能識別編造內容"
        else:
            result = f"✅ 編造檢測成功！偵測到 {len(validation['fabricated_content'])} 個編造指標"
        
        return test_msg, result
    
    def create_gradio_interface(self):
        """創建 Gradio 界面"""
        with gr.Blocks(
            title="SFDA Nexus × Qwen-Agent 強化版測試界面",
            theme=gr.themes.Soft(),
            css="""
            .main-container { max-width: 1200px; margin: 0 auto; }
            .status-box { padding: 10px; border-radius: 5px; margin: 5px 0; }
            .status-ready { background-color: #d4edda; color: #155724; }
            .status-error { background-color: #f8d7da; color: #721c24; }
            .safety-info { background-color: #e7f3ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
            """
        ) as demo:
            
            gr.HTML("""
            <div style="text-align: center; padding: 20px;">
                <h1>🛡️ SFDA Nexus × Qwen-Agent 強化版</h1>
                <h2>反AI幻覺保護系統</h2>
                <p style="color: #666;">集成工具結果強制執行與編造內容檢測</p>
            </div>
            """)
            
            with gr.Row():
                # 左側：對話界面
                with gr.Column(scale=2):
                    chatbot = gr.Chatbot(
                        label="💬 強化版對話界面",
                        height=400,
                        show_label=True
                    )
                    
                    with gr.Row():
                        msg_input = gr.Textbox(
                            placeholder="請輸入您的問題 (例如：請查詢員工編號 A123456 的基本資料)",
                            label="",
                            scale=4
                        )
                        send_btn = gr.Button("發送", variant="primary", scale=1)
                    
                    gr.Examples(
                        examples=[
                            "請查詢員工編號 A123456 的基本資料",
                            "請查詢員工編號 A123457 的基本資料", 
                            "請查詢員工編號 A999999 的基本資料",
                        ],
                        inputs=msg_input,
                        label="💡 測試範例"
                    )
                
                # 右側：狀態和控制面板
                with gr.Column(scale=1):
                    # 系統狀態
                    status_display = gr.HTML(
                        value=self._get_status_html(),
                        label="系統狀態"
                    )
                    
                    # 安全統計
                    safety_stats = gr.HTML(
                        value=self.get_hallucination_stats(),
                        label="安全統計"
                    )
                    
                    # 控制按鈕
                    with gr.Group():
                        gr.HTML("<h4>🧪 測試功能</h4>")
                        
                        test_hallucination_btn = gr.Button("測試編造檢測", variant="secondary")
                        test_result = gr.Textbox(label="測試結果", interactive=False)
                        
                        refresh_status_btn = gr.Button("刷新狀態", variant="secondary")
                        clear_chat_btn = gr.Button("清空對話", variant="secondary")
            
            # 底部：詳細資訊
            with gr.Accordion("🔍 詳細資訊", open=False):
                with gr.Tabs():
                    with gr.Tab("工具狀態"):
                        tools_status_display = gr.JSON(
                            value=self.tools_status,
                            label="MCP 工具狀態"
                        )
                    
                    with gr.Tab("對話歷史"):
                        conversation_display = gr.JSON(
                            value=self.conversation_history,
                            label="對話歷史記錄"
                        )
            
            # 事件綁定
            def send_message(message, history):
                return self.chat_with_agent_enhanced(message, history)
            
            def clear_chat():
                self.conversation_history = []
                return []
            
            def refresh_status():
                self.update_tools_status()
                return self._get_status_html(), self.tools_status, self.get_hallucination_stats()
            
            def test_hallucination():
                msg, result = self.test_known_hallucination()
                return result
            
            send_btn.click(send_message, inputs=[msg_input, chatbot], outputs=[msg_input, chatbot])
            msg_input.submit(send_message, inputs=[msg_input, chatbot], outputs=[msg_input, chatbot])
            
            clear_chat_btn.click(clear_chat, outputs=[chatbot])
            
            refresh_status_btn.click(
                refresh_status,
                outputs=[status_display, tools_status_display, safety_stats]
            )
            
            test_hallucination_btn.click(test_hallucination, outputs=[test_result])
        
        return demo
    
    def _get_status_html(self) -> str:
        """獲取狀態 HTML"""
        if "就緒" in self.agent_status:
            status_class = "status-ready"
            status_icon = "🟢"
        else:
            status_class = "status-error"
            status_icon = "🔴"
        
        mcp_status = "🟢 正常" if test_mcp_connection() else "🔴 異常"
        
        return f"""
        <div class="status-box {status_class}">
            <h4>{status_icon} 系統狀態</h4>
            <p><strong>Agent:</strong> {self.agent_status}</p>
            <p><strong>MCP Server:</strong> {mcp_status}</p>
            <p><strong>反幻覺保護:</strong> 🛡️ 已啟用</p>
        </div>
        """

def main():
    """主程式"""
    print("🚀 啟動強化版 SFDA Nexus × Qwen-Agent Gradio 界面")
    
    try:
        # 檢查 MCP 連接
        if not test_mcp_connection():
            print("⚠️ 警告：無法連接到 MCP Server，部分功能可能不可用")
        
        # 創建 UI 實例
        ui = EnhancedGradioQwenAgentUI()
        
        # 創建並啟動界面
        demo = ui.create_gradio_interface()
        
        print("✅ 強化版界面創建成功")
        print(f"🌐 界面地址: http://localhost:{GRADIO_CONFIG.get('port', 7861)}")
        
        demo.launch(
            server_name=GRADIO_CONFIG.get("server_name", "localhost"),
            server_port=GRADIO_CONFIG.get("port", 7861),
            share=GRADIO_CONFIG.get("share", False),
            debug=True
        )
        
    except Exception as e:
        print(f"❌ 啟動失敗: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
