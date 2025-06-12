# 🐳 SFDA Nexus × Qwen-Agent Docker 容器化部署 2025-06-10

## 📖 概述

這是 SFDA Nexus × Qwen-Agent 項目的完整 Docker 容器化解決方案，提供生產就緒的部署架構，包含所有必要的服務和基礎設施。

## 🏗️ 架構概覽

### 服務堆疊

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx 反向代理                        │
│                   (Port 80/443)                        │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
┌────────▼─────────┐ ┌─────▼─────────────┐
│  Qwen-Agent UI   │ │   MCP Server      │
│   (Port 7860)    │ │   (Port 8080)     │
│   Gradio 界面    │ │   工具服務        │
└────────┬─────────┘ └─────┬─────────────┘
         │                 │
         └─────────┬───────┘
                   │
        ┌──────────▼──────────┐
        │       Redis         │
        │   快取 & 會話        │
        │   (Port 6379)       │
        └─────────────────────┘
```

### 外部依賴

- **Ollama qwen3:30b**: localhost:11434 (主機運行)
- **MySQL Database**: 透過 MCP Server 連接

## 🚀 快速開始

### 1. 前置需求

#### 必要軟體

```bash
# Docker & Docker Compose
docker --version    # >= 20.10
docker-compose --version  # >= 1.28

# 系統需求
# - RAM: 至少 8GB (推薦 16GB+)
# - Storage: 至少 10GB 可用空間
# - CPU: 4+ 核心推薦
```

#### 外部服務

```bash
# 1. 啟動 Ollama 服務
ollama serve

# 2. 確認 qwen3:30b 模型已安裝
ollama list | grep qwen3

# 3. 如未安裝，執行：
ollama pull qwen3:30b
```

### 2. 一鍵部署

```bash
# 克隆項目（如果還沒有）
git clone <your-repo-url>
cd sfda_mcpserver

# 使用啟動腳本
./start-qwen-agent-docker.sh

# 或者手動執行
docker-compose -f docker-compose.qwen-agent.yml up -d
```

### 3. 驗證部署

部署完成後，檢查以下端點：

- 🤖 **Qwen-Agent UI**: http://localhost:7860
- 🔧 **MCP Server**: http://localhost:8080
- 🌐 **Nginx 代理**: http://localhost:80
- 📊 **Redis**: localhost:6379

## 📋 詳細配置

### Docker Compose 配置

#### 主要服務

##### 1. Qwen-Agent UI 容器

```yaml
qwen-agent-ui:
  build: ./qwen_agent_poc
  ports: ["7860:7860"]
  environment:
    - MCP_SERVER_URL=http://sfda-mcp-server:8080
    - OLLAMA_BASE_URL=http://host.docker.internal:11434
```

##### 2. MCP Server 容器

```yaml
sfda-mcp-server:
  build: .
  ports: ["8080:8080"]
  environment:
    - NODE_ENV=production
```

##### 3. Redis 快取

```yaml
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]
  command: redis-server --appendonly yes
```

##### 4. Nginx 反向代理

```yaml
nginx:
  image: nginx:alpine
  ports: ["80:80", "443:443"]
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
```

### 環境變數配置

#### Qwen-Agent 相關

```bash
# MCP 連接
MCP_SERVER_URL=http://sfda-mcp-server:8080
OLLAMA_BASE_URL=http://host.docker.internal:11434

# Gradio 配置
GRADIO_SERVER_NAME=0.0.0.0
GRADIO_SERVER_PORT=7860
GRADIO_SHARE=false

# Agent 配置
AGENT_NAME=SFDA智能助理
AGENT_DESCRIPTION=基於Qwen大語言模型的企業級智能助理

# 日誌配置
LOG_LEVEL=INFO
PYTHONUNBUFFERED=1
```

#### MCP Server 相關

```bash
NODE_ENV=production
PORT=8080
LOG_LEVEL=info
```

### 持久化數據

#### 資料卷配置

```yaml
volumes:
  # Qwen-Agent 數據
  qwen_agent_data: {} # 對話歷史和日誌
  qwen_agent_exports: {} # 導出文件

  # MCP Server 數據
  mcp_server_data: {} # 應用數據
  mcp_server_logs: {} # 服務日誌

  # Redis 數據
  redis_data: {} # 快取數據

  # Nginx 日誌
  nginx_logs: {} # 代理日誌
```

## 🔧 管理操作

### 啟動腳本使用

```bash
# 基本啟動
./start-qwen-agent-docker.sh

# 清理後啟動
./start-qwen-agent-docker.sh --clean

# 重啟服務
./start-qwen-agent-docker.sh --restart

# 檢查狀態
./start-qwen-agent-docker.sh --status

# 查看日誌
./start-qwen-agent-docker.sh --logs

# 停止服務
./start-qwen-agent-docker.sh --stop
```

### 手動 Docker Compose 操作

```bash
# 啟動所有服務
docker-compose -f docker-compose.qwen-agent.yml up -d

# 查看服務狀態
docker-compose -f docker-compose.qwen-agent.yml ps

# 查看日誌
docker-compose -f docker-compose.qwen-agent.yml logs -f [service_name]

# 重建並啟動
docker-compose -f docker-compose.qwen-agent.yml up -d --build

# 停止所有服務
docker-compose -f docker-compose.qwen-agent.yml down

# 停止並移除數據卷
docker-compose -f docker-compose.qwen-agent.yml down -v
```

### 個別容器管理

```bash
# 進入容器
docker exec -it sfda-qwen-agent-ui bash
docker exec -it sfda-mcp-server bash
docker exec -it sfda-redis redis-cli

# 查看容器日誌
docker logs sfda-qwen-agent-ui -f
docker logs sfda-mcp-server -f

# 重啟特定容器
docker restart sfda-qwen-agent-ui
```

## 📊 監控和日誌

### 健康檢查

所有服務都配置了健康檢查：

```bash
# 檢查所有服務健康狀態
docker-compose -f docker-compose.qwen-agent.yml ps

# 手動健康檢查
curl http://localhost:7860      # Qwen-Agent UI
curl http://localhost:8080/health  # MCP Server
docker exec sfda-redis redis-cli ping  # Redis
```

### 日誌管理

```bash
# 查看所有服務日誌
docker-compose -f docker-compose.qwen-agent.yml logs -f

# 查看特定服務日誌
docker-compose -f docker-compose.qwen-agent.yml logs -f qwen-agent-ui
docker-compose -f docker-compose.qwen-agent.yml logs -f sfda-mcp-server

# 日誌過濾
docker-compose -f docker-compose.qwen-agent.yml logs -f | grep ERROR
```

### 性能監控

```bash
# 容器資源使用情況
docker stats

# 特定容器資源使用
docker stats sfda-qwen-agent-ui

# 磁盤使用情況
docker system df
```

## 🔒 安全配置

### 網路安全

1. **內部網路隔離**: 服務間透過內部 Docker 網路通信
2. **最小權限原則**: 容器以非 root 用戶運行
3. **端口限制**: 僅曝露必要端口

### Nginx 安全配置

```nginx
# 安全標頭
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy strict-origin-when-cross-origin;
```

### SSL/TLS（生產環境）

```yaml
# docker-compose.yml 中啟用 HTTPS
nginx:
  volumes:
    - ./nginx/ssl:/etc/nginx/ssl:ro
  ports:
    - "443:443"
```

## 🚀 生產環境部署

### 環境準備

1. **服務器規格**

   - CPU: 8+ 核心
   - RAM: 32GB+
   - Storage: 500GB+ SSD
   - Network: 高頻寬連接

2. **域名配置**

   ```bash
   # /etc/hosts 或 DNS 設定
   your-domain.com -> your-server-ip
   qwen-agent.your-domain.com -> your-server-ip
   ```

3. **SSL 憑證**
   ```bash
   # Let's Encrypt 免費憑證
   sudo apt install certbot
   sudo certbot certonly --standalone -d your-domain.com
   ```

### 生產環境配置調整

1. **環境變數**

   ```bash
   # 建立 .env.production 文件
   NODE_ENV=production
   LOG_LEVEL=warn
   GRADIO_SHARE=false
   ```

2. **資源限制**

   ```yaml
   # docker-compose.yml 增加資源限制
   deploy:
     resources:
       limits:
         cpus: "2.0"
         memory: 4G
       reservations:
         cpus: "1.0"
         memory: 2G
   ```

3. **備份策略**
   ```bash
   # 自動備份腳本
   #!/bin/bash
   docker run --rm -v sfda_qwen_agent_data:/data -v $(pwd):/backup ubuntu tar czf /backup/qwen_agent_backup_$(date +%Y%m%d).tar.gz /data
   ```

## 🔧 故障排除

### 常見問題

#### 1. 容器啟動失敗

```bash
# 檢查日誌
docker-compose -f docker-compose.qwen-agent.yml logs

# 檢查資源使用
docker system df
docker stats

# 清理並重建
docker-compose -f docker-compose.qwen-agent.yml down
docker system prune -f
docker-compose -f docker-compose.qwen-agent.yml up -d --build
```

#### 2. 連接問題

```bash
# 檢查網路連通性
docker network ls
docker network inspect sfda-network

# 測試服務連接
docker exec sfda-qwen-agent-ui curl http://sfda-mcp-server:8080/health
```

#### 3. Ollama 連接失敗

```bash
# 檢查 Ollama 服務
curl http://localhost:11434/api/tags

# 確認模型可用
ollama list | grep qwen3

# 重啟 Ollama
brew services restart ollama  # macOS
systemctl restart ollama      # Linux
```

#### 4. 性能問題

```bash
# 增加 Docker 資源限制
# Docker Desktop -> Settings -> Resources

# 清理無用映像
docker system prune -a

# 最佳化啟動順序
docker-compose -f docker-compose.qwen-agent.yml up -d redis
sleep 10
docker-compose -f docker-compose.qwen-agent.yml up -d sfda-mcp-server
sleep 20
docker-compose -f docker-compose.qwen-agent.yml up -d qwen-agent-ui
```

### 除錯技巧

```bash
# 進入容器除錯
docker exec -it sfda-qwen-agent-ui /bin/bash

# 檢查容器內部連接
docker exec sfda-qwen-agent-ui curl http://sfda-mcp-server:8080/health

# 查看詳細啟動日誌
docker-compose -f docker-compose.qwen-agent.yml up --no-daemon

# 重建特定服務
docker-compose -f docker-compose.qwen-agent.yml build --no-cache qwen-agent-ui
```

## 📈 升級和維護

### 版本升級

```bash
# 1. 備份數據
docker run --rm -v sfda_qwen_agent_data:/data -v $(pwd):/backup ubuntu tar czf /backup/backup.tar.gz /data

# 2. 拉取最新代碼
git pull origin main

# 3. 重建並啟動
docker-compose -f docker-compose.qwen-agent.yml down
docker-compose -f docker-compose.qwen-agent.yml build --no-cache
docker-compose -f docker-compose.qwen-agent.yml up -d
```

### 定期維護

```bash
# 每週執行
docker system prune -f                    # 清理無用映像
docker volume prune -f                    # 清理無用卷

# 每月執行
docker-compose -f docker-compose.qwen-agent.yml pull  # 更新基礎映像
docker-compose -f docker-compose.qwen-agent.yml build --no-cache  # 重建映像
```

## 📞 技術支援

### 日誌收集

如需技術支援，請提供以下資訊：

```bash
# 1. 系統資訊
docker version
docker-compose version
./start-qwen-agent-docker.sh --status

# 2. 服務日誌
docker-compose -f docker-compose.qwen-agent.yml logs > logs.txt

# 3. 容器狀態
docker-compose -f docker-compose.qwen-agent.yml ps > status.txt
```

### 聯繫方式

- 技術文檔: 本 README 和相關文檔
- 日誌分析: 使用 `./start-qwen-agent-docker.sh --logs`
- 除錯模式: 使用 `docker-compose up --no-daemon` 查看詳細啟動過程

---

## 🎉 結語

透過這個 Docker 容器化方案，您可以：

1. **一鍵部署** 完整的 SFDA Qwen-Agent 環境
2. **生產就緒** 的高可用性架構
3. **簡化運維** 透過自動化腳本管理
4. **橫向擴展** 支援負載均衡和多實例部署

現在就開始使用 Docker 部署您的 SFDA Nexus × Qwen-Agent 智能助理系統吧！

```bash
./start-qwen-agent-docker.sh
```
