# 🤖 SFDA Nexus × Qwen-Agent Gradio UI 測試界面

## 📖 概述

這是一個基於 Gradio 的網頁測試界面，讓您可以透過友善的使用者介面來測試 Qwen-Agent 與 SFDA MCP Server 的整合功能。

## 🚀 快速啟動

### 方法一：使用啟動腳本（推薦）

```bash
# 進入專案目錄
cd sfda_mcpserver/qwen_agent_poc

# 執行啟動腳本
./start_gradio.sh
```

### 方法二：手動啟動

```bash
# 1. 啟動虛擬環境
source qwen_agent_env/bin/activate

# 2. 安裝依賴（如果尚未安裝）
pip install gradio>=4.0.0

# 3. 啟動 Gradio UI
python gradio_ui.py
```

## 🌐 存取界面

啟動成功後，開啟瀏覽器並前往：

- **本地存取**: http://localhost:7860
- **外部存取**: 修改 `config.py` 中的 `share=True` 設定

## 🎯 功能特色

### 💬 智能對話頁面

- **即時對話**: 與 SFDA 智能助理進行自然語言對話
- **工具調用可視化**: 觀察 AI 如何選擇和使用不同的工具
- **執行時間統計**: 顯示每次對話的處理時間
- **對話歷史**: 保留完整的對話記錄

### 🎯 快速測試案例

- **預設測試**: 6 個精心設計的測試案例
- **一鍵執行**: 快速測試不同功能組合
- **案例說明**: 詳細的測試案例描述和預期工具

### 📊 系統狀態監控

- **Agent 狀態**: 監控 Qwen-Agent 運行狀態
- **MCP Server 連接**: 檢查工具服務連接狀況
- **工具清單**: 顯示所有可用的 MCP 工具
- **重啟功能**: 一鍵重新啟動 Agent

### 📥 數據管理

- **對話匯出**: 將對話歷史匯出為 JSON 格式
- **歷史清除**: 清除所有對話記錄
- **統計資訊**: 顯示使用統計和性能數據

## 🧪 測試案例說明

### 單工具測試

1. **HR 工具測試**

   - 功能：員工資料查詢
   - 範例：「請查詢員工編號 A123456 的基本資訊」

2. **Task 工具測試**

   - 功能：任務建立和管理
   - 範例：「請建立一個新任務：準備下週的部門會議」

3. **Finance 工具測試**
   - 功能：預算和財務查詢
   - 範例：「請查詢技術部門 2025 年的預算使用狀況」

### 多工具協作測試

4. **HR + Task 協作**

   - 功能：員工查詢 + 任務建立
   - 範例：「請查詢李四的假期記錄，然後安排下週的績效評估會議」

5. **Finance + Task 協作**

   - 功能：預算查詢 + 任務規劃
   - 範例：「檢視本月的支出情況，並建立下月預算規劃任務」

6. **複雜跨部門協作**
   - 功能：HR + Task + Finance 綜合應用
   - 範例：「查詢人力資源部的人員清單，安排團隊建設活動，並估算所需預算」

## ⚙️ 系統要求

### 必要服務

- ✅ **SFDA MCP Server** 運行在 localhost:8080
- ✅ **Ollama 服務** 運行在 localhost:11434
- ✅ **qwen3:30b 模型** 已安裝並可用

### Python 環境

- Python 3.9+
- 虛擬環境：`qwen_agent_env`
- 依賴套件：gradio, qwen-agent, requests 等

### 檢查服務狀態

```bash
# 檢查 MCP Server
curl http://localhost:8080/health

# 檢查 Ollama 服務
curl http://localhost:11434/api/tags

# 檢查 qwen3:30b 模型
ollama list | grep qwen3
```

## 🔧 故障排除

### 常見問題

#### 1. Gradio UI 無法啟動

```bash
# 檢查虛擬環境
source qwen_agent_env/bin/activate

# 重新安裝 Gradio
pip install --upgrade gradio>=4.0.0

# 檢查端口是否被占用
lsof -i :7860
```

#### 2. Agent 初始化失敗

- 確認 MCP Server 正在運行
- 檢查 Ollama 服務狀態
- 查看控制台錯誤訊息

#### 3. 工具調用失敗

- 檢查 MCP Server 連接狀態
- 確認工具 API 端點可用
- 查看「系統狀態」頁面的詳細資訊

#### 4. 模型回應緩慢

- 確認 qwen3:30b 模型已正確加載
- 檢查系統資源使用情況
- 考慮調整模型參數（在 `config.py` 中）

## 📁 檔案結構

```
sfda_mcpserver/qwen_agent_poc/
├── gradio_ui.py              # Gradio UI 主程式
├── start_gradio.sh           # 啟動腳本
├── config.py                 # 配置檔案
├── qwen_agent_demo.py        # 核心 Agent 類
├── mcp_tools.py              # MCP 工具包裝器
├── qwen_tools.py             # Qwen-Agent 工具類
├── requirements.txt          # Python 依賴
├── qwen_agent_env/           # Python 虛擬環境
└── README_GRADIO.md          # 本說明文件
```

## 🎨 界面說明

### 智能對話頁面

- **左側對話區**: 主要的聊天界面，支援 Markdown 格式顯示
- **右側控制區**: 快速測試案例和操作按鈕
- **訊息輸入框**: 支援多行輸入，Enter 發送訊息
- **功能按鈕**: 發送、清除、匯出等操作

### 系統狀態頁面

- **Agent 狀態**: 顯示當前 Qwen-Agent 運行狀況
- **MCP 連接**: 即時監控 MCP Server 連接狀態
- **工具清單**: 列出所有可用的 MCP 工具及其描述
- **操作按鈕**: 更新狀態、重啟 Agent 等功能

### 使用說明頁面

- **功能介紹**: 詳細的功能說明和使用指南
- **測試案例**: 完整的測試案例說明
- **故障排除**: 常見問題和解決方案

## 📊 性能監控

### 響應時間統計

- 每次對話都會顯示執行時間
- 平均響應時間約 10-30 秒（取決於任務複雜度）
- 複雜多工具協作可能需要更長時間

### 資源使用監控

- 在「系統狀態」頁面查看當前狀態
- 對話歷史記錄統計
- Agent 運行時間和狀態

## 📞 技術支援

如遇到問題，請：

1. 查看控制台日誌輸出
2. 檢查「系統狀態」頁面
3. 確認所有必要服務正在運行
4. 參考故障排除章節

---

## 🎉 開始使用

現在您可以啟動 Gradio UI 並開始測試 SFDA Nexus × Qwen-Agent 的強大功能了！

```bash
./start_gradio.sh
```

然後開啟瀏覽器前往 http://localhost:7860 開始體驗！
