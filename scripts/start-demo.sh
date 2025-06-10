#!/bin/bash

# ================================================================
# MCP Server 演示環境啟動腳本
# ================================================================

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查 Docker 是否運行
check_docker() {
    log_info "檢查 Docker 服務狀態..."
    if ! docker --version &> /dev/null; then
        log_error "Docker 未安裝或未啟動"
        exit 1
    fi
    
    if ! docker-compose --version &> /dev/null; then
        log_error "Docker Compose 未安裝"
        exit 1
    fi
    
    log_success "Docker 服務正常"
}

# 檢查埠號是否被佔用
check_ports() {
    log_info "檢查必要埠號是否可用..."
    
    ports=(8080 4000 9090 9100 6379)
    for port in "${ports[@]}"; do
        if lsof -i :$port &> /dev/null; then
            log_warning "埠號 $port 已被佔用"
            read -p "是否要繼續？ (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    done
    
    log_success "埠號檢查完成"
}

# 設定環境變數
setup_environment() {
    log_info "設定演示環境變數..."
    
    if [ ! -f .env.demo ]; then
        if [ -f mcp-server/.env.example ]; then
            cp mcp-server/.env.example .env.demo
            log_success "已建立 .env.demo 檔案"
        else
            log_error ".env.example 檔案不存在"
            exit 1
        fi
    fi
    
    # 設定演示模式專用變數
    cat >> .env.demo << EOF

# 演示環境專用設定
NODE_ENV=demo
DEMO_MODE=true
LOG_LEVEL=debug
METRICS_ENABLED=true
SSE_ENABLED=true
EOF
    
    log_success "環境變數設定完成"
}

# 建立必要目錄
create_directories() {
    log_info "建立必要目錄..."
    
    directories=(
        "demo-data"
        "logs"
        "monitoring"
        "nginx"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "已建立目錄: $dir"
        fi
    done
    
    log_success "目錄建立完成"
}

# 啟動演示環境
start_demo() {
    log_info "啟動 MCP Server 演示環境..."
    
    # 建構和啟動服務
    docker-compose -f docker-compose.demo.yml up -d --build
    
    log_info "等待服務啟動..."
    sleep 10
    
    # 檢查服務狀態
    log_info "檢查服務狀態..."
    docker-compose -f docker-compose.demo.yml ps
    
    log_success "演示環境啟動完成！"
}

# 顯示服務資訊
show_services() {
    echo
    log_info "演示環境服務資訊："
    echo "=================================="
    echo "🚀 MCP Server:     http://localhost:8080"
    echo "📊 Grafana:        http://localhost:4000 (admin/demo123)"
    echo "🔍 Prometheus:     http://localhost:9090"
    echo "📈 Node Exporter:  http://localhost:9100"
    echo "🗄️  Redis:          localhost:6379"
    echo "=================================="
    echo
    
    echo "📋 快速測試指令："
    echo "curl http://localhost:8080/health"
    echo "curl http://localhost:8080/tools"
    echo "curl -N http://localhost:8080/sse"
    echo
}

# 健康檢查
health_check() {
    log_info "執行健康檢查..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8080/health > /dev/null; then
            log_success "MCP Server 健康檢查通過"
            break
        fi
        
        log_info "等待 MCP Server 啟動... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "MCP Server 健康檢查失敗"
        return 1
    fi
}

# 主函數
main() {
    echo "================================================================"
    echo "🎯 MCP Server 演示環境啟動程序"
    echo "================================================================"
    echo
    
    check_docker
    check_ports
    setup_environment
    create_directories
    start_demo
    
    if health_check; then
        show_services
        log_success "演示環境已成功啟動並通過健康檢查！"
    else
        log_error "演示環境啟動失敗，請檢查日誌"
        docker-compose -f docker-compose.demo.yml logs --tail=50
        exit 1
    fi
}

# 清理函數
cleanup() {
    log_info "停止演示環境..."
    docker-compose -f docker-compose.demo.yml down
    log_success "演示環境已停止"
}

# 處理中斷信號
trap cleanup EXIT

# 解析命令列參數
case "${1:-start}" in
    start)
        main
        ;;
    stop)
        cleanup
        ;;
    restart)
        cleanup
        sleep 3
        main
        ;;
    logs)
        docker-compose -f docker-compose.demo.yml logs -f
        ;;
    status)
        docker-compose -f docker-compose.demo.yml ps
        ;;
    health)
        health_check
        ;;
    build)
        log_info "重新建構映像..."
        docker-compose -f docker-compose.demo.yml build --no-cache
        ;;
    reset)
        log_info "重置演示環境..."
        cleanup
        docker-compose -f docker-compose.demo.yml down -v --remove-orphans
        docker system prune -f
        log_success "環境已重置"
        ;;
    test)
        if health_check; then
            log_info "執行基本功能測試..."
            echo
            echo "🧪 測試健康檢查..."
            curl -s http://localhost:8080/health | jq || echo "健康檢查失敗"
            echo
            echo "🧪 測試工具列表..."
            curl -s http://localhost:8080/tools | jq '.tools | length' || echo "工具列表測試失敗"
            echo
            echo "🧪 測試員工查詢..."
            curl -s -X POST http://localhost:8080/tools/get_employee_info \
              -H "Content-Type: application/json" \
              -d '{"employee_id": "EMP001"}' | jq '.name' || echo "員工查詢測試失敗"
            echo
            log_success "基本功能測試完成"
        else
            log_error "服務未啟動，無法執行測試"
        fi
        ;;
    *)
        echo "用法: $0 {start|stop|restart|logs|status|health|build|reset|test}"
        echo
        echo "  start   - 啟動演示環境 (預設)"
        echo "  stop    - 停止演示環境"
        echo "  restart - 重啟演示環境"
        echo "  logs    - 查看即時日誌"
        echo "  status  - 查看服務狀態"
        echo "  health  - 執行健康檢查"
        echo "  build   - 重新建構映像"
        echo "  reset   - 重置演示環境"
        echo "  test    - 執行基本功能測試"
        exit 1
        ;;
esac
