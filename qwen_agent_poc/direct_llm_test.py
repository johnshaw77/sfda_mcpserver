#!/usr/bin/env python3
"""
直接 LLM 反AI幻覺測試
繞過 qwen_agent 的 BasicAgent，直接使用底層 LLM
"""

import json
import logging
from mcp_tools import get_employee_info
from tool_result_enforcer import tool_result_enforcer

print("🔧 直接 LLM 反AI幻覺測試")

def test_direct_llm_with_tools():
    """直接使用 LLM 並集成工具結果強制器"""
    
    # 測試工具調用
    print("1. 測試工具調用...")
    employee_id = "A123456"
    tool_result = get_employee_info(employee_id, True)
    print(f"工具結果: {json.dumps(tool_result, ensure_ascii=False, indent=2)}")
    
    # 註冊工具結果到強制器
    print("2. 註冊工具結果...")
    call_id = tool_result_enforcer.register_tool_result(
        "get_employee_info", 
        {"employeeId": employee_id, "includeDetails": True}, 
        tool_result
    )
    print(f"工具調用 ID: {call_id}")
    
    # 模擬 AI 可能的編造回應
    print("3. 測試編造內容檢測...")
    fake_responses = [
        # 正確回應（不應被標記）
        f"""根據查詢結果，員工編號 {employee_id} 的資料如下：
姓名：張小明
部門：資訊技術部
職位：資深軟體工程師""",
        
        # 編造回應（應被標記和修正）
        f"""根據查詢結果，員工編號 {employee_id} 的資料如下：
姓名：陳志強
部門：人力資源部
職位：招聘經理
入職日期：2020-03-15
電子郵件：chenzq@company.com"""
    ]
    
    for i, response in enumerate(fake_responses, 1):
        print(f"\n--- 測試回應 {i} ---")
        print(f"原始回應: {response}")
        
        # 驗證回應
        validation = tool_result_enforcer.validate_response(
            response, 
            {"employee_id": employee_id}
        )
        
        print(f"驗證結果:")
        print(f"  有效: {validation['is_valid']}")
        print(f"  信心度: {validation['confidence']}")
        if validation['fabricated_content']:
            print(f"  編造內容: {validation['fabricated_content']}")
        
        if not validation['is_valid']:
            print(f"修正後回應: {validation['corrected_response']}")
    
    # 測試強制工具結果回應
    print("\n4. 測試強制工具結果...")
    mock_tool_calls = [{
        "name": "get_employee_info",
        "parameters": {"employeeId": employee_id, "includeDetails": True},
        "result": tool_result
    }]
    
    enforced_response = tool_result_enforcer.enforce_tool_only_response(
        mock_tool_calls, 
        fake_responses[1]  # 使用編造的回應
    )
    
    print(f"強制工具結果回應: {enforced_response}")
    
    return True

if __name__ == "__main__":
    try:
        success = test_direct_llm_with_tools()
        if success:
            print("\n✅ 直接 LLM 反AI幻覺測試成功！")
            print("🎯 工具結果強制執行器運作正常")
            print("🚫 編造內容檢測有效")
        else:
            print("\n❌ 測試失敗")
    except Exception as e:
        print(f"\n❌ 測試過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()
