# 使用 Node.js 18 Alpine 版本作為基礎映像
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 安裝系統依賴套件（包含 curl 用於健康檢查和 SQLite 相關）
RUN apk add --no-cache curl sqlite sqlite-dev python3 make g++

# 複製 package.json 和 package-lock.json
COPY mcp-server/package*.json ./

# 安裝依賴套件
RUN npm ci --only=production

# 複製 MCP Server 源碼
COPY mcp-server/src/ ./src/

# 建立資料和日誌目錄
RUN mkdir -p /app/data /app/logs

# 建立非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# 變更檔案擁有者
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露埠號
EXPOSE 8080

# 設定健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 啟動命令
CMD ["node", "src/index.js"]
