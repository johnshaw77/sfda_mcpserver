"""
SFDA Nexus × 強化版反AI幻覺保護系統 - Gradio 界面
直接使用工具，無需依賴 qwen_agent.BasicAgent
"""

import gradio as gr
import json
import logging
import time
from datetime import datetime
from typing import List, Tuple, Dict, Any

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from config import GRADIO_CONFIG
    from mcp_tools import test_mcp_connection, get_tools_status, get_employee_info
    from tool_result_enforcer import tool_result_enforcer
    print("✅ 成功導入強化版模組")
except ImportError as e:
    print(f"❌ 模組導入失敗: {e}")
    print("請確認所有依賴套件已正確安裝")

class EnhancedGradioUI:
    """強化版 Gradio UI 管理類"""
    
    def __init__(self):
        """初始化 UI"""
        self.conversation_history = []
        self.system_status = "強化版反AI幻覺系統已就緒"
        self.tools_status = {}
        self.anti_hallucination_stats = {
            "total_queries": 0,
            "hallucination_detected": 0,
            "real_data_returned": 0
        }
        self.init_system()
    
    def init_system(self):
        """初始化系統"""
        try:
            # 更新工具狀態
            self.update_tools_status()
            logger.info("✅ 強化版系統初始化成功")
        except Exception as e:
            self.system_status = f"初始化失敗: {str(e)}"
            logger.error(f"❌ 系統初始化失敗: {e}")
    
    def update_tools_status(self):
        """更新工具狀態"""
        try:
            self.tools_status = get_tools_status()
            logger.info("✅ 工具狀態更新成功")
        except Exception as e:
            logger.error(f"更新工具狀態失敗: {e}")
            self.tools_status = {"error": str(e)}
    
    def chat_with_agent(self, message: str, history: List[Tuple[str, str]]) -> Tuple[str, List[Tuple[str, str]]]:
        """強化版對話處理"""
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
                response = self._handle_employee_query(employee_id, message)
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
    
    def _handle_employee_query(self, employee_id: str, message: str) -> str:
        """處理員工查詢"""
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

    def test_hallucination_detection(self) -> str:
        """測試編造檢測功能"""
        fake_response = "員工A123456是陳志強，人力資源部招聘經理"
        validation = tool_result_enforcer.validate_response(fake_response, {"employee_id": "A123456"})
        
        if validation["is_valid"]:
            return "❌ 編造檢測測試失敗"
        else:
            return f"✅ 編造檢測測試成功！偵測到 {len(validation['fabricated_content'])} 個編造指標"

    def get_system_status(self) -> str:
        """獲取系統狀態"""
        mcp_status = "🟢 正常" if test_mcp_connection() else "🔴 異常"
        
        total = self.anti_hallucination_stats["total_queries"]
        detected = self.anti_hallucination_stats["hallucination_detected"]
        real_data = self.anti_hallucination_stats["real_data_returned"]
        
        detection_rate = (detected / total * 100) if total > 0 else 0
        success_rate = (real_data / total * 100) if total > 0 else 0
        
        return f"""📊 **系統狀態總覽**

**連接狀態：**
• MCP Server：{mcp_status}
• 反AI幻覺保護：🟢 已啟用
• 編造檢測：🟢 正常運作

**統計資料：**
• 總查詢次數：{total}
• 偵測到編造：{detected} 次 ({detection_rate:.1f}%)
• 返回真實資料：{real_data} 次 ({success_rate:.1f}%)

**安全等級：**
{'🟢 優秀' if detection_rate == 0 else '🟡 良好' if detection_rate < 5 else '🔴 需注意'}"""

    def create_gradio_interface(self):
        """創建 Gradio 界面"""
        with gr.Blocks(
            title="強化版反AI幻覺保護系統",
            theme=gr.themes.Soft()
        ) as demo:
            
            gr.HTML("""
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; margin-bottom: 20px;">
                <h1>🛡️ 強化版反AI幻覺保護系統</h1>
                <p>防止AI編造員工資料 • 確保數據真實性 • 工具結果強制執行</p>
                <p><strong>版本:</strong> v2.0 Enhanced | <strong>狀態:</strong> 🟢 已啟用</p>
            </div>
            """)
            
            with gr.Row():
                # 左側：主要對話區域
                with gr.Column(scale=2):
                    chatbot = gr.Chatbot(
                        label="💬 安全對話界面",
                        height=500,
                        container=True,
                        show_label=True
                    )
                    
                    with gr.Row():
                        msg_input = gr.Textbox(
                            placeholder="請輸入查詢 (例如：請查詢員工編號 A123456 的基本資料)",
                            label="",
                            scale=4,
                            container=False
                        )
                        send_btn = gr.Button("🚀 發送", variant="primary", scale=1)
                    
                    with gr.Row():
                        clear_btn = gr.Button("🗑️ 清空", variant="secondary")
                        
                    # 範例查詢
                    gr.Examples(
                        examples=[
                            "請查詢員工編號 A123456 的基本資料",
                            "請查詢員工編號 A123457 的基本資料", 
                            "請查詢員工編號 A999999 的基本資料",
                            "什麼是反AI幻覺保護？"
                        ],
                        inputs=msg_input,
                        label="💡 範例查詢"
                    )
                
                # 右側：狀態和控制面板
                with gr.Column(scale=1):
                    # 系統狀態
                    status_display = gr.Textbox(
                        label="📊 系統狀態",
                        value=self.get_system_status(),
                        lines=12,
                        interactive=False,
                        container=True
                    )
                    refresh_btn = gr.Button("🔄 刷新狀態", variant="secondary")
                    
                    # 測試區域
                    gr.HTML('<h4 style="margin: 15px 0 5px 0;">🧪 安全測試</h4>')
                    test_btn = gr.Button("🔍 測試編造檢測", variant="secondary")
                    test_output = gr.Textbox(
                        label="測試結果",
                        lines=4,
                        interactive=False
                    )
            
            # 底部：詳細資訊
            with gr.Accordion("📋 系統詳情", open=False):
                with gr.Tabs():
                    with gr.Tab("📈 對話歷史"):
                        history_display = gr.JSON(
                            label="詳細對話記錄",
                            container=True
                        )
                        update_history_btn = gr.Button("🔄 更新歷史")
                    
                    with gr.Tab("🔧 工具狀態"):
                        tools_display = gr.JSON(
                            label="MCP 工具狀態",
                            value=self.tools_status,
                            container=True
                        )
                    
                    with gr.Tab("ℹ️ 系統說明"):
                        gr.Markdown("""
                        ### 🛡️ 反AI幻覺保護系統說明
                        
                        **核心功能：**
                        - ✅ **編造檢測**：自動識別AI可能編造的員工資料
                        - ✅ **工具結果強制執行**：確保只使用真實的工具查詢結果
                        - ✅ **實時驗證**：每次查詢都經過多重安全檢查
                        - ✅ **透明化處理**：清楚顯示資料來源和驗證狀態
                        
                        **安全機制：**
                        1. **工具結果註冊**：所有工具調用結果都被記錄和追蹤
                        2. **編造指標檢測**：識別特定的編造內容模式
                        3. **回應驗證**：對最終回應進行安全性檢查
                        4. **錯誤攔截**：自動攔截並修正包含編造內容的回應
                        
                        **測試用員工編號：**
                        - `A123456`：張小明 (資訊技術部，資深軟體工程師)
                        - `A123457`：李小華 (人力資源部)
                        - `A999999`：不存在的員工編號
                        """)
            
            # 事件綁定
            def send_message(message, history):
                return self.chat_with_agent(message, history)
            
            def clear_chat():
                return []
            
            def refresh_status():
                self.update_tools_status()
                return self.get_system_status()
            
            def test_detection():
                return self.test_hallucination_detection()
            
            def get_conversation_history():
                return self.conversation_history
            
            send_btn.click(send_message, inputs=[msg_input, chatbot], outputs=[msg_input, chatbot])
            msg_input.submit(send_message, inputs=[msg_input, chatbot], outputs=[msg_input, chatbot])
            
            clear_btn.click(clear_chat, outputs=[chatbot])
            refresh_btn.click(refresh_status, outputs=[status_display])
            test_btn.click(test_detection, outputs=[test_output])
            update_history_btn.click(get_conversation_history, outputs=[history_display])
        
        return demo


def main():
    """主程式"""
    print("🚀 啟動強化版 SFDA Nexus × 反AI幻覺保護系統")
    
    try:
        # 檢查 MCP 連接
        if not test_mcp_connection():
            print("⚠️ 警告：無法連接到 MCP Server，部分功能可能不可用")
        
        # 創建 UI 實例
        ui = EnhancedGradioUI()
        
        # 創建並啟動界面
        demo = ui.create_gradio_interface()
        
        print("✅ 強化版界面創建成功")
        print(f"🌐 界面地址: http://localhost:{GRADIO_CONFIG.get('port', 7861)}")
        
        demo.launch(
            server_name=GRADIO_CONFIG.get("server_name", "localhost"),
            server_port=GRADIO_CONFIG.get("port", 7861),
            share=GRADIO_CONFIG.get("share", False),
            show_error=True
        )
        
    except Exception as e:
        print(f"❌ 啟動失敗: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
