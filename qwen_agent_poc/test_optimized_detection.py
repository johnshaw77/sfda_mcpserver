#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
優化後反AI幻覺檢測器測試腳本
測試智能上下文驗證功能
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tool_result_enforcer import tool_result_enforcer
from qwen_tools import get_employee_info

def test_optimized_detection():
    """測試優化後的編造檢測器"""
    print("🧪 開始測試優化後的反AI幻覺檢測器...")
    print("=" * 60)
    
    # 測試 1: 查詢 A123457 (李小華 - HR部門)
    print("\n📋 測試 1: 查詢 A123457 (李小華 - HR部門)")
    print("-" * 40)
    
    # 模擬真實工具調用
    tool_result = get_employee_info("A123457", True)
    print(f"工具調用結果: {tool_result['success']}")
    
    # 註冊工具結果
    call_id = tool_result_enforcer.register_tool_result(
        "get_employee_info",
        {"employeeId": "A123457", "includeDetails": True},
        tool_result
    )
    print(f"工具結果註冊 ID: {call_id}")
    
    # 測試包含HR關鍵字的回應（這應該是有效的，因為員工真的在HR部門）
    test_response = """
    根據員工資料查詢結果：
    
    員工編號：A123457
    姓名：李小華
    部門：HR 人力資源部
    職位：人資專員
    直屬主管：陳部長
    """
    
    # 驗證回應
    validation = tool_result_enforcer.validate_response(test_response, {})
    
    print(f"驗證結果:")
    print(f"  是否有效: {validation['is_valid']}")
    print(f"  編造內容: {validation['fabricated_content']}")
    print(f"  信心度: {validation['confidence']}")
    
    if validation['is_valid']:
        print("✅ 成功：智能檢測器正確識別真實HR部門員工資料")
    else:
        print("❌ 失敗：仍然誤報HR部門員工資料為編造")
    
    # 測試 2: 測試真正的編造內容（陳志強）
    print("\n📋 測試 2: 測試真正的編造內容（陳志強）")
    print("-" * 40)
    
    fake_response = """
    根據員工資料查詢結果：
    
    員工編號：A999999
    姓名：陳志強
    部門：HR 人力資源部
    職位：招聘經理
    入職日期：2020-03-15
    電子郵件：chenzq@company.com
    """
    
    # 驗證編造回應
    fake_validation = tool_result_enforcer.validate_response(fake_response, {})
    
    print(f"驗證結果:")
    print(f"  是否有效: {fake_validation['is_valid']}")
    print(f"  編造內容: {fake_validation['fabricated_content']}")
    print(f"  信心度: {fake_validation['confidence']}")
    
    if not fake_validation['is_valid']:
        print("✅ 成功：正確檢測到編造的陳志強資料")
    else:
        print("❌ 失敗：未能檢測到編造內容")
    
    # 測試總結
    print("\n" + "=" * 60)
    print("🏆 測試總結:")
    
    test1_pass = validation['is_valid']
    test2_pass = not fake_validation['is_valid']
    
    print(f"測試 1 (真實HR員工): {'✅ 通過' if test1_pass else '❌ 失敗'}")
    print(f"測試 2 (編造內容檢測): {'✅ 通過' if test2_pass else '❌ 失敗'}")
    
    if test1_pass and test2_pass:
        print("\n🎉 所有測試通過！編造檢測器優化成功！")
        print("💡 系統現在能夠：")
        print("   ✅ 正確識別真實HR部門員工資料")
        print("   ✅ 準確檢測編造的員工資料")
        print("   ✅ 大幅減少誤報率")
    else:
        print("\n⚠️ 部分測試失敗，需要進一步調整檢測邏輯")
    
    return test1_pass and test2_pass

if __name__ == "__main__":
    try:
        success = test_optimized_detection()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ 測試執行錯誤: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
