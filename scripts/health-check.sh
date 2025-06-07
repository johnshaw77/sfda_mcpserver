#!/bin/bash
# Docker 健康檢查腳本 - health-check.sh

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：打印彩色訊息
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️ $message${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ️ $message${NC}"
            ;;
    esac
}

# 函數：檢查 Docker 服務
check_docker_service() {
    print_status "info" "檢查 Docker 服務狀態..."
    
    if docker info > /dev/null 2>&1; then
        print_status "success" "Docker 服務正常運行"
        return 0
    else
        print_status "error" "Docker 服務未運行或無法連接"
        return 1
    fi
}

# 函數：檢查系統資源
check_system_resources() {
    print_status "info" "檢查系統資源..."
    
    echo "📊 Docker 系統資源使用情況："
    docker system df
    
    echo ""
    echo "💾 磁碟空間使用情況："
    df -h /var/lib/docker 2>/dev/null || df -h /
}

# 函數：檢查容器狀態
check_containers() {
    print_status "info" "檢查容器狀態..."
    
    # 檢查運行中的容器
    RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | wc -l | tr -d ' ')
    print_status "info" "運行中的容器數量：$RUNNING_CONTAINERS"
    
    if [ $RUNNING_CONTAINERS -gt 0 ]; then
        echo "📋 運行中的容器："
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
    
    # 檢查停止的容器
    STOPPED_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.Names}}")
    if [ -n "$STOPPED_CONTAINERS" ]; then
        print_status "warning" "發現停止的容器："
        echo "$STOPPED_CONTAINERS"
    else
        print_status "success" "沒有停止的容器"
    fi
}

# 函數：檢查網路
check_networks() {
    print_status "info" "檢查 Docker 網路..."
    
    echo "🌐 Docker 網路列表："
    docker network ls
}

# 函數：檢查映像檔
check_images() {
    print_status "info" "檢查映像檔..."
    
    TOTAL_IMAGES=$(docker images -q | wc -l | tr -d ' ')
    print_status "info" "映像檔總數：$TOTAL_IMAGES"
    
    echo "📦 映像檔大小統計："
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -10
}

# 函數：檢查容器健康狀態
check_container_health() {
    local container_name=$1
    
    if [ -z "$container_name" ]; then
        print_status "info" "檢查所有容器的健康狀態..."
        for container in $(docker ps --format "{{.Names}}"); do
            check_single_container_health "$container"
        done
    else
        check_single_container_health "$container_name"
    fi
}

# 函數：檢查單一容器健康狀態
check_single_container_health() {
    local container_name=$1
    
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        print_status "error" "容器 $container_name 未運行"
        return 1
    fi
    
    # 檢查容器狀態
    local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
    local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)
    
    echo "🔍 容器 $container_name 狀態：$status"
    
    if [ "$health" != "<no value>" ] && [ -n "$health" ]; then
        case $health in
            "healthy")
                print_status "success" "容器 $container_name 健康狀態良好"
                ;;
            "unhealthy")
                print_status "error" "容器 $container_name 健康狀態不良"
                echo "📝 最近的健康檢查日誌："
                docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "$container_name" | tail -3
                ;;
            "starting")
                print_status "warning" "容器 $container_name 正在啟動中"
                ;;
        esac
    else
        print_status "info" "容器 $container_name 沒有設定健康檢查"
    fi
    
    # 顯示資源使用情況
    echo "📊 資源使用情況："
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" "$container_name"
}

# 函數：清理 Docker 資源
cleanup_docker() {
    print_status "info" "清理 Docker 資源..."
    
    echo "🗑️ 清理停止的容器..."
    docker container prune -f
    
    echo "🗑️ 清理未使用的映像檔..."
    docker image prune -f
    
    echo "🗑️ 清理未使用的網路..."
    docker network prune -f
    
    echo "🗑️ 清理未使用的卷..."
    docker volume prune -f
    
    print_status "success" "清理完成"
}

# 函數：顯示幫助資訊
show_help() {
    echo "使用方式: $0 [選項] [容器名稱]"
    echo ""
    echo "選項："
    echo "  -h, --help     顯示此幫助訊息"
    echo "  -a, --all      執行完整的健康檢查（預設）"
    echo "  -c, --container [名稱]  檢查特定容器"
    echo "  -s, --system   只檢查系統狀態"
    echo "  --cleanup      清理未使用的 Docker 資源"
    echo ""
    echo "範例："
    echo "  $0                     # 執行完整檢查"
    echo "  $0 -c mysql-server     # 檢查特定容器"
    echo "  $0 --cleanup           # 清理 Docker 資源"
}

# 主要執行邏輯
main() {
    local option=""
    local container_name=""
    
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--container)
            option="container"
            container_name="$2"
            ;;
        -s|--system)
            option="system"
            ;;
        --cleanup)
            option="cleanup"
            ;;
        -a|--all|"")
            option="all"
            ;;
        *)
            print_status "error" "未知選項：$1"
            show_help
            exit 1
            ;;
    esac
    
    echo "🔍 Docker 健康檢查開始..."
    echo "=============================="
    
    # 檢查 Docker 服務
    if ! check_docker_service; then
        exit 1
    fi
    
    case $option in
        "container")
            if [ -z "$container_name" ]; then
                print_status "error" "請指定容器名稱"
                exit 1
            fi
            check_container_health "$container_name"
            ;;
        "system")
            check_system_resources
            check_networks
            check_images
            ;;
        "cleanup")
            cleanup_docker
            ;;
        "all"|*)
            check_system_resources
            echo ""
            check_containers
            echo ""
            check_networks
            echo ""
            check_images
            echo ""
            check_container_health
            ;;
    esac
    
    echo ""
    echo "=============================="
    print_status "success" "Docker 健康檢查完成"
}

# 執行主函數
main "$@"
