#!/bin/bash

# SFDA Nexus × Qwen-Agent Gradio UI 啟動腳本

echo "🚀 SFDA Nexus × Qwen-Agent Gradio UI 啟動腳本"
echo "================================================"

# 檢查當前目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📂 當前目錄: $SCRIPT_DIR"

# 檢查虛擬環境
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "⚠️  虛擬環境未啟動，正在啟動..."
    source "$SCRIPT_DIR/qwen_agent_env/bin/activate"
    if [[ $? -eq 0 ]]; then
        echo "✅ 虛擬環境啟動成功"
    else
        echo "❌ 虛擬環境啟動失敗"
        exit 1
    fi
else
    echo "✅ 虛擬環境已啟動: $VIRTUAL_ENV"
fi

# 檢查 Python 依賴
echo "🔍 檢查 Python 依賴..."
python -c "import gradio; print('✅ Gradio 已安裝:', gradio.__version__)" 2>/dev/null || {
    echo "❌ Gradio 未安裝，正在安裝..."
    pip install gradio>=4.0.0
}

python -c "import qwen_agent; print('✅ Qwen-Agent 已安裝')" 2>/dev/null || {
    echo "❌ Qwen-Agent 未安裝，正在安裝..."
    pip install qwen-agent>=0.0.9
}

# 檢查 MCP Server 連接
echo "🔍 檢查 MCP Server 連接..."
curl -s http://localhost:8080/health >/dev/null 2>&1
if [[ $? -eq 0 ]]; then
    echo "✅ MCP Server 連接正常"
else
    echo "⚠️  警告: MCP Server 可能未運行 (localhost:8080)"
    echo "   請確認 SFDA MCP Server 已啟動"
fi

# 檢查 Ollama 服務
echo "🔍 檢查 Ollama 服務..."
curl -s http://localhost:11434/api/tags >/dev/null 2>&1
if [[ $? -eq 0 ]]; then
    echo "✅ Ollama 服務正常"
    
    # 檢查 qwen3:30b 模型
    ollama list | grep "qwen3:30b" >/dev/null 2>&1
    if [[ $? -eq 0 ]]; then
        echo "✅ qwen3:30b 模型可用"
    else
        echo "⚠️  警告: qwen3:30b 模型可能未安裝"
        echo "   可用模型列表:"
        ollama list 2>/dev/null || echo "   無法獲取模型列表"
    fi
else
    echo "⚠️  警告: Ollama 服務可能未運行 (localhost:11434)"
fi

echo ""
echo "🌐 準備啟動 Gradio UI..."
echo "   存取網址: http://localhost:7860"
echo "   按 Ctrl+C 停止服務"
echo ""

# 啟動 Gradio UI
python gradio_ui.py 