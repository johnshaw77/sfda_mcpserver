# MCP Server Docker 部署操作指南

## 📋 概述

本指南將協助您在任何具備 Docker 環境的機器上部署和執行 MCP Server 專案。無論是開發環境、測試環境還是生產環境，都可以透過此指南快速完成部署。

## 🔧 前置需求

### 系統需求
- **作業系統**: Linux、macOS 或 Windows
- **CPU**: 2 核心以上
- **記憶體**: 至少 4GB RAM
- **硬碟空間**: 至少 10GB 可用空間

### 必要軟體
1. **Docker Engine** (版本 20.10 或更新)
2. **Docker Compose** (版本 2.0 或更新)

#### 安裝 Docker (Ubuntu/CentOS)
```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

#### 安裝 Docker (macOS)
```bash
# 使用 Homebrew
brew install --cask docker

# 或從官網下載 Docker Desktop
# https://www.docker.com/products/docker-desktop
```

#### 安裝 Docker (Windows)
下載並安裝 Docker Desktop：https://www.docker.com/products/docker-desktop

## 📦 專案部署步驟

### 第一步：取得專案代碼

#### 方式一：Git Clone (推薦)
```bash
git clone <your-repository-url>
cd sfda_mcpserver
```

#### 方式二：檔案複製
將整個 `sfda_mcpserver` 資料夾複製到目標機器上。

### 第二步：環境配置

#### 1. 複製環境變數檔案
```bash
# 複製主要環境變數檔案
cp .env.example .env

# 複製 MCP Server 環境變數檔案
cp mcp-server/.env.example mcp-server/.env
```

#### 2. 編輯環境變數
編輯 `.env` 檔案：
```bash
nano .env
```

基本配置項目：
```env
# 基礎配置
MCP_PORT=8080
NODE_ENV=production

# 資料庫配置 (如果使用)
DB_NAME=mcp_db
DB_USER=mcp_user
DB_PASSWORD=your_secure_password

# Grafana 密碼 (如果使用監控)
GRAFANA_PASSWORD=your_grafana_password
```

編輯 `mcp-server/.env` 檔案：
```bash
nano mcp-server/.env
```

重要配置項目：
```env
MCP_PORT=8080
NODE_ENV=production
SERVER_HOST=0.0.0.0
TZ=Asia/Taipei

# 主系統 API 配置
MAIN_SYSTEM_URL=http://your-main-system:3000/api/mcp
API_TIMEOUT=30000

# 日誌配置
LOG_LEVEL=info
LOGGING_ENABLED=true
LOG_DIR=./logs
```

### 第三步：建立必要目錄
```bash
# 建立日誌目錄
mkdir -p logs

# 建立 SSL 憑證目錄 (如果使用 HTTPS)
mkdir -p nginx/ssl

# 設定權限
chmod 755 logs
```

## 🚀 部署執行

### 基礎部署 (僅 MCP Server)
```bash
# 建置並啟動服務
docker-compose up -d mcp-server

# 檢查服務狀態
docker-compose ps

# 查看服務日誌
docker-compose logs -f mcp-server
```

### 完整部署 (包含 Nginx、監控等)
```bash
# 啟動所有服務
docker-compose --profile nginx --profile monitoring up -d

# 或啟動特定服務組合
docker-compose --profile nginx up -d        # 僅啟動 Nginx
docker-compose --profile monitoring up -d   # 僅啟動監控
docker-compose --profile database up -d     # 僅啟動資料庫
```

### 演示環境部署
```bash
# 使用演示環境配置
docker-compose -f docker-compose.demo.yml up -d

# 查看演示環境狀態
docker-compose -f docker-compose.demo.yml ps
```

## 🔍 服務驗證

### 檢查服務狀態
```bash
# 查看所有容器狀態
docker-compose ps

# 查看容器詳細資訊
docker-compose logs mcp-server

# 檢查健康狀態
docker-compose exec mcp-server curl -f http://localhost:8080/health
```

### 測試 API 端點
```bash
# 基礎健康檢查
curl http://localhost:8080/health

# 取得服務資訊
curl http://localhost:8080/info

# 測試工具列表
curl http://localhost:8080/tools
```

### 查看服務 URL
- **MCP Server**: http://localhost:8080
- **Nginx** (如啟用): http://localhost:80
- **Grafana** (如啟用): http://localhost:4000
- **Prometheus** (如啟用): http://localhost:9090

## 📊 監控與日誌

### 查看即時日誌
```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f mcp-server

# 查看最近 100 行日誌
docker-compose logs --tail=100 mcp-server
```

### 查看系統資源使用
```bash
# 查看容器資源使用情況
docker stats

# 查看磁碟使用
docker system df
```

### 進入容器內部除錯
```bash
# 進入 MCP Server 容器
docker-compose exec mcp-server /bin/bash

# 或使用 sh (Alpine Linux)
docker-compose exec mcp-server /bin/sh
```

## 🔧 維護操作

### 更新專案代碼
```bash
# 拉取最新代碼
git pull origin main

# 重新建置並重啟服務
docker-compose down
docker-compose up -d --build
```

### 重啟服務
```bash
# 重啟所有服務
docker-compose restart

# 重啟特定服務
docker-compose restart mcp-server
```

### 停止和清理
```bash
# 停止所有服務
docker-compose down

# 停止服務並刪除磁碟區
docker-compose down -v

# 清理未使用的 Docker 資源
docker system prune -f
```

### 備份重要資料
```bash
# 備份日誌
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# 備份資料庫 (如果使用 PostgreSQL)
docker-compose exec postgres pg_dump -U mcp_user mcp_db > backup.sql
```

## 🚨 故障排除

### 常見問題

#### 1. 容器無法啟動
```bash
# 檢查容器日誌
docker-compose logs mcp-server

# 檢查埠號是否被佔用
netstat -tlnp | grep 8080

# 檢查 Docker 服務狀態
sudo systemctl status docker
```

#### 2. 記憶體不足
```bash
# 檢查系統記憶體
free -h

# 調整 Docker Compose 資源限制
# 編輯 docker-compose.yml 中的 deploy.resources 設定
```

#### 3. 磁碟空間不足
```bash
# 清理 Docker 映像和容器
docker system prune -a

# 清理舊日誌
find logs/ -name "*.log" -mtime +7 -delete
```

#### 4. 網路連線問題
```bash
# 檢查防火牆設定
sudo ufw status

# 檢查 Docker 網路
docker network ls
docker network inspect mcp-network
```

### 除錯工具

#### 即時監控指令
```bash
# 監控容器狀態
watch docker-compose ps

# 監控資源使用
watch docker stats

# 監控日誌
tail -f logs/*.log
```

## 🔒 安全性建議

### 生產環境配置
1. **修改預設密碼**: 確保所有服務的預設密碼都已更改
2. **設定防火牆**: 只開放必要的埠號 (80, 443, 8080)
3. **使用 HTTPS**: 設定 SSL 憑證
4. **限制存取**: 使用 IP 白名單或 VPN
5. **定期更新**: 保持 Docker 映像和系統套件為最新版本

### SSL 憑證設定
```bash
# 建立自簽憑證 (測試用)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/server.key \
  -out nginx/ssl/server.crt

# 或使用 Let's Encrypt (生產環境)
# 請參考 nginx/ssl/README.md
```

## 📞 技術支援

### 取得協助
- 查看專案 README.md
- 檢查 docs/ 目錄下的其他文件
- 查看 logs/ 目錄中的錯誤日誌
- 建立 GitHub Issue 回報問題

### 系統資訊收集
如需技術支援，請提供以下資訊：
```bash
# 系統資訊
uname -a
docker --version
docker-compose --version

# 容器狀態
docker-compose ps
docker-compose logs --tail=50 mcp-server
```

---

**注意**: 本指南假設您已具備基本的 Linux/Docker 操作知識。如需更詳細的 Docker 教學，請參考 [Docker 官方文件](https://docs.docker.com/)。
