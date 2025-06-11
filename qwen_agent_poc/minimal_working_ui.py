#!/usr/bin/env python3
"""
極簡版強化反AI幻覺系統測試
"""

import gradio as gr
import json
import time
from mcp_tools import get_employee_info
from tool_result_enforcer import tool_result_enforcer

print("🚀 啟動極簡版強化反AI幻覺系統")

def process_employee_query(message):
    """處理員工查詢"""
    if not message.strip():
        return "請輸入查詢內容"
    
    import re
    employee_match = re.search(r'A\d{6}', message)
    
    if employee_match:
        employee_id = employee_match.group(0)
        
        # 調用真實工具
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
            
            response = f"""✅ 員工查詢成功 (強化版保護)

👤 員工編號: {employee_data.get('employeeId')}
📝 姓名: {employee_data.get('name')}
🏢 部門: {tool_data["result"]["result"]["data"]["department"].get("departmentName")}
💼 職位: {tool_data["result"]["result"]["data"]["position"].get("jobTitle")}

🛡️ 工具執行ID: {call_id}
✅ 反AI幻覺保護: 已驗證，確保數據真實性"""
            
            return response
        else:
            return f"❌ 員工編號 {employee_id} 不存在"
    else:
        return "💡 請輸入員工編號查詢 (例如: A123456)"

def test_detection():
    """測試編造檢測"""
    fake_text = "員工A123456是陳志強，人力資源部招聘經理"
    validation = tool_result_enforcer.validate_response(fake_text, {"employee_id": "A123456"})
    
    if validation["is_valid"]:
        return "❌ 檢測失敗"
    else:
        return f"✅ 檢測成功！發現 {len(validation['fabricated_content'])} 個編造項目"

# Gradio 界面
with gr.Blocks(title="強化版反AI幻覺系統") as demo:
    gr.Markdown("# 🛡️ 強化版反AI幻覺保護系統")
    
    with gr.Row():
        with gr.Column():
            input_box = gr.Textbox(
                placeholder="請輸入員工查詢 (例如: 請查詢員工編號 A123456)",
                label="查詢輸入"
            )
            output_box = gr.Textbox(label="查詢結果", lines=10)
            
            with gr.Row():
                query_btn = gr.Button("🔍 查詢", variant="primary")
                test_btn = gr.Button("🧪 測試檢測", variant="secondary")
            
            gr.Examples([
                "請查詢員工編號 A123456",
                "請查詢員工編號 A123457", 
                "請查詢員工編號 A999999"
            ], input_box)
        
        with gr.Column():
            test_result = gr.Textbox(label="檢測測試結果", lines=5)
    
    # 事件綁定
    query_btn.click(process_employee_query, inputs=input_box, outputs=output_box)
    test_btn.click(test_detection, outputs=test_result)

print("✅ 界面創建完成")
print("🌐 啟動服務於: http://localhost:7865")

if __name__ == "__main__":
    demo.launch(
        server_name="localhost",
        server_port=7865,
        share=False
    )
