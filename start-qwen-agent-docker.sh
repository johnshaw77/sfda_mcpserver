#!/bin/bash

# SFDA Nexus × Qwen-Agent Docker 環境啟動腳本

set -e

echo "🐳 SFDA Nexus × Qwen-Agent Docker 環境啟動腳本"
echo "=================================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數定義
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查 Docker 和 Docker Compose
check_docker() {
    print_status "檢查 Docker 環境..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安裝，請先安裝 Docker Compose"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker 服務未運行，請啟動 Docker"
        exit 1
    fi
    
    print_success "Docker 環境檢查通過"
}

# 檢查 Ollama 服務
check_ollama() {
    print_status "檢查 Ollama 服務..."
    
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_success "Ollama 服務正常運行"
        
        # 檢查 qwen3:30b 模型
        if ollama list | grep -q "qwen3:30b"; then
            print_success "qwen3:30b 模型已安裝"
        else
            print_warning "qwen3:30b 模型未安裝"
            echo "可用模型列表:"
            ollama list || echo "無法獲取模型列表"
        fi
    else
        print_warning "Ollama 服務可能未運行 (localhost:11434)"
        print_warning "請確保 Ollama 服務已啟動並且 qwen3:30b 模型已安裝"
    fi
}

# 清理舊容器
cleanup_old_containers() {
    print_status "清理舊容器..."
    
    # 停止相關容器
    docker-compose -f docker-compose.qwen-agent.yml down --remove-orphans 2>/dev/null || true
    
    # 清理無用的映像（可選）
    if [[ "$1" == "--clean" ]]; then
        print_status "清理無用的 Docker 映像..."
        docker system prune -f
    fi
    
    print_success "容器清理完成"
}

# 建立並啟動服務
start_services() {
    print_status "建立並啟動 SFDA Qwen-Agent 服務..."
    
    # 建立映像
    print_status "建立 Docker 映像..."
    docker-compose -f docker-compose.qwen-agent.yml build --no-cache
    
    # 啟動服務
    print_status "啟動服務堆疊..."
    docker-compose -f docker-compose.qwen-agent.yml up -d
    
    print_success "服務啟動完成"
}

# 等待服務就緒
wait_for_services() {
    print_status "等待服務就緒..."
    
    # 等待 MCP Server
    print_status "等待 MCP Server 啟動..."
    timeout=60
    count=0
    while [ $count -lt $timeout ]; do
        if curl -s http://localhost:8080/health &> /dev/null; then
            print_success "MCP Server 已就緒"
            break
        fi
        sleep 2
        count=$((count + 2))
    done
    
    if [ $count -ge $timeout ]; then
        print_warning "MCP Server 啟動超時"
    fi
    
    # 等待 Qwen-Agent UI
    print_status "等待 Qwen-Agent UI 啟動..."
    timeout=90
    count=0
    while [ $count -lt $timeout ]; do
        if curl -s http://localhost:7860 &> /dev/null; then
            print_success "Qwen-Agent UI 已就緒"
            break
        fi
        sleep 3
        count=$((count + 3))
    done
    
    if [ $count -ge $timeout ]; then
        print_warning "Qwen-Agent UI 啟動超時"
    fi
}

# 顯示服務狀態
show_status() {
    print_status "服務狀態檢查..."
    echo ""
    
    docker-compose -f docker-compose.qwen-agent.yml ps
    echo ""
    
    print_status "服務端點:"
    echo "🤖 Qwen-Agent UI:     http://localhost:7860"
    echo "🔧 MCP Server:        http://localhost:8080"
    echo "🌐 Nginx 代理:        http://localhost:80"
    echo "📊 Redis:             localhost:6379"
    echo ""
    
    print_status "健康檢查:"
    
    # MCP Server 健康檢查
    if curl -s http://localhost:8080/health &> /dev/null; then
        print_success "✅ MCP Server 健康"
    else
        print_error "❌ MCP Server 異常"
    fi
    
    # Qwen-Agent UI 健康檢查
    if curl -s http://localhost:7860 &> /dev/null; then
        print_success "✅ Qwen-Agent UI 健康"
    else
        print_error "❌ Qwen-Agent UI 異常"
    fi
    
    # Redis 健康檢查
    if docker exec sfda-redis redis-cli ping &> /dev/null; then
        print_success "✅ Redis 健康"
    else
        print_error "❌ Redis 異常"
    fi
    
    echo ""
    print_success "🎉 SFDA Qwen-Agent Docker 環境已就緒！"
    echo ""
    print_status "使用說明:"
    echo "• 存取 Qwen-Agent UI: http://localhost:7860"
    echo "• 查看日誌: docker-compose -f docker-compose.qwen-agent.yml logs -f"
    echo "• 停止服務: docker-compose -f docker-compose.qwen-agent.yml down"
    echo "• 重啟服務: ./start-qwen-agent-docker.sh --restart"
    echo ""
}

# 顯示幫助資訊
show_help() {
    echo "使用方式: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  --help, -h       顯示此幫助資訊"
    echo "  --clean          清理舊映像和容器"
    echo "  --restart        重啟服務"
    echo "  --stop           停止所有服務"
    echo "  --status         僅顯示服務狀態"
    echo "  --logs           顯示服務日誌"
    echo ""
    echo "範例:"
    echo "  $0                    # 正常啟動"
    echo "  $0 --clean           # 清理後啟動"
    echo "  $0 --restart         # 重啟服務"
    echo "  $0 --status          # 檢查狀態"
    echo ""
}

# 主程式
main() {
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --clean)
            check_docker
            cleanup_old_containers --clean
            check_ollama
            start_services
            wait_for_services
            show_status
            ;;
        --restart)
            check_docker
            cleanup_old_containers
            start_services
            wait_for_services
            show_status
            ;;
        --stop)
            print_status "停止所有服務..."
            docker-compose -f docker-compose.qwen-agent.yml down
            print_success "服務已停止"
            exit 0
            ;;
        --status)
            show_status
            exit 0
            ;;
        --logs)
            docker-compose -f docker-compose.qwen-agent.yml logs -f
            exit 0
            ;;
        "")
            check_docker
            cleanup_old_containers
            check_ollama
            start_services
            wait_for_services
            show_status
            ;;
        *)
            print_error "未知選項: $1"
            show_help
            exit 1
            ;;
    esac
}

# 執行主程式
main "$@" 