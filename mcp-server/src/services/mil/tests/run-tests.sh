#!/bin/bash

# MIL Service 測試快速執行腳本
# 這個腳本提供各種便利的測試執行選項

# 設定顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 進入正確的目錄
cd "$(dirname "$0")"
cd ../../..  # 回到 mcp-server 目錄

echo -e "${BLUE}🧪 MIL Service 測試執行腳本${NC}"
echo "================================="

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安裝，請先安裝 Node.js${NC}"
    exit 1
fi

# 顯示使用說明
show_help() {
    echo -e "${YELLOW}使用方式:${NC}"
    echo "  $0 [選項]"
    echo ""
    echo -e "${YELLOW}選項:${NC}"
    echo "  all              執行所有測試"
    echo "  getMILList       測試 getMILList 功能"
    echo "  getMILDetails    測試 getMILDetails 功能"
    echo "  getStatusReport  測試 getStatusReport 功能"
    echo "  getMILTypeList   測試 getMILTypeList 功能"
    echo "  getCountBy       測試 getCountBy 功能"
    echo "  quick            快速測試（只執行基本功能）"
    echo "  help             顯示此說明"
    echo ""
    echo -e "${YELLOW}範例:${NC}"
    echo "  $0 all"
    echo "  $0 getMILList"
    echo "  $0 quick"
    echo ""
}

# 執行測試的函數
run_test() {
    local test_name=$1
    echo -e "${GREEN}▶ 執行測試: ${test_name}${NC}"
    echo "-----------------------------------"
    
    node src/services/mil/tests/test-runner.js "$test_name"
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ 測試完成: ${test_name}${NC}"
    else
        echo -e "${RED}❌ 測試失敗: ${test_name}${NC}"
    fi
    
    echo ""
    return $exit_code
}

# 快速測試函數
quick_test() {
    echo -e "${YELLOW}🚀 執行快速測試...${NC}"
    echo "================================="
    
    # 只測試最基本的功能
    local tests=("getMILList" "getMILDetails" "getStatusReport")
    local failed=0
    
    for test in "${tests[@]}"; do
        if ! run_test "$test"; then
            ((failed++))
        fi
    done
    
    echo "================================="
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🎉 快速測試全部通過!${NC}"
    else
        echo -e "${RED}❌ ${failed} 個測試失敗${NC}"
    fi
}

# 檢查測試環境
check_environment() {
    echo -e "${BLUE}🔍 檢查測試環境...${NC}"
    
    # 檢查測試目錄是否存在
    if [ ! -d "src/services/mil/tests" ]; then
        echo -e "${RED}❌ 測試目錄不存在: src/services/mil/tests${NC}"
        exit 1
    fi
    
    # 檢查測試執行器是否存在
    if [ ! -f "src/services/mil/tests/test-runner.js" ]; then
        echo -e "${RED}❌ 測試執行器不存在: src/services/mil/tests/test-runner.js${NC}"
        exit 1
    fi
    
    # 檢查 mil-service.js 是否存在
    if [ ! -f "src/services/mil/mil-service.js" ]; then
        echo -e "${RED}❌ MIL 服務檔案不存在: src/services/mil/mil-service.js${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 測試環境檢查通過${NC}"
    echo ""
}

# 主程式
main() {
    # 檢查環境
    check_environment
    
    # 處理參數
    case "$1" in
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        "all")
            run_test "all"
            ;;
        "getMILList"|"getMILDetails"|"getStatusReport"|"getMILTypeList"|"getCountBy")
            run_test "$1"
            ;;
        "quick")
            quick_test
            ;;
        *)
            echo -e "${RED}❌ 未知的選項: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 執行主程式
main "$@"
