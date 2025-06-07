# MCP Server 部署指南

> 企業級 AI + MCP 系統的完整部署指南，涵蓋開發、測試與生產環境的部署流程

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://docker.com/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 📋 目錄

- [環境需求](#環境需求)
- [快速部署](#快速部署)
- [環境配置](#環境配置)
- [部署方式](#部署方式)
- [監控與維護](#監控與維護)
- [故障排除](#故障排除)
- [安全性配置](#安全性配置)
- [備份與還原](#備份與還原)

---

## 🔧 環境需求

### 基礎環境

| 組件         | 版本需求            | 說明                  |
| ------------ | ------------------- | --------------------- |
| **Node.js**  | 18.x 或更高         | JavaScript 運行環境   |
| **npm**      | 9.x 或更高          | 包管理器              |
| **作業系統** | Linux/macOS/Windows | 建議 Ubuntu 22.04 LTS |
| **記憶體**   | 最少 512MB          | 建議 1GB 以上         |
| **磁碟空間** | 最少 1GB            | 包含日誌與快取        |

### 網路需求

- **對外網路**: 下載依賴套件
- **內網存取**: 企業後端 API 系統
- **埠號**: 8080 (可設定)

### 可選組件

- **Docker**: 18.09 或更高 (建議使用)
- **Docker Compose**: 1.25 或更高
- **PM2**: 進程管理器
- **Nginx**: 反向代理伺服器

---

## 🚀 快速部署

### 方式一：使用 Docker Compose (推薦)

```bash
# 1. 克隆專案
git clone <repository-url>
cd sfda_mcpserver

# 2. 設定環境變數
cp .env.example .env
# 編輯 .env 文件

# 3. 使用 Docker Compose 啟動
docker-compose up -d

# 4. 驗證部署
curl http://localhost:8080/health
```

### 方式二：本地安裝

```bash
# 1. 克隆專案
git clone <repository-url>
cd sfda_mcpserver/mcp-server

# 2. 安裝依賴
npm install

# 3. 設定環境變數
cp .env.example .env

# 4. 啟動服務
npm start

# 5. 驗證部署
curl http://localhost:8080/health
```

---

## ⚙️ 環境配置

### 環境變數設定

建立 `.env` 文件並配置以下參數：

```bash
# === MCP Server 基礎配置 ===
MCP_PORT=8080                    # 服務埠號
NODE_ENV=production              # 運行環境 (development/production)

# === 企業系統整合 ===
MAIN_SYSTEM_URL=http://internal-api.company.com/api/mcp
API_TIMEOUT=30000                # API 請求超時 (毫秒)

# === 日誌配置 ===
LOG_LEVEL=info                   # 日誌等級 (debug/info/warn/error)
LOGGING_ENABLED=true             # 是否啟用日誌

# === 安全性配置 ===
DEBUG=false                      # 偵錯模式 (生產環境請設為 false)

# === 效能調優 ===
# MAX_CONNECTIONS=1000           # 最大連接數 (未來使用)
# CACHE_TTL=300                  # 快取存活時間 (未來使用)

# === 資料庫配置 (未來擴展) ===
# DATABASE_URL=postgresql://user:pass@localhost:5432/mcp_db
# REDIS_URL=redis://localhost:6379
```

### 不同環境的配置差異

#### 開發環境 (.env.development)

```bash
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true
MAIN_SYSTEM_URL=http://localhost:3000/api/mcp
```

#### 測試環境 (.env.test)

```bash
NODE_ENV=test
LOG_LEVEL=info
DEBUG=false
MAIN_SYSTEM_URL=http://test-api.company.internal/api/mcp
```

#### 生產環境 (.env.production)

```bash
NODE_ENV=production
LOG_LEVEL=warn
DEBUG=false
MAIN_SYSTEM_URL=https://api.company.com/api/mcp
```

---

## 🐳 部署方式

### Docker 部署 (推薦)

#### 1. 單容器部署

```bash
# 建立映像檔
docker build -t mcp-server:latest .

# 執行容器
docker run -d \
  --name mcp-server \
  --env-file .env \
  -p 8080:8080 \
  --restart unless-stopped \
  mcp-server:latest

# 檢查容器狀態
docker ps
docker logs mcp-server
```

#### 2. Docker Compose 部署

建立 `docker-compose.yml` 文件：

```yaml
version: "3.8"

services:
  mcp-server:
    build: ./mcp-server
    container_name: mcp-server
    restart: unless-stopped
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # 未來可添加其他服務
  # nginx:
  #   image: nginx:alpine
  #   ports:
  #     - "80:80"
  #   volumes:
  #     - ./nginx.conf:/etc/nginx/nginx.conf
  #   depends_on:
  #     - mcp-server

volumes:
  logs:
```

啟動服務：

```bash
docker-compose up -d
docker-compose logs -f
```

### PM2 部署

```bash
# 1. 安裝 PM2
npm install -g pm2

# 2. 建立 PM2 設定檔 (ecosystem.config.js)
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mcp-server',
    script: 'src/server.js',
    cwd: './mcp-server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      MCP_PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# 3. 啟動服務
pm2 start ecosystem.config.js

# 4. 設定開機自啟
pm2 startup
pm2 save

# 5. 監控服務
pm2 monit
```

### 系統服務部署

建立 systemd 服務文件：

```bash
# 建立服務文件
sudo tee /etc/systemd/system/mcp-server.service << 'EOF'
[Unit]
Description=MCP Server
After=network.target

[Service]
Type=simple
User=mcp
WorkingDirectory=/opt/mcp-server
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/mcp-server/.env

[Install]
WantedBy=multi-user.target
EOF

# 重新載入 systemd
sudo systemctl daemon-reload

# 啟動服務
sudo systemctl enable mcp-server
sudo systemctl start mcp-server

# 檢查狀態
sudo systemctl status mcp-server
```

---

## 🔍 監控與維護

### 健康檢查

```bash
# 基礎健康檢查
curl http://localhost:8080/health

# 工具狀態檢查
curl http://localhost:8080/tools

# SSE 連接統計
curl http://localhost:8080/sse/stats
```

預期回應：

```json
{
  "status": "ok",
  "timestamp": "2024-06-07T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "mcp": {
    "protocolVersion": "2024-11-05",
    "initialized": true,
    "connections": 0
  }
}
```

### 日誌管理

#### 日誌位置

- **應用日誌**: `./logs/` 目錄
- **Docker 日誌**: `docker logs mcp-server`
- **PM2 日誌**: `~/.pm2/logs/`

#### 日誌輪轉

```bash
# 使用 logrotate 管理日誌
sudo tee /etc/logrotate.d/mcp-server << 'EOF'
/opt/mcp-server/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 mcp mcp
    postrotate
        systemctl reload mcp-server
    endscript
}
EOF
```

### 效能監控

#### 基礎監控腳本

```bash
#!/bin/bash
# monitor.sh - 簡易監控腳本

ENDPOINT="http://localhost:8080/health"
LOGFILE="/var/log/mcp-server-monitor.log"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    if curl -f -s "$ENDPOINT" > /dev/null; then
        echo "[$TIMESTAMP] OK - MCP Server is healthy" >> "$LOGFILE"
    else
        echo "[$TIMESTAMP] ERROR - MCP Server health check failed" >> "$LOGFILE"
        # 發送告警通知
        # send_alert "MCP Server is down"
    fi

    sleep 60
done
```

---

## 🛠️ 故障排除

### 常見問題與解決方案

#### 1. 服務無法啟動

**問題現象**: 服務啟動失敗或立即退出

**可能原因**:

- 埠號被佔用
- 環境變數配置錯誤
- 依賴套件問題

**解決步驟**:

```bash
# 檢查埠號佔用
sudo lsof -i :8080
sudo netstat -tulpn | grep :8080

# 檢查環境變數
node -e "console.log(process.env)"

# 檢查依賴
npm ls
npm audit

# 查看詳細錯誤
DEBUG=* npm start
```

#### 2. API 請求失敗

**問題現象**: 工具執行回傳 500 錯誤

**可能原因**:

- 企業 API 無法存取
- 網路連線問題
- 認證失敗

**解決步驟**:

```bash
# 測試企業 API 連線
curl -v "$MAIN_SYSTEM_URL"

# 檢查 DNS 解析
nslookup your-api-domain.com

# 檢查防火牆設定
sudo ufw status
```

#### 3. 記憶體洩漏

**問題現象**: 服務記憶體使用量持續增長

**解決步驟**:

```bash
# 監控記憶體使用
top -p $(pgrep node)
ps aux | grep node

# 使用 PM2 設定記憶體限制
pm2 start src/server.js --max-memory-restart 1G

# Node.js 記憶體調優
node --max-old-space-size=1024 src/server.js
```

### 緊急處理流程

1. **服務異常時**:

   ```bash
   # 重新啟動服務
   sudo systemctl restart mcp-server
   # 或
   pm2 restart mcp-server
   # 或
   docker-compose restart mcp-server
   ```

2. **數據備份**:

   ```bash
   # 備份設定檔
   tar -czf backup-$(date +%Y%m%d).tar.gz .env logs/
   ```

3. **版本回滾**:
   ```bash
   # Git 回滾
   git checkout previous-stable-tag
   npm install
   sudo systemctl restart mcp-server
   ```

---

## 🔒 安全性配置

### 網路安全

1. **防火牆設定**

   ```bash
   # 只開放必要埠號
   sudo ufw allow 8080/tcp
   sudo ufw enable
   ```

2. **反向代理 (Nginx)**

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # HTTPS 重導向
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### 應用安全

1. **環境變數保護**

   ```bash
   # 設定檔案權限
   chmod 600 .env
   chown mcp:mcp .env
   ```

2. **使用非 root 使用者**
   ```bash
   # 建立專用使用者
   sudo useradd -r -s /bin/false mcp
   sudo chown -R mcp:mcp /opt/mcp-server
   ```

---

## 💾 備份與還原

### 備份策略

1. **每日備份腳本**

   ```bash
   #!/bin/bash
   # backup.sh

   BACKUP_DIR="/backups/mcp-server"
   DATE=$(date +%Y%m%d-%H%M%S)

   mkdir -p "$BACKUP_DIR"

   # 備份設定檔
   tar -czf "$BACKUP_DIR/config-$DATE.tar.gz" .env

   # 備份日誌 (最近7天)
   find logs/ -name "*.log" -mtime -7 | tar -czf "$BACKUP_DIR/logs-$DATE.tar.gz" -T -

   # 清理舊備份 (保留30天)
   find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
   ```

2. **設定 crontab**
   ```bash
   # 每日凌晨2點執行備份
   0 2 * * * /opt/mcp-server/backup.sh
   ```

### 還原流程

```bash
# 1. 停止服務
sudo systemctl stop mcp-server

# 2. 還原設定檔
tar -xzf backup-20240607.tar.gz

# 3. 重新啟動服務
sudo systemctl start mcp-server

# 4. 驗證還原
curl http://localhost:8080/health
```

---

## 📊 效能調優

### Node.js 調優

```bash
# 設定 Node.js 參數
export NODE_OPTIONS="--max-old-space-size=1024 --optimize-for-size"

# 調整 V8 引擎參數
node --max-old-space-size=1024 \
     --max-new-space-size=256 \
     --max-executable-size=256 \
     src/server.js
```

### 系統調優

```bash
# 調整系統限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 調整 TCP 參數
echo "net.core.somaxconn = 1024" >> /etc/sysctl.conf
sysctl -p
```

---

## 📞 支援與聯絡

### 技術支援

- **開發團隊**: developers@company.com
- **維運團隊**: ops@company.com
- **緊急聯絡**: +886-xxx-xxx-xxx

### 文檔資源

- [開發者指南](developer-guide.md)
- [API 規格文檔](api-spec.md)
- [工具使用指南](hr-tools-guide.md)

---

## 📈 版本資訊

| 版本  | 發佈日期   | 更新內容               |
| ----- | ---------- | ---------------------- |
| 1.0.0 | 2024-06-07 | 初始版本，完整部署指南 |
| 1.1.0 | TBD        | 將加入監控告警功能     |

---

_最後更新: 2024-06-07_
