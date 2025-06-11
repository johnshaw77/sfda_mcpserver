#!/usr/bin/env python3
"""
專門測試員工查詢的腳本
用於診斷 AI 編造員工資料的問題
"""

import sys
import os
import json
import logging

# 添加當前目錄到 Python 路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from qwen_agent_demo import SFDAQwenAgent

# 設定詳細日誌
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_employee_queries():
    """測試員工查詢功能"""
    print("🧪 啟動員工查詢測試...")
    
    try:
        # 初始化 Agent
        agent = SFDAQwenAgent()
        print("✅ Agent 初始化完成")
        
        # 測試案例
        test_cases = [
            {
                "name": "查詢存在的員工 A123456",
                "query": "請查詢員工編號 A123456 的基本資訊",
                "should_contain": ["張小明", "資訊技術部"],
                "should_not_contain": ["陳志強", "招聘經理"]
            },
            {
                "name": "查詢存在的員工 A123457", 
                "query": "請查詢員工編號 A123457 的資料",
                "should_contain": ["李小華", "人力資源部"],
                "should_not_contain": ["陳志強", "招聘經理"]
            },
            {
                "name": "查詢不存在的員工 A999999",
                "query": "請查詢員工編號 A999999",
                "should_contain": ["不存在", "找不到", "員工編號"],
                "should_not_contain": ["陳志強", "招聘經理", "HR部門"]
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{'='*60}")
            print(f"🔍 測試案例 {i}: {test_case['name']}")
            print(f"❓ 查詢: {test_case['query']}")
            print("-" * 60)
            
            # 執行查詢
            response = agent.chat(test_case['query'])
            
            print(f"🤖 AI 回應:")
            print(response)
            print("-" * 60)
            
            # 檢查結果
            test_result = {
                "name": test_case['name'],
                "query": test_case['query'],
                "response": response,
                "passed": True,
                "issues": []
            }
            
            # 檢查應該包含的內容
            for should_contain in test_case['should_contain']:
                if should_contain not in response:
                    test_result['passed'] = False
                    test_result['issues'].append(f"缺少預期內容: {should_contain}")
            
            # 檢查不應該包含的內容
            for should_not_contain in test_case['should_not_contain']:
                if should_not_contain in response:
                    test_result['passed'] = False
                    test_result['issues'].append(f"包含不應有的內容: {should_not_contain}")
            
            results.append(test_result)
            
            if test_result['passed']:
                print("✅ 測試通過")
            else:
                print("❌ 測試失敗")
                for issue in test_result['issues']:
                    print(f"   - {issue}")
        
        # 總結報告
        print(f"\n{'='*60}")
        print("📊 測試總結報告")
        print("="*60)
        
        passed_count = sum(1 for r in results if r['passed'])
        total_count = len(results)
        
        print(f"總測試數: {total_count}")
        print(f"通過數: {passed_count}")
        print(f"失敗數: {total_count - passed_count}")
        print(f"通過率: {passed_count/total_count*100:.1f}%")
        
        if passed_count < total_count:
            print("\n❌ 發現問題的測試:")
            for result in results:
                if not result['passed']:
                    print(f"  - {result['name']}")
                    for issue in result['issues']:
                        print(f"    * {issue}")
        
        # 保存結果到文件
        with open('test_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n📄 詳細結果已保存到: test_results.json")
        
    except Exception as e:
        import traceback
        print(f"❌ 測試執行失敗: {e}")
        print(f"錯誤追蹤: {traceback.format_exc()}")

if __name__ == "__main__":
    test_employee_queries()
