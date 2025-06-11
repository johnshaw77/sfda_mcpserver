#!/usr/bin/env python3
"""
最小化測試 - 不使用 MCP 工具
"""

print("🔬 最小化測試開始")

try:
    # 測試基本模組載入
    print("1. 測試 qwen_agent 載入...")
    from qwen_agent.llm import get_chat_model
    print("✅ qwen_agent 載入成功")
    
    # 測試 LLM 配置
    print("2. 測試 LLM 配置...")
    llm_cfg = {
        'model': 'qwen3:8b',
        'model_server': 'http://localhost:11434/v1',
        'api_key': 'ollama',
        'generate_cfg': {
            'temperature': 0.1,
            'max_tokens': 500,
        }
    }
    
    print("3. 建立 LLM 實例...")
    llm = get_chat_model(llm_cfg)
    print("✅ LLM 實例建立成功")
    
    # 簡單測試
    print("4. 測試簡單對話...")
    messages = [{"role": "user", "content": "請說 hello world"}]
    
    # 這裡可能會卡住，所以我們增加一個簡單的超時機制
    import signal
    
    def timeout_handler(signum, frame):
        raise TimeoutError("LLM 調用超時")
    
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(30)  # 30秒超時
    
    try:
        response = llm.chat(messages)
        signal.alarm(0)  # 取消超時
        print(f"✅ LLM 回應: {response}")
    except TimeoutError:
        print("❌ LLM 調用超時（30秒）")
    
    print("🎉 基本測試完成")
    
except Exception as e:
    print(f"❌ 測試失敗: {e}")
    import traceback
    traceback.print_exc()
