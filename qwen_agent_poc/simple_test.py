#!/usr/bin/env python3
"""
簡化版測試腳本
"""

print("🔬 開始測試強化版反AI幻覺系統")

try:
    from qwen_agent_demo import SFDAQwenAgent
    print("✅ Agent 模組載入成功")
    
    # 初始化 Agent
    print("🔧 正在初始化 Agent...")
    agent = SFDAQwenAgent()
    print("✅ Agent 初始化完成")
    
    # 測試單個查詢
    test_query = "請查詢員工編號 A123456 的基本資料"
    print(f"❓ 測試查詢: {test_query}")
    
    response = agent.chat(test_query)
    print(f"🤖 AI 回應:\n{response}")
    
    # 檢查是否包含編造內容
    hallucination_indicators = ["陳志強", "招聘經理", "2020-03-15", "chenzq@company.com"]
    has_hallucination = any(indicator in response for indicator in hallucination_indicators)
    
    if has_hallucination:
        print("❌ 偵測到編造內容！")
    else:
        print("✅ 無編造內容偵測")
    
    if "張小明" in response:
        print("✅ 包含正確員工姓名")
    else:
        print("❌ 缺少正確員工姓名")
    
except Exception as e:
    print(f"❌ 測試失敗: {e}")
    import traceback
    traceback.print_exc()
