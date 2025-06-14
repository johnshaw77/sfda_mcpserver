#!/bin/bash

# 此腳本用於測試日誌系統整合後的功能

echo "執行日誌系統整合測試..."
cd /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server

# 運行測試腳本
node test-logger-integration.js

# 檢查退出狀態
if [ $? -eq 0 ]; then
  echo "✅ 測試成功完成"
else
  echo "❌ 測試失敗"
  exit 1
fi

# 檢查日誌文件
echo ""
echo "檢查日誌文件..."
if [ -f ./logs/combined.log ]; then
  echo "✅ combined.log 存在"
  echo "最後 5 行內容:"
  tail -n 5 ./logs/combined.log
else
  echo "❌ combined.log 不存在"
fi

if [ -f ./logs/error.log ]; then
  echo "✅ error.log 存在"
  echo "最後 5 行內容:"
  tail -n 5 ./logs/error.log
else
  echo "❌ error.log 不存在"
fi

if [ -f ./logs/tool-calls.log ]; then
  echo "✅ tool-calls.log 存在"
  echo "最後 5 行內容:"
  tail -n 5 ./logs/tool-calls.log
else
  echo "❌ tool-calls.log 不存在"
fi

# 如果啟用了資料庫，檢查資料庫文件
if [ -f ./logs/logs.db ]; then
  echo "✅ logs.db 存在"
  echo "資料庫大小: $(du -h ./logs/logs.db | cut -f1)"
  
  # 如果安裝了 sqlite3 命令行工具，可以顯示一些統計信息
  if command -v sqlite3 &> /dev/null; then
    echo "日誌數量: $(sqlite3 ./logs/logs.db 'SELECT COUNT(*) FROM logs')"
    echo "日誌等級分佈:"
    sqlite3 ./logs/logs.db 'SELECT level, COUNT(*) FROM logs GROUP BY level'
  else
    echo "未找到 sqlite3 命令行工具，跳過資料庫查詢"
  fi
else
  echo "資料庫日誌未啟用或 logs.db 不存在"
fi

echo ""
echo "日誌系統整合測試完成"
