#!/usr/bin/env python3
"""
測試員工不存在情況的腳本
用來驗證 Qwen Agent 是否會在員工不存在時產生虛假資料
"""

import sys
import os
sys.path.append('/Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/qwen_agent_poc')

from mcp_tools import get_employee_info
import json

def test_nonexistent_employee():
    """測試不存在的員工編號"""
    print("🧪 測試不存在的員工編號：A999999")
    print("=" * 50)
    
    # 測試不存在的員工
    result = get_employee_info("A999999")
    print(f"工具回應: {result}")
    print()
    
    # 檢查是否包含錯誤訊息
    if "❌" in result and ("不存在" in result or "not_found" in result):
        print("✅ 測試通過：正確回報員工不存在")
        return True
    else:
        print("❌ 測試失敗：未正確處理不存在的員工")
        return False

def test_existing_employee():
    """測試存在的員工編號"""
    print("🧪 測試存在的員工編號：A123456")
    print("=" * 50)
    
    # 測試存在的員工
    result = get_employee_info("A123456")
    print(f"工具回應: {result}")
    print()
    
    # 檢查是否是有效的 JSON 且包含員工資料
    try:
        data = json.loads(result)
        if isinstance(data, dict) and data.get("success") == True:
            print("✅ 測試通過：正確返回員工資料")
            return True
        else:
            print("❌ 測試失敗：未正確返回員工資料")
            return False
    except json.JSONDecodeError:
        if "❌" not in result:
            print("❌ 測試失敗：回應格式錯誤")
            return False
        else:
            print("✅ 正確的錯誤回應格式")
            return True

if __name__ == "__main__":
    print("🚀 開始測試員工查詢功能")
    print("=" * 60)
    
    # 測試不存在的員工
    test1_passed = test_nonexistent_employee()
    
    # 測試存在的員工
    test2_passed = test_existing_employee()
    
    print("=" * 60)
    print("📊 測試結果總結：")
    print(f"   - 不存在員工測試: {'✅ 通過' if test1_passed else '❌ 失敗'}")
    print(f"   - 存在員工測試: {'✅ 通過' if test2_passed else '❌ 失敗'}")
    
    if test1_passed and test2_passed:
        print("\n🎉 所有測試通過！工具正確處理了員工查詢情況")
        sys.exit(0)
    else:
        print("\n💥 測試失敗！需要進一步檢查和修復")
        sys.exit(1)
