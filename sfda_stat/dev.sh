#!/bin/bash

# SFDA 統計學分析 API 開發腳本

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 印出彩色訊息
print_message() {
    echo -e "${BLUE}[SFDA-STAT]${NC} $1"
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

# 檢查是否安裝 uv
check_uv() {
    if ! command -v uv &> /dev/null; then
        print_error "uv 未安裝，請先安裝 uv"
        echo "Windows: powershell -c \"irm https://astral.sh/uv/install.ps1 | iex\""
        echo "macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi
    print_success "uv 已安裝: $(uv --version)"
}

# 建立虛擬環境
setup_env() {
    print_message "建立虛擬環境..."
    
    if [ ! -d ".venv" ]; then
        uv venv
        print_success "虛擬環境建立完成"
    else
        print_warning "虛擬環境已存在"
    fi
    
    print_message "安裝相依套件..."
    uv pip install -e ".[dev,test]"
    print_success "相依套件安裝完成"
}

# 執行測試
run_tests() {
    print_message "執行測試..."
    uv run pytest tests/ -v --cov=app --cov-report=html
    print_success "測試完成，覆蓋率報告已產生在 htmlcov/ 目錄"
}

# 程式碼格式化
format_code() {
    print_message "格式化程式碼..."
    uv run black app/ tests/
    uv run isort app/ tests/
    print_success "程式碼格式化完成"
}

# 程式碼檢查
lint_code() {
    print_message "檢查程式碼品質..."
    uv run flake8 app/ tests/
    uv run mypy app/
    print_success "程式碼檢查完成"
}

# 啟動開發伺服器
start_dev() {
    print_message "啟動開發伺服器..."
    uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

# 啟動生產伺服器
start_prod() {
    print_message "啟動生產伺服器..."
    uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
}

# 清理暫存檔案
clean() {
    print_message "清理暫存檔案..."
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    rm -rf .pytest_cache/ .coverage htmlcov/ dist/ build/ *.egg-info/ 2>/dev/null || true
    print_success "清理完成"
}

# 建置 Docker 映像檔
build_docker() {
    print_message "建置 Docker 映像檔..."
    docker build -t sfda-stat:latest .
    print_success "Docker 映像檔建置完成"
}

# 顯示幫助資訊
show_help() {
    echo "SFDA 統計學分析 API 開發工具"
    echo ""
    echo "使用方式: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  setup     - 建立虛擬環境並安裝相依套件"
    echo "  test      - 執行測試"
    echo "  format    - 格式化程式碼"
    echo "  lint      - 檢查程式碼品質"
    echo "  dev       - 啟動開發伺服器"
    echo "  prod      - 啟動生產伺服器"
    echo "  clean     - 清理暫存檔案"
    echo "  docker    - 建置 Docker 映像檔"
    echo "  help      - 顯示此幫助資訊"
    echo ""
    echo "範例:"
    echo "  $0 setup     # 初始化專案"
    echo "  $0 dev       # 啟動開發伺服器"
    echo "  $0 test      # 執行測試"
}

# 主函數
main() {
    check_uv
    
    case "${1:-help}" in
        setup)
            setup_env
            ;;
        test)
            run_tests
            ;;
        format)
            format_code
            ;;
        lint)
            lint_code
            ;;
        dev)
            start_dev
            ;;
        prod)
            start_prod
            ;;
        clean)
            clean
            ;;
        docker)
            build_docker
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
