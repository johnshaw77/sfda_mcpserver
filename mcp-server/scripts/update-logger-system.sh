#!/bin/bash
# 日誌系統統一更新腳本

# 備份原始檔案
echo "1. 備份原始日誌檔案..."
timestamp=$(date +%Y%m%d%H%M%S)
cp /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/config/hybrid-logger.js /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/config/hybrid-logger.js.backup-$timestamp
cp /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/config/logger.js /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/config/logger.js.backup-$timestamp

# 複製新版日誌檔案
echo "2. 安裝新版日誌系統..."
mv /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/config/logger.js.new /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/config/logger.js

# 更新引用方式
echo "3. 更新所有引用 hybrid-logger.js 的檔案..."
grep -l "import hybridLogger from" --include="*.js" -r /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src | while read file; do
  sed -i '' 's/import hybridLogger from ".*\/hybrid-logger.js"/import logger from "..\/config\/logger.js"/g' $file
  sed -i '' 's/import hybridLogger from "..\/hybrid-logger.js"/import logger from ".\/logger.js"/g' $file
  sed -i '' 's/import hybridLogger from "..\/..\/config\/hybrid-logger.js"/import logger from "..\/..\/config\/logger.js"/g' $file
  sed -i '' 's/import { HybridLogger } from ".*\/hybrid-logger.js"//g' $file
  # 替換變數名稱
  sed -i '' 's/hybridLogger\./logger\./g' $file
done

echo "4. 修復路徑問題..."
find /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src -type f -name "*.js" -exec sed -i '' 's/import logger from "..\/..\/config\/config\/logger.js"/import logger from "..\/..\/config\/logger.js"/g' {} \;
find /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src -type f -name "*.js" -exec sed -i '' 's/import logger from "..\/..\/..\/config\/logger.js"/import logger from "..\/..\/..\/config\/logger.js"/g' {} \;

# 刪除原始 hybrid-logger.js
echo "5. 完成修改，刪除原始 hybrid-logger.js..."
rm /Users/johnshaw77/Desktop/@Projects/sfda_mcpserver/mcp-server/src/config/hybrid-logger.js

echo "更新完成！所有日誌系統已統一使用 logger.js"
