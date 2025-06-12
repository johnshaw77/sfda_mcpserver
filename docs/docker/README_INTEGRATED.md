# SFDA Nexus × Qwen-Agent 整合部署指南 0610 2025

> 🏎️ 企業級 AI 助理 × MCP 服務器的統一容器化部署方案

## 📋 概覽

本專案整合了：

- **SFDA MCP Server**: 企業級 MCP 服務器（HR、財務、任務管理工具）
- **Qwen-Agent UI**: 基於 Qwen 大語言模型的智能對話界面
- **企業級基礎設施**: Redis、PostgreSQL、Nginx、監控系統

通過統一的 Docker Compose 配置，提供從開發到生產的完整部署解決方案。

## 🏗️ 架構設計

### 服務組件

```
┌─────────────────────────────────────────────────────────┐
│                    SFDA Nexus 生態系統                    │
├─────────────────────────────────────────────────────────┤
│  🤖 Qwen-Agent UI     │  🔧 MCP Server                   │
│  (Gradio Interface)   │  (Enterprise Tools)             │
├─────────────────────────────────────────────────────────┤
│  🌐 Nginx             │  📊 Redis Cache                  │
│  (Reverse Proxy)      │  (Session Storage)              │
├─────────────────────────────────────────────────────────┤
│  🗄️ PostgreSQL        │  📈 Monitoring                   │
│  (Database)           │  (Prometheus + Grafana)         │
└─────────────────────────────────────────────────────────┘
```

### Profile 管理

- **基礎服務**: `mcp-server` + `redis` (預設啟動)
- **qwen-agent**: Qwen-Agent Gradio UI
- **nginx**: Nginx 反向代理
- **monitoring**: Prometheus + Grafana 監控
- **database**: PostgreSQL 資料庫

## 🚀 快速開始

### 1. 環境準備

```bash
# 檢查 Docker 環境
docker --version
docker compose version

# 確保 Ollama 服務運行中（可選）
curl http://localhost:11434/api/tags
```

### 2. 一鍵部署

```bash
# 啟動基礎 + Qwen-Agent 服務
./start-qwen-agent-integrated.sh start

# 背景執行
./start-qwen-agent-integrated.sh start -d

# 查看所有選項
./start-qwen-agent-integrated.sh --help
```

### 3. 存取服務

- 🤖 **Qwen-Agent UI**: http://localhost:7860
- 🔧 **MCP Server API**: http://localhost:8080
- 📊 **Redis**: localhost:6379

## 📊 部署選項

### 基礎部署

```bash
# 只啟動核心服務（MCP Server + Redis）
./start-qwen-agent-integrated.sh start --basic
```

### 標準部署

```bash
# Qwen-Agent + MCP Server + Redis（預設）
./start-qwen-agent-integrated.sh start
```

### 完整部署

```bash
# 啟動所有服務
./start-qwen-agent-integrated.sh start --all

# 或自訂組合
./start-qwen-agent-integrated.sh start --with-nginx --with-monitoring
```

### 自訂 Profiles

```bash
# 指定特定的 profiles
./start-qwen-agent-integrated.sh start --profiles qwen-agent,monitoring
```

## 🔧 管理操作

### 服務管理

```bash
# 查看服務狀態
./start-qwen-agent-integrated.sh status

# 檢查健康狀態
./start-qwen-agent-integrated.sh health

# 重啟服務
./start-qwen-agent-integrated.sh restart

# 停止服務
./start-qwen-agent-integrated.sh stop
```

### 日誌管理

```bash
# 查看所有服務日誌
./start-qwen-agent-integrated.sh logs

# 查看特定服務日誌
./start-qwen-agent-integrated.sh logs qwen-agent-ui
./start-qwen-agent-integrated.sh logs mcp-server

# 即時日誌追蹤
./start-qwen-agent-integrated.sh logs -f
```

### 維護操作

```bash
# 重新建構映像
./start-qwen-agent-integrated.sh build

# 清理環境（慎用）
./start-qwen-agent-integrated.sh clean
```

## 🔧 配置管理

### 環境變數

主要環境變數可透過 `.env` 文件配置：

```bash
# MCP Server 配置
MCP_PORT=8080
NODE_ENV=production

# 資料庫配置
DB_NAME=mcp_db
DB_USER=mcp_user
DB_PASSWORD=mcp_password

# 監控配置
GRAFANA_PASSWORD=admin123

# Qwen-Agent 配置
OLLAMA_BASE_URL=http://host.docker.internal:11434
AGENT_NAME=SFDA智能助理
```

### 服務端點

| 服務          | 預設端口 | 外部存取 | 說明                |
| ------------- | -------- | -------- | ------------------- |
| Qwen-Agent UI | 7860     | ✅       | Gradio 智能對話界面 |
| MCP Server    | 8080     | ✅       | 企業工具 API        |
| Redis         | 6379     | ✅       | 快取服務            |
| Nginx         | 80/443   | ✅       | 反向代理（可選）    |
| Prometheus    | 9090     | ✅       | 監控數據（可選）    |
| Grafana       | 4000     | ✅       | 監控儀表板（可選）  |
| PostgreSQL    | 5432     | ✅       | 資料庫服務（可選）  |

## 🏥 健康檢查

腳本提供完整的健康檢查功能：

```bash
./start-qwen-agent-integrated.sh health
```

檢查項目：

- ✅ MCP Server API 回應
- ✅ Qwen-Agent UI 可用性
- ✅ Redis 連接狀態
- ✅ Ollama 模型狀態（可選）

## 🔍 故障排除

### 常見問題

1. **端口衝突**

   ```bash
   # 檢查端口使用情況
   lsof -i :7860
   lsof -i :8080

   # 停止衝突服務或修改端口配置
   ```

2. **Ollama 連接失敗**

   ```bash
   # 檢查 Ollama 服務
   curl http://localhost:11434/api/tags

   # 確認模型已下載
   ollama list
   ```

3. **Docker 資源不足**

   ```bash
   # 清理未使用資源
   docker system prune -f

   # 檢查資源使用
   docker stats
   ```

### 日誌分析

```bash
# 查看啟動錯誤
./start-qwen-agent-integrated.sh logs qwen-agent-ui | grep ERROR

# 查看 MCP Server 狀態
./start-qwen-agent-integrated.sh logs mcp-server | grep health
```

## 🔄 從舊配置遷移

如果您之前使用 `docker-compose.qwen-agent.yml`：

```bash
# 停止舊服務
docker compose -f docker-compose.qwen-agent.yml down

# 使用新的整合配置
./start-qwen-agent-integrated.sh start
```

## 🚀 生產環境部署

### 安全配置

1. **更改預設密碼**

   ```bash
   # 更新 .env 文件中的密碼
   GRAFANA_PASSWORD=your_secure_password
   DB_PASSWORD=your_secure_db_password
   ```

2. **設置 SSL 憑證**

   ```bash
   # 放置 SSL 憑證到 nginx/ssl/
   cp your_cert.pem nginx/ssl/
   cp your_key.pem nginx/ssl/
   ```

3. **網路安全**
   ```bash
   # 僅啟動必要服務
   ./start-qwen-agent-integrated.sh start --with-nginx
   ```

### 效能優化

```bash
# 資源限制已在 docker-compose.yml 中配置
# 可根據需要調整 CPU 和記憶體限制
```

## 📈 監控和維護

### 啟用監控

```bash
# 啟動監控堆疊
./start-qwen-agent-integrated.sh start --with-monitoring

# 存取監控儀表板
# Prometheus: http://localhost:9090
# Grafana: http://localhost:4000 (admin/your_password)
```

### 定期維護

```bash
# 每週執行
./start-qwen-agent-integrated.sh health
docker system prune -f

# 每月執行
./start-qwen-agent-integrated.sh build
```

## 🤝 技術支援

- **項目首頁**: [SFDA Nexus](https://github.com/your-org/sfda-nexus)
- **問題回報**: [GitHub Issues](https://github.com/your-org/sfda-nexus/issues)
- **文檔**: 查看 `docs/` 目錄下的詳細文檔

## 📝 更新日誌

### v2.0.0 - 整合版本

- 🎉 統一 Docker Compose 配置
- ✨ 新增 Profile 管理機制
- 🔧 改進的管理腳本
- 📊 完整的健康檢查
- 🏗️ 生產就緒的配置

### v1.0.0 - 初始版本

- 基礎 Qwen-Agent UI
- 獨立 Docker 配置
- 基本管理功能
