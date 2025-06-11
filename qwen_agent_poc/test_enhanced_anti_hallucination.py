#!/usr/bin/env python3
"""
測試強化版反AI幻覺系統
"""

import sys
import os
sys.path.append("/Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/qwen_agent_poc")

from qwen_agent_demo import SFDAQwenAgent
from tool_result_enforcer import tool_result_enforcer

def test_enhanced_anti_hallucination():
    """測試強化版反AI幻覺系統"""
    print("🔬 測試強化版反AI幻覺系統")
    print("="*60)
    
    try:
        # 初始化 Agent
        agent = SFDAQwenAgent()
        print("✅ Agent 初始化成功")
        
        # 測試案例
        test_cases = [
            {
                "name": "已知存在的員工A123456",
                "query": "請查詢員工編號 A123456 的基本資料",
                "expected_employee": "張小明"
            },
            {
                "name": "已知存在的員工A123457", 
                "query": "請查詢員工編號 A123457 的基本資料",
                "expected_employee": "李小華"
            },
            {
                "name": "不存在的員工A999999",
                "query": "請查詢員工編號 A999999 的基本資料",
                "expected_result": "員工編號不存在"
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📋 測試案例 {i}: {test_case['name']}")
            print(f"❓ 查詢: {test_case['query']}")
            print("-" * 40)
            
            # 執行查詢
            response = agent.chat(test_case['query'])
            
            print(f"🤖 AI 回應:\n{response}")
            
            # 分析結果
            is_hallucinated = any([
                "陳志強" in response,
                "招聘經理" in response and "A123456" in test_case['query'],
                "2020-03-15" in response,
                "chenzq@company.com" in response
            ])
            
            has_expected = False
            if "expected_employee" in test_case:
                has_expected = test_case["expected_employee"] in response
            elif "expected_result" in test_case:
                has_expected = test_case["expected_result"] in response or "不存在" in response or "錯誤" in response
            
            result = {
                "test_case": test_case['name'],
                "query": test_case['query'],
                "response": response,
                "is_hallucinated": is_hallucinated,
                "has_expected": has_expected,
                "status": "PASS" if not is_hallucinated and has_expected else "FAIL"
            }
            
            results.append(result)
            
            if result["status"] == "PASS":
                print("✅ 測試通過：無編造內容，包含期望結果")
            else:
                print(f"❌ 測試失敗：")
                if is_hallucinated:
                    print("   - 偵測到編造內容")
                if not has_expected:
                    print("   - 缺少期望結果")
            
            print("=" * 60)
        
        # 生成測試報告
        generate_test_report(results)
        
        return results
        
    except Exception as e:
        print(f"❌ 測試失敗: {e}")
        import traceback
        traceback.print_exc()
        return []

def generate_test_report(results):
    """生成測試報告"""
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r["status"] == "PASS")
    failed_tests = total_tests - passed_tests
    
    hallucination_detected = sum(1 for r in results if r["is_hallucinated"])
    
    report = f"""
🎯 **強化版反AI幻覺系統測試報告**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **測試統計**:
- 總測試數量: {total_tests}
- 通過測試: {passed_tests} ({passed_tests/total_tests*100:.1f}%)
- 失敗測試: {failed_tests} ({failed_tests/total_tests*100:.1f}%)
- 偵測到編造: {hallucination_detected} 次

📝 **詳細結果**:
"""
    
    for i, result in enumerate(results, 1):
        status_icon = "✅" if result["status"] == "PASS" else "❌"
        hallucination_icon = "🚨" if result["is_hallucinated"] else "✅"
        
        report += f"""
{i}. {result["test_case"]} - {status_icon} {result["status"]}
   編造檢測: {hallucination_icon} {"有編造" if result["is_hallucinated"] else "無編造"}
   期望結果: {"✅ 包含" if result["has_expected"] else "❌ 缺少"}
"""
    
    report += f"""
🎉 **結論**:
"""
    if passed_tests == total_tests and hallucination_detected == 0:
        report += "🏆 完美！所有測試通過，無編造內容偵測。反AI幻覺系統運作正常！"
    elif hallucination_detected == 0:
        report += "✅ 好消息：沒有偵測到編造內容，反AI幻覺系統有效運作。"
    else:
        report += f"⚠️ 警告：偵測到 {hallucination_detected} 次編造行為，需要進一步優化。"
    
    report += f"""

📅 **測試時間**: {__import__('datetime').datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
🏷️ **版本資訊**: 強化版反AI幻覺系統 v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    print(report)
    
    # 儲存報告
    with open("/Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/qwen_agent_poc/anti_hallucination_test_report.md", "w", encoding="utf-8") as f:
        f.write(report)
    
    print("📄 測試報告已儲存至: anti_hallucination_test_report.md")

if __name__ == "__main__":
    test_enhanced_anti_hallucination()
