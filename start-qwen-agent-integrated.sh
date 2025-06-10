#!/bin/bash

# =======================================================
# SFDA Nexus × Qwen-Agent 整合部署管理腳本
# =======================================================

set -e

# 顏色輸出配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 腳本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="sfda-nexus"

# 服務配置
BASIC_SERVICES="mcp-server redis"
QWEN_AGENT_PROFILE="qwen-agent"
NGINX_PROFILE="nginx"
MONITORING_PROFILE="monitoring"
DATABASE_PROFILE="database"

# 預設配置
DEFAULT_PROFILES="qwen-agent"

# 顯示標題
show_header() {
    echo -e "${CYAN}"
    echo "======================================================="
    echo "🏎️  SFDA Nexus × Qwen-Agent 整合部署管理器"
    echo "======================================================="
    echo -e "${NC}"
}

# 顯示使用說明
show_help() {
    echo -e "${BLUE}使用方式:${NC}"
    echo "  $0 [選項] [動作]"
    echo ""
    echo -e "${BLUE}動作:${NC}"
    echo "  start         啟動服務（預設：基礎 + Qwen-Agent）"
    echo "  stop          停止所有服務"
    echo "  restart       重啟服務"
    echo "  status        查看服務狀態"
    echo "  logs          查看服務日誌"
    echo "  clean         清理所有容器和資料卷"
    echo "  build         重新建構映像"
    echo "  health        檢查服務健康狀態"
    echo ""
    echo -e "${BLUE}選項:${NC}"
    echo "  --profiles PROFILES  指定啟動的 profiles（用逗號分隔）"
    echo "  --with-nginx         包含 Nginx 反向代理"
    echo "  --with-monitoring    包含監控服務（Prometheus + Grafana）"
    echo "  --with-database      包含 PostgreSQL 資料庫"
    echo "  --all               啟動所有服務"
    echo "  --basic             只啟動基礎服務（MCP Server + Redis）"
    echo "  --detach, -d        背景執行"
    echo "  --verbose, -v       詳細輸出"
    echo "  --help, -h          顯示此說明"
    echo ""
    echo -e "${BLUE}範例:${NC}"
    echo "  $0 start                          # 啟動基礎 + Qwen-Agent"
    echo "  $0 start --with-nginx            # 啟動 Qwen-Agent + Nginx"
    echo "  $0 start --all                   # 啟動所有服務"
    echo "  $0 start --profiles qwen-agent,monitoring  # 自訂 profiles"
    echo "  $0 logs qwen-agent-ui            # 查看特定服務日誌"
    echo "  $0 health                        # 檢查所有服務健康狀態"
}

# 檢查必要條件
check_prerequisites() {
    echo -e "${YELLOW}📋 檢查部署必要條件...${NC}"
    
    # 檢查 Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安裝${NC}"
        exit 1
    fi
    
    # 檢查 Docker Compose
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安裝或版本過舊${NC}"
        exit 1
    fi
    
    # 檢查 Docker 服務
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker 服務未運行${NC}"
        exit 1
    fi
    
    # 檢查配置文件
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        echo -e "${RED}❌ Docker Compose 配置文件不存在: $DOCKER_COMPOSE_FILE${NC}"
        exit 1
    fi
    
    # 檢查 Ollama 服務（可選）
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        echo -e "${GREEN}✅ Ollama 服務運行中${NC}"
        
        # 檢查 qwen2.5:32b 模型
        if curl -s http://localhost:11434/api/tags | grep -q "qwen2.5:32b"; then
            echo -e "${GREEN}✅ Qwen2.5:32b 模型可用${NC}"
        else
            echo -e "${YELLOW}⚠️  Qwen2.5:32b 模型未找到，請確認模型已下載${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Ollama 服務未運行（localhost:11434）${NC}"
    fi
    
    echo -e "${GREEN}✅ 基本環境檢查完成${NC}"
}

# 建構 Docker Compose 指令
build_compose_command() {
    local action="$1"
    local profiles="$2"
    local extra_args="$3"
    
    local cmd="docker compose"
    
    # 添加 profiles
    if [ -n "$profiles" ]; then
        IFS=',' read -ra PROFILE_ARRAY <<< "$profiles"
        for profile in "${PROFILE_ARRAY[@]}"; do
            cmd="$cmd --profile $profile"
        done
    fi
    
    cmd="$cmd $action $extra_args"
    echo "$cmd"
}

# 啟動服務
start_services() {
    local profiles="$1"
    local extra_args="$2"
    
    echo -e "${BLUE}🚀 啟動 SFDA Nexus × Qwen-Agent 服務...${NC}"
    echo -e "${CYAN}使用 Profiles: $profiles${NC}"
    
    # 建構映像（如果需要）
    echo -e "${YELLOW}📦 檢查並建構 Docker 映像...${NC}"
    local build_cmd=$(build_compose_command "build" "$profiles" "--pull")
    eval $build_cmd
    
    # 啟動服務
    local start_cmd=$(build_compose_command "up" "$profiles" "$extra_args")
    echo -e "${CYAN}執行指令: $start_cmd${NC}"
    eval $start_cmd
    
    if [ "$extra_args" == "-d" ] || [[ "$extra_args" == *"--detach"* ]]; then
        echo ""
        echo -e "${GREEN}🎉 服務啟動完成！${NC}"
        show_access_info
        show_service_status
    fi
}

# 停止服務
stop_services() {
    echo -e "${YELLOW}⏹️  停止所有服務...${NC}"
    docker compose down
    echo -e "${GREEN}✅ 服務已停止${NC}"
}

# 重啟服務
restart_services() {
    local profiles="$1"
    local extra_args="$2"
    
    echo -e "${YELLOW}🔄 重啟服務...${NC}"
    stop_services
    sleep 2
    start_services "$profiles" "$extra_args"
}

# 顯示服務狀態
show_service_status() {
    echo -e "${BLUE}📊 服務狀態:${NC}"
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
}

# 顯示存取資訊
show_access_info() {
    echo -e "${GREEN}🌐 服務存取資訊:${NC}"
    echo -e "${CYAN}┌─────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│  🤖 Qwen-Agent UI:  http://localhost:7860   │${NC}"
    echo -e "${CYAN}│  🔧 MCP Server:     http://localhost:8080   │${NC}"
    echo -e "${CYAN}│  📊 Redis:          localhost:6379          │${NC}"
    echo -e "${CYAN}│  🌐 Nginx:          http://localhost:80     │${NC}"
    echo -e "${CYAN}│  📈 Prometheus:     http://localhost:9090   │${NC}"
    echo -e "${CYAN}│  📊 Grafana:        http://localhost:4000   │${NC}"
    echo -e "${CYAN}│  🗄️  PostgreSQL:     localhost:5432         │${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────────┘${NC}"
}

# 檢查健康狀態
check_health() {
    echo -e "${BLUE}🏥 檢查服務健康狀態...${NC}"
    
    local all_healthy=true
    
    # 檢查 MCP Server
    if curl -s http://localhost:8080/health &> /dev/null; then
        echo -e "${GREEN}✅ MCP Server: 健康${NC}"
    else
        echo -e "${RED}❌ MCP Server: 不健康${NC}"
        all_healthy=false
    fi
    
    # 檢查 Qwen-Agent UI
    if curl -s http://localhost:7860 &> /dev/null; then
        echo -e "${GREEN}✅ Qwen-Agent UI: 健康${NC}"
    else
        echo -e "${RED}❌ Qwen-Agent UI: 不健康${NC}"
        all_healthy=false
    fi
    
    # 檢查 Redis
    if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis: 健康${NC}"
    else
        echo -e "${RED}❌ Redis: 不健康${NC}"
        all_healthy=false
    fi
    
    if $all_healthy; then
        echo -e "${GREEN}🎉 所有服務運行正常！${NC}"
        return 0
    else
        echo -e "${RED}⚠️  某些服務存在問題${NC}"
        return 1
    fi
}

# 查看日誌
show_logs() {
    local service="$1"
    local extra_args="$2"
    
    if [ -n "$service" ]; then
        echo -e "${BLUE}📋 查看 $service 服務日誌...${NC}"
        docker compose logs $extra_args "$service"
    else
        echo -e "${BLUE}📋 查看所有服務日誌...${NC}"
        docker compose logs $extra_args
    fi
}

# 清理環境
clean_environment() {
    echo -e "${YELLOW}🧹 清理 Docker 環境...${NC}"
    
    read -p "⚠️  這將刪除所有容器、映像和資料卷。確定要繼續嗎？ (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}停止並移除所有容器...${NC}"
        docker compose down -v --rmi all --remove-orphans
        
        echo -e "${YELLOW}清理未使用的 Docker 資源...${NC}"
        docker system prune -f
        
        echo -e "${GREEN}✅ 清理完成${NC}"
    else
        echo -e "${BLUE}❌ 取消清理操作${NC}"
    fi
}

# 重新建構映像
build_images() {
    local profiles="$1"
    
    echo -e "${YELLOW}🔨 重新建構 Docker 映像...${NC}"
    local build_cmd=$(build_compose_command "build" "$profiles" "--no-cache --pull")
    eval $build_cmd
    echo -e "${GREEN}✅ 映像建構完成${NC}"
}

# 主函數
main() {
    show_header
    
    # 解析參數
    local action=""
    local profiles="$DEFAULT_PROFILES"
    local extra_args=""
    local detach_mode=""
    local verbose_mode=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            start|stop|restart|status|logs|clean|build|health)
                action="$1"
                shift
                ;;
            --profiles)
                profiles="$2"
                shift 2
                ;;
            --with-nginx)
                profiles="$profiles,$NGINX_PROFILE"
                shift
                ;;
            --with-monitoring)
                profiles="$profiles,$MONITORING_PROFILE"
                shift
                ;;
            --with-database)
                profiles="$profiles,$DATABASE_PROFILE"
                shift
                ;;
            --all)
                profiles="$QWEN_AGENT_PROFILE,$NGINX_PROFILE,$MONITORING_PROFILE,$DATABASE_PROFILE"
                shift
                ;;
            --basic)
                profiles=""
                shift
                ;;
            --detach|-d)
                detach_mode="-d"
                shift
                ;;
            --verbose|-v)
                verbose_mode="-v"
                extra_args="$extra_args -f"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                # 如果是 logs 動作，這可能是服務名稱
                if [ "$action" = "logs" ]; then
                    extra_args="$extra_args $1"
                else
                    echo -e "${RED}❌ 未知選項: $1${NC}"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 如果沒有指定動作，預設為啟動
    if [ -z "$action" ]; then
        action="start"
    fi
    
    # 檢查必要條件
    check_prerequisites
    
    # 執行動作
    case $action in
        start)
            start_services "$profiles" "$detach_mode $extra_args"
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services "$profiles" "$detach_mode $extra_args"
            ;;
        status)
            show_service_status
            ;;
        logs)
            show_logs "$extra_args" "$verbose_mode"
            ;;
        clean)
            clean_environment
            ;;
        build)
            build_images "$profiles"
            ;;
        health)
            check_health
            ;;
        *)
            echo -e "${RED}❌ 未知動作: $action${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 執行主函數
main "$@" 