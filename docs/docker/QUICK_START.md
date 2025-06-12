# 🚀 SFDA Nexus × Qwen-Agent 快速啟動指南

## ⚡ 一分鐘快速啟動

### 1. 啟動服務

```bash
./start-qwen-agent-integrated.sh start -d
```

### 2. 存取界面

- 🤖 **Qwen-Agent UI**: http://localhost:7860
- 🔧 **MCP Server API**: http://localhost:8080

### 3. 健康檢查

```bash
./start-qwen-agent-integrated.sh health
```

## 🎯 核心指令

```bash
# 啟動（背景模式）
./start-qwen-agent-integrated.sh start -d

# 檢查狀態
./start-qwen-agent-integrated.sh status

# 查看日誌
./start-qwen-agent-integrated.sh logs

# 停止服務
./start-qwen-agent-integrated.sh stop

# 完整功能
./start-qwen-agent-integrated.sh --help
```

## 📋 服務組合

### 基礎模式（只有核心服務）

```bash
./start-qwen-agent-integrated.sh start --basic
```

- MCP Server (8080)
- Redis (6379)

### 標準模式（推薦）

```bash
./start-qwen-agent-integrated.sh start
```

- MCP Server (8080)
- Redis (6379)
- Qwen-Agent UI (7860)

### 完整模式（生產環境）

```bash
./start-qwen-agent-integrated.sh start --all
```

- 包含上述所有服務
- Nginx 反向代理 (80/443)
- Prometheus 監控 (9090)
- Grafana 儀表板 (4000)
- PostgreSQL 資料庫 (5432)

## ⚠️ 常見問題

### 端口衝突

```bash
# 檢查端口使用
lsof -i :7860
lsof -i :8080

# 停止衝突進程
kill <PID>
```

### Ollama 連接

```bash
# 檢查 Ollama 服務
curl http://localhost:11434/api/tags

# 下載模型（如需要）
ollama pull qwen2.5:32b
```

### Docker 問題

```bash
# 重新建構
./start-qwen-agent-integrated.sh build

# 清理環境
./start-qwen-agent-integrated.sh clean
```

## 🎉 成功標誌

當您看到以下輸出時，代表部署成功：

```
🎉 所有服務運行正常！
✅ MCP Server: 健康
✅ Qwen-Agent UI: 健康
✅ Redis: 健康
```

現在您可以開始使用 SFDA Nexus × Qwen-Agent 了！ 🏎️
