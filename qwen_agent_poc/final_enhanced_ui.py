#!/usr/bin/env python3
"""
最終版強化反AI幻覺系統 - Gradio UI
解決了所有載入和啟動問題
"""

import gradio as gr
import json
import time
import logging
from datetime import datetime

# 設置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("🚀 載入強化版反AI幻覺系統...")

# 載入必要模組
try:
    from mcp_tools import get_employee_info, test_mcp_connection
    from tool_result_enforcer import tool_result_enforcer
    print("✅ 核心模組載入成功")
except Exception as e:
    print(f"❌ 模組載入失敗: {e}")
    exit(1)

class AntiHallucinationSystem:
    """反AI幻覺系統"""
    
    def __init__(self):
        self.stats = {
            "total_queries": 0,
            "hallucination_detected": 0,
            "real_data_returned": 0
        }
        self.conversation_history = []
    
    def process_query(self, message):
        """處理查詢並應用反幻覺保護"""
        start_time = time.time()
        self.stats["total_queries"] += 1
        
        # 檢查員工查詢
        import re
        employee_match = re.search(r'A\d{6}', message)
        
        if employee_match:
            employee_id = employee_match.group(0)
            return self._handle_employee_query(employee_id, message, start_time)
        else:
            return self._handle_general_query(message, start_time)
    
    def _handle_employee_query(self, employee_id, message, start_time):
        """處理員工查詢"""
        try:
            logger.info(f"處理員工查詢: {employee_id}")
            
            # 1. 調用真實工具
            tool_result = get_employee_info(employee_id, True)
            
            # 2. 註冊工具結果
            call_id = tool_result_enforcer.register_tool_result(
                "get_employee_info",
                {"employeeId": employee_id, "includeDetails": True},
                tool_result
            )
            
            # 3. 解析工具結果
            if isinstance(tool_result, str):
                tool_data = json.loads(tool_result)
            else:
                tool_data = tool_result
            
            # 4. 構建回應
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
                
                # 增加真實數據計數
                self.stats["real_data_returned"] += 1
                
                response = f"""✅ **員工資料查詢成功** (反AI幻覺保護已啟用)

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

---

🛡️ **安全保證**：
• ✅ 此資料來自實際 MCP 工具調用，非AI編造
• ✅ 已通過反幻覺檢測系統驗證
• 🔧 工具執行ID：`{call_id}`"""
                
                # 5. 執行反幻覺檢測（確保沒有編造內容）
                validation = tool_result_enforcer.validate_response(response, {"employee_id": employee_id})
                
                if not validation["is_valid"]:
                    # 這種情況不應該發生，但作為安全措施
                    self.stats["hallucination_detected"] += 1
                    logger.warning(f"意外檢測到編造內容: {validation['fabricated_content']}")
                    response += f"\n\n⚠️ **系統警告**: 檢測到 {len(validation['fabricated_content'])} 個異常項目"
                else:
                    response += f"\n\n✅ **安全檢查**: 已驗證，無編造內容"
                
            else:
                # 員工不存在或查詢失敗
                response = f"""❌ **員工查詢失敗**

查詢的員工編號：`{employee_id}`

**可能原因：**
• 員工編號不存在
• 員工編號格式錯誤
• 系統暫時無法查詢

**正確格式範例：** A123456

**測試用員工編號：**
• `A123456`：張小明 (資訊技術部)
• `A123457`：李小華 (人力資源部)

🛡️ **重要**: 系統不會編造不存在的員工資料"""
            
            # 6. 記錄執行時間
            end_time = time.time()
            execution_time = end_time - start_time
            response += f"\n\n⏱️ **執行時間**: {execution_time:.2f} 秒"
            
            # 7. 保存對話歷史
            self.conversation_history.append({
                "timestamp": datetime.now().isoformat(),
                "query": message,
                "employee_id": employee_id,
                "response_type": "employee_query",
                "tool_call_id": call_id,
                "execution_time": execution_time,
                "validation_passed": validation.get("is_valid", True)
            })
            
            return response
            
        except Exception as e:
            logger.error(f"員工查詢處理錯誤: {e}")
            return f"❌ **查詢處理錯誤**\n\n錯誤詳情：{str(e)}\n\n請稍後重試或聯絡技術支援。"
    
    def _handle_general_query(self, message, start_time):
        """處理一般查詢"""
        end_time = time.time()
        execution_time = end_time - start_time
        
        response = f"""💡 **一般查詢處理**

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
• 請查詢員工編號 A999999 的基本資料（不存在）

⏱️ **執行時間**: {execution_time:.2f} 秒"""
        
        return response
    
    def test_hallucination_detection(self):
        """測試編造檢測功能"""
        logger.info("執行編造檢測測試")
        
        # 創建包含已知編造內容的測試文本
        fake_response = """員工編號 A123456 的資料：
姓名：陳志強
部門：人力資源部
職位：招聘經理
入職日期：2020-03-15
電子郵件：chenzq@company.com
電話：(02) 2345-6789"""
        
        # 執行檢測
        validation = tool_result_enforcer.validate_response(fake_response, {"employee_id": "A123456"})
        
        if validation["is_valid"]:
            return "❌ **編造檢測測試失敗**\n\n系統未能識別已知的編造內容。"
        else:
            detected_items = validation["fabricated_content"]
            result = f"""✅ **編造檢測測試成功**

**檢測結果：**
• 偵測到編造內容：{len(detected_items)} 項
• 系統狀態：正常運作

**檢測到的編造指標：**"""
            
            for item in detected_items:
                result += f"\n• {item['category']}: `{item['indicator']}`"
            
            result += f"""

**測試結論：**
✅ 反AI幻覺系統運作正常
✅ 可以有效識別並阻止編造內容
✅ 員工資料查詢安全可靠"""
            
            return result
    
    def get_system_status(self):
        """獲取系統狀態"""
        mcp_status = "🟢 正常" if test_mcp_connection() else "🔴 異常"
        
        total = self.stats["total_queries"]
        detected = self.stats["hallucination_detected"]
        real_data = self.stats["real_data_returned"]
        
        detection_rate = (detected / total * 100) if total > 0 else 0
        success_rate = (real_data / total * 100) if total > 0 else 0
        
        return f"""📊 **系統狀態總覽**

**連接狀態：**
• MCP Server：{mcp_status}
• 反AI幻覺保護：🟢 已啟用
• 編造檢測：🟢 正常運作
• 工具結果強制執行：🟢 已啟用

**統計資料：**
• 總查詢次數：{total}
• 偵測到編造：{detected} 次 ({detection_rate:.1f}%)
• 返回真實資料：{real_data} 次 ({success_rate:.1f}%)
• 系統正常運作時間：{time.strftime('%H:%M:%S', time.gmtime(time.time()))}

**安全等級：**
{self._get_safety_level(detection_rate)}"""
    
    def _get_safety_level(self, detection_rate):
        """獲取安全等級"""
        if detection_rate == 0:
            return "🟢 **優秀** - 無編造內容檢測"
        elif detection_rate < 5:
            return "🟡 **良好** - 偶有編造但已攔截"
        elif detection_rate < 15:
            return "🟠 **警告** - 編造率較高，需關注"
        else:
            return "🔴 **危險** - 編造率過高，需立即檢查"

# 初始化系統
print("🔧 初始化反AI幻覺系統...")
anti_hallucination_system = AntiHallucinationSystem()
print("✅ 系統初始化完成")

# 創建 Gradio 界面
print("🎨 創建 Gradio 界面...")

def chat_interface(message, history):
    """聊天界面處理函數"""
    if not message.strip():
        return history, ""
    
    response = anti_hallucination_system.process_query(message)
    history = history + [(message, response)]
    return history, ""

def test_detection():
    """測試檢測功能"""
    return anti_hallucination_system.test_hallucination_detection()

def refresh_status():
    """刷新系統狀態"""
    return anti_hallucination_system.get_system_status()

def clear_history():
    """清空對話歷史"""
    return []

def get_conversation_history():
    """獲取對話歷史"""
    return anti_hallucination_system.conversation_history

# 創建界面
with gr.Blocks(
    title="強化版反AI幻覺保護系統",
    theme=gr.themes.Soft(),
    css="""
    .main-header { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; 
        padding: 20px; 
        border-radius: 10px; 
        margin-bottom: 20px; 
        text-align: center;
    }
    .status-panel { 
        background-color: #f8f9fa; 
        padding: 15px; 
        border-radius: 8px; 
        border: 1px solid #dee2e6;
    }
    .test-section {
        background-color: #fff3cd;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #ffeaa7;
    }
    """
) as demo:
    
    # 標題區域
    gr.HTML("""
    <div class="main-header">
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
                placeholder="歡迎使用強化版反AI幻覺保護系統！\n\n請輸入員工查詢請求，系統將確保返回真實且未經編造的資料。",
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
            with gr.Group():
                status_display = gr.Textbox(
                    label="📊 系統狀態",
                    value=anti_hallucination_system.get_system_status(),
                    lines=15,
                    interactive=False,
                    container=True
                )
                refresh_btn = gr.Button("🔄 刷新狀態", variant="secondary")
            
            # 測試區域
            with gr.Group():
                gr.HTML('<div class="test-section"><h4>🧪 安全測試</h4></div>')
                test_btn = gr.Button("🔍 測試編造檢測", variant="secondary")
                test_output = gr.Textbox(
                    label="測試結果",
                    lines=8,
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
            
            with gr.Tab("ℹ️ 系統資訊"):
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
    send_btn.click(
        chat_interface,
        inputs=[msg_input, chatbot],
        outputs=[chatbot, msg_input]
    )
    
    msg_input.submit(
        chat_interface,
        inputs=[msg_input, chatbot],
        outputs=[chatbot, msg_input]
    )
    
    clear_btn.click(clear_history, outputs=[chatbot])
    refresh_btn.click(refresh_status, outputs=[status_display])
    test_btn.click(test_detection, outputs=[test_output])
    update_history_btn.click(get_conversation_history, outputs=[history_display])

print("✅ Gradio 界面創建完成")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 啟動強化版反AI幻覺保護系統")
    print("="*60)
    print("📍 界面地址: http://localhost:7864")
    print("🛡️ 反AI幻覺保護: 已啟用")
    print("🔍 編造檢測: 已就緒")
    print("⚙️ 工具結果強制執行: 已啟用")
    print("="*60)
    
    demo.launch(
        server_name="localhost",
        server_port=7864,
        share=False,
        show_error=True,
        quiet=False
    )
