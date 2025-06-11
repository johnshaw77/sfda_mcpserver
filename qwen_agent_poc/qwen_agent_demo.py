"""
Qwen-Agent PoC 主要測試腳本
整合 SFDA MCP Server 工具，實現智能助理功能
"""

import os
import json
import logging
from typing import Dict, List, Any
from datetime import datetime

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from qwen_agent.agent import BasicAgent
    from qwen_agent.llm import get_chat_model
    print("✅ Qwen-Agent 模組載入成功")
except ImportError as e:
    print(f"❌ Qwen-Agent 模組載入失敗: {e}")
    print("提示：請確認已安裝 qwen-agent 套件")
    exit(1)

from config import QWEN_MODEL_CONFIG, AGENT_CONFIG, TEST_CASES
from mcp_tools import test_mcp_connection
from qwen_tools import get_qwen_tools, get_tool_descriptions
from tool_result_enforcer import tool_result_enforcer

class SFDAQwenAgent:
    """SFDA Qwen-Agent 整合類"""
    
    def __init__(self):
        """初始化 Agent"""
        self.agent = None
        self.llm = None
        self.conversation_history = []
        self.setup_agent()
    
    def setup_agent(self):
        """設定 Qwen Agent"""
        try:
            # 檢查 MCP Server 連接
            if not test_mcp_connection():
                raise Exception("無法連接到 MCP Server")
            
            # 設定 LLM 配置
            llm_cfg = {
                'model': QWEN_MODEL_CONFIG['model'],
                'model_server': QWEN_MODEL_CONFIG.get('api_base', 'http://localhost:11434/v1'),
                'api_key': QWEN_MODEL_CONFIG.get('api_key', 'ollama'),
                'generate_cfg': {
                    'temperature': QWEN_MODEL_CONFIG.get('temperature', 0.7),
                    'max_tokens': QWEN_MODEL_CONFIG.get('max_tokens', 2000),
                    'top_p': QWEN_MODEL_CONFIG.get('top_p', 0.8)
                }
            }
            
            # 建立 LLM 實例
            self.llm = get_chat_model(llm_cfg)
            
            # 獲取 Qwen-Agent 工具列表
            function_list = get_qwen_tools()
            
            # 建立增強的系統提示詞
            system_message = self._build_system_prompt()
            
            # 建立 BasicAgent 實例
            self.agent = BasicAgent(
                llm=self.llm,
                name=AGENT_CONFIG["name"],
                description=AGENT_CONFIG["description"], 
                function_list=function_list,
                system_message=system_message
            )
            
            logger.info("✅ Qwen-Agent 初始化完成")
            logger.info(f"📋 已載入 {len(function_list)} 個 MCP 工具")
            
        except Exception as e:
            logger.error(f"❌ Qwen-Agent 初始化失敗: {e}")
            raise
    
    def _build_system_prompt(self) -> str:
        """建立系統提示詞"""
        tools_description = get_tool_descriptions()
        
        system_prompt = f"""
{AGENT_CONFIG["instructions"]}

🔧 **可用工具清單**：
{tools_description}

🎯 **任務執行流程**：
1. 分析用戶需求，識別需要使用的工具
2. 按邏輯順序調用相關工具
3. 整合工具執行結果
4. 提供清晰的總結和建議

💡 **回應格式**：
- 使用繁體中文回應
- 先說明要執行的操作
- 顯示工具調用結果 
- 提供數據解釋和實用建議
- 必要時提供後續行動建議

📊 **數據處理原則**：
- 突出重要數據和趨勢
- 識別異常或需要關注的項目
- 提供可行的改善建議
- 保護敏感資訊的隱私

⚠️ **重要工具調用規則**：
- 當工具調用返回錯誤或找不到數據時，必須明確告知用戶錯誤情況
- 絕對不要基於記憶、推測或訓練數據來編造或生成不存在的員工資料
- 如果員工編號不存在，直接回報"員工編號不存在"，不要提供任何虛假資料
- 如果員工編號格式錯誤，說明正確格式並要求重新輸入
- 只能基於工具調用的實際結果來回應，不要補充任何未經工具驗證的資訊
- 當工具返回錯誤訊息時，必須如實轉達給用戶，不可改寫或美化

🚫 **嚴禁行為**：
- 編造不存在的員工姓名、部門、職位等資訊
- 在工具調用失敗時提供任何員工相關數據
- 基於部分資訊推測完整員工資料
- 忽略工具調用的錯誤結果

現在，請作為專業的企業智能助理，協助用戶處理各種人力資源、任務管理和財務相關的需求。
"""
        return system_prompt.strip()
    
    def chat(self, message: str) -> str:
        """與 Agent 進行對話，強制使用工具結果"""
        try:
            logger.info(f"🗣️ 用戶輸入: {message}")
            
            # 記錄對話歷史
            self.conversation_history.append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now().isoformat()
            })
            
            # 調用 Agent 處理（需要轉換為訊息格式）
            messages = [{"role": "user", "content": message}]
            response = self.agent.run(messages)
            
            # 處理回應（生成器轉換為列表）
            tool_calls_made = []
            if hasattr(response, '__iter__') and hasattr(response, '__next__'):
                # 這是一個生成器，轉換為列表
                response_list = list(response)
                logger.info(f"收到 {len(response_list)} 個回應項目")
                
                if response_list:
                    # 查找最終回應和工具調用
                    final_response = ""
                    for item in response_list:
                        if isinstance(item, dict):
                            # 檢查是否為工具調用
                            if "tool_call" in item or "function_call" in item:
                                tool_calls_made.append(item)
                            
                            # 檢查不同的回應格式
                            if 'content' in item:
                                final_response = item['content']
                            elif 'text' in item:
                                final_response = item['text']
                            elif 'message' in item:
                                final_response = item['message']
                        elif isinstance(item, str):
                            final_response = item
                        
                        # 記錄每個回應項目的內容以供調試
                        logger.info(f"回應項目: {type(item)} - {str(item)[:100]}...")
                    
                    if not final_response:
                        final_response = str(response_list[-1]) if response_list else "無回應內容"
                else:
                    final_response = "收到空回應"
            elif isinstance(response, (str, dict)):
                # 直接回應
                if isinstance(response, dict):
                    final_response = response.get('content', response.get('text', str(response)))
                else:
                    final_response = response
            else:
                final_response = str(response)
            
            # 🚨 強制工具結果執行檢查
            context = {"employee_id": self._extract_employee_id(message)}
            
            # 如果有工具調用，強制使用工具結果
            if tool_calls_made:
                logger.info(f"🔧 偵測到 {len(tool_calls_made)} 個工具調用")
                final_response = tool_result_enforcer.enforce_tool_only_response(
                    tool_calls_made, final_response
                )
            
            # 驗證回應內容
            validation_result = tool_result_enforcer.validate_response(final_response, context)
            
            if not validation_result["is_valid"]:
                logger.error(f"🚨 偵測到編造內容: {validation_result['fabricated_content']}")
                final_response = validation_result["corrected_response"]
            
            # 記錄回應歷史
            self.conversation_history.append({
                "role": "assistant", 
                "content": final_response,
                "timestamp": datetime.now().isoformat(),
                "validation": validation_result,
                "tool_calls": tool_calls_made
            })
            
            logger.info(f"🤖 Agent 回應: {final_response[:100]}...")
            return final_response
            
        except Exception as e:
            import traceback
            error_msg = f"處理對話時發生錯誤: {str(e)}"
            logger.error(error_msg)
            logger.error(f"完整錯誤追蹤: {traceback.format_exc()}")
            return error_msg
    
    def _extract_employee_id(self, message: str) -> str:
        """從訊息中提取員工編號"""
        import re
        # 查找 A + 6位數字的模式
        match = re.search(r'A\d{6}', message)
        return match.group(0) if match else ""
    
    def run_test_cases(self):
        """執行預定義的測試案例"""
        print("\n" + "="*60)
        print("🧪 開始執行 Qwen-Agent PoC 測試案例")
        print("="*60)
        
        results = []
        
        for i, test_case in enumerate(TEST_CASES, 1):
            print(f"\n📋 測試案例 {i}: {test_case['name']}")
            print(f"📝 描述: {test_case['description']}")
            print(f"❓ 提示: {test_case['prompt']}")
            print("-" * 40)
            
            try:
                # 執行測試
                start_time = datetime.now()
                response = self.chat(test_case['prompt'])
                end_time = datetime.now()
                
                execution_time = (end_time - start_time).total_seconds()
                
                print(f"🤖 回應: {response}")
                print(f"⏱️ 執行時間: {execution_time:.2f} 秒")
                
                # 記錄結果
                result = {
                    "test_case": test_case['name'],
                    "prompt": test_case['prompt'],
                    "response": response,
                    "execution_time": execution_time,
                    "success": "錯誤" not in response and "失敗" not in response,
                    "timestamp": start_time.isoformat()
                }
                results.append(result)
                
                if result["success"]:
                    print("✅ 測試通過")
                else:
                    print("❌ 測試失敗")
                    
            except Exception as e:
                print(f"❌ 測試執行失敗: {e}")
                results.append({
                    "test_case": test_case['name'],
                    "prompt": test_case['prompt'],
                    "response": f"執行失敗: {str(e)}",
                    "execution_time": 0,
                    "success": False,
                    "timestamp": datetime.now().isoformat()
                })
            
            print("=" * 60)
        
        # 生成測試報告
        self._generate_test_report(results)
        return results
    
    def _generate_test_report(self, results: List[Dict]):
        """生成測試報告"""
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r["success"])
        failed_tests = total_tests - passed_tests
        
        avg_execution_time = sum(r["execution_time"] for r in results) / total_tests if total_tests > 0 else 0
        
        report = f"""
🎯 **SFDA Nexus × Qwen-Agent PoC 測試報告**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **測試統計**:
- 總測試數量: {total_tests}
- 通過測試: {passed_tests} ({passed_tests/total_tests*100:.1f}%)
- 失敗測試: {failed_tests} ({failed_tests/total_tests*100:.1f}%)
- 平均執行時間: {avg_execution_time:.2f} 秒

📝 **詳細結果**:
"""
        
        for i, result in enumerate(results, 1):
            status = "✅ PASS" if result["success"] else "❌ FAIL"
            report += f"""
{i}. {result["test_case"]} - {status}
   執行時間: {result["execution_time"]:.2f}s
   回應長度: {len(result["response"])} 字符
"""
        
        report += f"""
🎉 **結論**:
"""
        if passed_tests == total_tests:
            report += "所有測試都通過！Qwen-Agent 與 MCP Server 整合成功。"
        elif passed_tests > total_tests * 0.8:
            report += "大部分測試通過，整合基本成功，建議檢查失敗案例。"
        else:
            report += "多個測試失敗，建議檢查配置和連接問題。"
        
        report += f"""

📅 **測試時間**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
🏷️ **版本資訊**: Qwen-Agent PoC v1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        
        print(report)
        
        # 儲存報告到文件
        with open("qwen_agent_test_report.md", "w", encoding="utf-8") as f:
            f.write(report)
        
        print("📄 測試報告已儲存至: qwen_agent_test_report.md")
    
    def interactive_mode(self):
        """交互式對話模式"""
        print("\n" + "="*60)
        print("🤖 SFDA Nexus × Qwen-Agent 交互式測試模式")
        print("💡 輸入 'quit' 或 'exit' 退出，輸入 'help' 查看幫助")
        print("="*60)
        
        while True:
            try:
                user_input = input("\n🗣️ 您: ").strip()
                
                if user_input.lower() in ['quit', 'exit', '退出']:
                    print("👋 感謝使用，再見！")
                    break
                
                if user_input.lower() in ['help', '幫助', '協助']:
                    self._show_help()
                    continue
                
                if not user_input:
                    continue
                
                print("🤖 正在處理中...")
                response = self.chat(user_input)
                print(f"🤖 Assistant: {response}")
                
            except KeyboardInterrupt:
                print("\n👋 用戶中斷，退出程式")
                break
            except Exception as e:
                print(f"❌ 發生錯誤: {e}")
    
    def _show_help(self):
        """顯示幫助資訊"""
        help_text = """
🆘 **使用幫助**:

📋 **可用工具功能**:
- 員工查詢: "查詢員工 A123456 的基本資料"
- 部門管理: "顯示公司所有部門清單"
- 出勤記錄: "查詢張三最近一週的出勤記錄"
- 任務管理: "建立新任務：準備部門會議"
- 預算查詢: "查詢技術部門本年度預算使用情況"

💡 **測試建議**:
- 嘗試組合使用多個工具
- 使用自然語言描述複雜需求
- 測試中文專業術語理解

🎯 **範例指令**:
1. "查詢人力資源部有哪些員工，然後安排一個團隊會議"
2. "檢查本月預算使用情況，並建立預算審查任務"
3. "查詢技術部門員工清單和他們的出勤狀況"

⌨️ **控制指令**:
- 'quit' 或 'exit': 退出程式
- 'help': 顯示此幫助
"""
        print(help_text)

def main():
    """主程式入口"""
    print("🚀 SFDA Nexus × Qwen-Agent PoC 測試程式")
    print("🔧 正在初始化 Agent...")
    
    try:
        # 建立 Agent 實例
        agent = SFDAQwenAgent()
        
        print("\n📋 選擇測試模式:")
        print("1. 執行預定義測試案例")
        print("2. 交互式對話模式")
        print("3. 執行所有測試")
        
        choice = input("\n請選擇 (1-3): ").strip()
        
        if choice == "1":
            agent.run_test_cases()
        elif choice == "2":
            agent.interactive_mode()
        elif choice == "3":
            print("執行預定義測試案例...")
            agent.run_test_cases()
            print("\n進入交互式模式...")
            agent.interactive_mode()
        else:
            print("無效選擇，進入交互式模式...")
            agent.interactive_mode()
            
    except Exception as e:
        print(f"❌ 程式執行失敗: {e}")
        logger.error(f"主程式錯誤: {e}", exc_info=True)

if __name__ == "__main__":
    main() 