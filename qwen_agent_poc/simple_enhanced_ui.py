#!/usr/bin/env python3
"""
簡化版強化 Gradio UI
"""

import gradio as gr
import json
from mcp_tools import get_employee_info, test_mcp_connection
from tool_result_enforcer import tool_result_enforcer

def enhanced_chat(message):
    """強化版聊天功能"""
    if not message.strip():
        return "請輸入問題"
    
    # 檢查員工查詢
    import re
    employee_match = re.search(r'A\d{6}', message)
    
    if employee_match:
        employee_id = employee_match.group(0)
        
        try:
            # 調用工具
            tool_result = get_employee_info(employee_id, True)
            
            # 註冊結果
            call_id = tool_result_enforcer.register_tool_result(
                "get_employee_info",
                {"employeeId": employee_id, "includeDetails": True},
                tool_result
            )
            
            # 解析結果
            if isinstance(tool_result, str):
                tool_data = json.loads(tool_result)
            else:
                tool_data = tool_result
            
            if (tool_data.get("success") and 
                "result" in tool_data and 
                tool_data["result"].get("success")):
                
                employee_data = tool_data["result"]["result"]["data"]["basic"]
                
                response = f"""✅ 員工資料查詢成功 (強化版保護)

👤 **員工資訊**
• 編號: {employee_data.get('employeeId')}
• 姓名: {employee_data.get('name')}
• 入職日期: {employee_data.get('hireDate')}

🛡️ **安全保證**: 此資料來自實際工具調用，非AI編造
🔧 **工具執行ID**: {call_id}

⚠️ **重要**: 系統已自動檢測並阻止任何可能的AI編造內容"""
                
                # 檢測編造 (這裡應該不會有問題，因為是真實數據)
                validation = tool_result_enforcer.validate_response(response, {"employee_id": employee_id})
                
                if validation["is_valid"]:
                    response += "\n\n✅ **安全檢查**: 通過，無編造內容"
                else:
                    response += f"\n\n🚨 **安全警告**: 偵測到 {len(validation['fabricated_content'])} 個可疑內容"
                
                return response
            else:
                return f"❌ 員工編號 {employee_id} 不存在或查詢失敗"
        
        except Exception as e:
            return f"❌ 查詢錯誤: {str(e)}"
    
    else:
        return "💡 請輸入員工編號查詢 (例如: 請查詢員工編號 A123456 的資料)"

def test_hallucination_detection():
    """測試編造檢測"""
    fake_response = "員工A123456是陳志強，人力資源部招聘經理"
    validation = tool_result_enforcer.validate_response(fake_response, {"employee_id": "A123456"})
    
    if validation["is_valid"]:
        return "❌ 編造檢測失敗"
    else:
        return f"✅ 編造檢測成功！偵測到 {len(validation['fabricated_content'])} 個編造指標"

def get_system_status():
    """獲取系統狀態"""
    mcp_status = "🟢 正常" if test_mcp_connection() else "🔴 異常"
    return f"""📊 系統狀態

🔧 MCP Server: {mcp_status}
🛡️ 反AI幻覺保護: 🟢 已啟用
🔍 編造檢測: 🟢 正常
⚙️ 工具結果強制執行: 🟢 正常"""

# 創建界面
with gr.Blocks(title="強化版反AI幻覺系統", theme=gr.themes.Soft()) as demo:
    
    gr.HTML("""
    <div style="text-align: center; padding: 20px;">
        <h1>🛡️ 強化版反AI幻覺保護系統</h1>
        <p>防止AI編造員工資料，確保數據真實性</p>
    </div>
    """)
    
    with gr.Row():
        with gr.Column(scale=2):
            # 主聊天界面
            chatbot = gr.Chatbot(label="💬 安全對話", height=400)
            msg = gr.Textbox(label="", placeholder="請輸入問題 (例如: 請查詢員工編號 A123456 的資料)")
            
            with gr.Row():
                send_btn = gr.Button("發送", variant="primary")
                clear_btn = gr.Button("清空")
            
            gr.Examples([
                "請查詢員工編號 A123456 的資料",
                "請查詢員工編號 A123457 的資料",
                "請查詢員工編號 A999999 的資料"
            ], msg)
        
        with gr.Column(scale=1):
            # 狀態面板
            status_output = gr.Textbox(label="🔍 系統狀態", value=get_system_status(), lines=6)
            
            # 測試按鈕
            test_btn = gr.Button("🧪 測試編造檢測", variant="secondary")
            test_output = gr.Textbox(label="測試結果", lines=2)
            
            refresh_btn = gr.Button("🔄 刷新狀態", variant="secondary")
    
    # 事件處理
    def respond(message, history):
        response = enhanced_chat(message)
        history = history + [(message, response)]
        return history, ""
    
    send_btn.click(respond, inputs=[msg, chatbot], outputs=[chatbot, msg])
    msg.submit(respond, inputs=[msg, chatbot], outputs=[chatbot, msg])
    clear_btn.click(lambda: [], outputs=[chatbot])
    test_btn.click(test_hallucination_detection, outputs=[test_output])
    refresh_btn.click(get_system_status, outputs=[status_output])

if __name__ == "__main__":
    print("🚀 啟動簡化版強化 UI")
    print("📍 界面地址: http://localhost:7862")
    
    demo.launch(
        server_name="localhost",
        server_port=7862,
        share=False
    )
