#!/bin/bash

# Docker 建構測試腳本
set -e

echo "🧪 SFDA Nexus × Qwen-Agent Docker 建構測試"
echo "=========================================="

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# 1. 檢查 Docker 環境
print_status "檢查 Docker 環境..."
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安裝"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose 未安裝"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker 服務未運行"
    exit 1
fi

print_success "Docker 環境檢查通過"

# 2. 檢查配置文件語法
print_status "檢查 Docker Compose 配置..."
if docker-compose -f docker-compose.qwen-agent.yml config > /dev/null 2>&1; then
    print_success "Docker Compose 配置正確"
else
    print_error "Docker Compose 配置有錯誤"
    exit 1
fi

# 3. 測試 Qwen-Agent 容器建構
print_status "測試 Qwen-Agent 容器建構..."
if docker build -t sfda-qwen-agent-test ./qwen_agent_poc > /dev/null 2>&1; then
    print_success "Qwen-Agent 容器建構成功"
else
    print_error "Qwen-Agent 容器建構失敗"
    docker build ./qwen_agent_poc  # 顯示詳細錯誤
    exit 1
fi

# 4. 檢查容器映像
print_status "檢查建構的容器映像..."
if docker images sfda-qwen-agent-test | grep -q sfda-qwen-agent-test; then
    print_success "容器映像建立完成"
    docker images sfda-qwen-agent-test
else
    print_error "找不到建構的容器映像"
    exit 1
fi

# 5. 測試容器啟動（乾跑）
print_status "測試容器基本啟動..."
if docker run --rm sfda-qwen-agent-test python -c "import gradio; import qwen_agent; print('Dependencies OK')" > /dev/null 2>&1; then
    print_success "容器依賴檢查通過"
else
    print_error "容器依賴檢查失敗"
    docker run --rm sfda-qwen-agent-test python -c "import gradio; import qwen_agent; print('Dependencies OK')"
    exit 1
fi

# 6. 清理測試映像
print_status "清理測試映像..."
docker rmi sfda-qwen-agent-test > /dev/null 2>&1
print_success "測試映像已清理"

echo ""
print_success "🎉 所有 Docker 建構測試通過！"
echo ""
echo "您可以安全地執行以下命令來部署："
echo "  ./start-qwen-agent-docker.sh"
echo "" 