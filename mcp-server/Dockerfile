# 使用 Node.js 18 Alpine 版本作為基礎映像
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝系統依賴套件（包含 curl 用於健康檢查）
RUN apk add --no-cache curl

# 安裝依賴套件
RUN npm ci --only=production

# 複製應用程式源碼
COPY src/ ./src/

# 建立日誌和資料目錄
RUN mkdir -p /app/data /app/logs

# 建立非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 變更檔案擁有者
RUN chown -R nextjs:nodejs /app

# 切換到非 root 用戶
USER nextjs

# 暴露埠號
EXPOSE 8080

# 設定健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 啟動應用程式
CMD ["node", "src/server.js"]
