# Docker 運行狀態測試完整指南

## 目錄

- [基本 Docker 狀態檢查](#基本-docker-狀態檢查)
- [容器運行測試](#容器運行測試)
- [映像檔管理](#映像檔管理)
- [網路連線測試](#網路連線測試)
- [健康檢查監控](#健康檢查監控)
- [日誌分析](#日誌分析)
- [效能監控](#效能監控)
- [故障排除](#故障排除)
- [MCP Server 專用測試](#mcp-server-專用測試)

## 基本 Docker 狀態檢查

- MCP Server: ✅ 健康 (端口 8080)
- Nginx: ✅ 運行中 (端口 80, 443)
- Prometheus: ✅ 運行中 (端口 9090)
- Grafana: ✅ 運行中 (端口 3000)
- Redis: ✅ 健康 (端口 6379)
- cAdvisor: ✅ 健康 (端口 8081)
- Node Exporter: ✅ 運行中 (端口 9100)
- Demo Data Generator: ✅ 健康
  🌐 可用的服務端點：
- HTTP: http://localhost:80/health ✅
- HTTPS: https://localhost:443/health ✅ (自簽憑證)
- MCP Server: http://localhost:8080/health ✅
- Prometheus: http://localhost:9090/health ✅
- Grafana: http://localhost:3000/health ✅

### 1. Docker 服務狀態

```bash
# 檢查 Docker 版本
docker --version

# 檢查 Docker Compose 版本
docker compose --version

# 檢查 Docker 系統資訊
docker system info

# 檢查 Docker 服務是否運行
docker system df
```

### 2. 查看所有容器狀態

```bash
# 查看運行中的容器
docker ps

# 查看所有容器（包含停止的）
docker ps -a

# 以表格格式顯示容器狀態
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"

# 只顯示容器 ID
docker ps -q
```

### 3. 系統資源使用

```bash
# 查看 Docker 系統資源使用情況
docker system df

# 查看詳細的磁碟使用情況
docker system df -v

# 實時監控容器資源使用
docker stats

# 監控特定容器
docker stats [容器名稱]
```

## 容器運行測試

### 1. 容器詳細資訊

```bash
# 查看容器詳細配置
docker inspect [容器名稱]

# 查看容器的環境變數
docker inspect [容器名稱] | grep -A 20 "Env"

# 查看容器的掛載點
docker inspect [容器名稱] | grep -A 10 "Mounts"

# 查看容器的網路設定
docker inspect [容器名稱] | grep -A 10 "NetworkSettings"
```

### 2. 容器狀態監控

```bash
# 檢查容器是否正在運行
docker container ls --filter "name=[容器名稱]"

# 檢查容器的運行時間
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"

# 檢查容器的重啟次數
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RestartCount}}"
```

### 3. 進入容器進行測試

```bash
# 進入運行中的容器
docker exec -it [容器名稱] /bin/bash
# 或
docker exec -it [容器名稱] /bin/sh

# 在容器中執行單一命令
docker exec [容器名稱] [命令]

# 例如：檢查容器內的進程
docker exec [容器名稱] ps aux

# 檢查容器內的網路
docker exec [容器名稱] netstat -tlnp
```

## 映像檔管理

### 1. 映像檔列表與檢查

```bash
# 查看所有映像檔
docker images

# 查看映像檔的詳細資訊
docker inspect [映像檔名稱]

# 查看映像檔的建立歷史
docker history [映像檔名稱]

# 檢查映像檔的大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### 2. 映像檔測試

```bash
# 測試映像檔能否正常啟動
docker run --rm [映像檔名稱] [測試命令]

# 檢查映像檔的安全漏洞（需要 Docker Desktop）
docker scout cves [映像檔名稱]
```

## 網路連線測試

### 1. Docker 網路檢查

```bash
# 查看所有 Docker 網路
docker network ls

# 查看特定網路的詳細資訊
docker network inspect [網路名稱]

# 測試容器間的網路連線
docker exec [容器1] ping [容器2的IP或名稱]

# 查看容器的網路配置
docker exec [容器名稱] ip addr show
```

### 2. 埠口連線測試

```bash
# 測試容器埠口是否可達
telnet localhost [埠口號]

# 使用 curl 測試 HTTP 服務
curl -I http://localhost:[埠口號]

# 測試 TCP 連線
nc -zv localhost [埠口號]

# 查看容器的埠口映射
docker port [容器名稱]
```

## 健康檢查監控

### 1. 容器健康狀態

```bash
# 查看容器的健康狀態
docker ps --format "table {{.Names}}\t{{.Status}}"

# 查看健康檢查的詳細資訊
docker inspect [容器名稱] | grep -A 20 "Health"

# 手動執行健康檢查
docker exec [容器名稱] [健康檢查命令]
```

### 2. 自定義健康檢查腳本

```bash
#!/bin/bash
# health-check.sh - 自定義健康檢查腳本

CONTAINER_NAME=$1

if [ -z "$CONTAINER_NAME" ]; then
    echo "使用方式: $0 <容器名稱>"
    exit 1
fi

# 檢查容器是否運行
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ 容器 ${CONTAINER_NAME} 未運行"
    exit 1
fi

# 檢查容器健康狀態
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} 2>/dev/null)

if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo "✅ 容器 ${CONTAINER_NAME} 健康狀態良好"
elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
    echo "❌ 容器 ${CONTAINER_NAME} 健康狀態不良"
    exit 1
elif [ "$HEALTH_STATUS" = "starting" ]; then
    echo "⏳ 容器 ${CONTAINER_NAME} 正在啟動中"
else
    echo "ℹ️ 容器 ${CONTAINER_NAME} 沒有設定健康檢查"
fi

# 檢查容器資源使用
echo "📊 資源使用情況："
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" ${CONTAINER_NAME}
```

## 日誌分析

### 1. 查看容器日誌

```bash
# 查看容器日誌
docker logs [容器名稱]

# 實時跟蹤日誌
docker logs -f [容器名稱]

# 查看最後 100 行日誌
docker logs --tail 100 [容器名稱]

# 查看特定時間範圍的日誌
docker logs --since 2024-01-01T00:00:00 [容器名稱]

# 查看日誌並顯示時間戳
docker logs -t [容器名稱]
```

### 2. Docker Compose 日誌

```bash
# 查看所有服務的日誌
docker compose logs

# 查看特定服務的日誌
docker compose logs [服務名稱]

# 實時跟蹤所有服務日誌
docker compose logs -f

# 查看最後 50 行日誌
docker compose logs --tail 50
```

## 效能監控

### 1. 資源使用監控

```bash
# 實時監控所有容器
docker stats

# 監控特定容器並只顯示一次
docker stats --no-stream [容器名稱]

# 自定義顯示格式
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
```

### 2. 系統事件監控

```bash
# 監控 Docker 系統事件
docker events

# 過濾特定類型的事件
docker events --filter event=start
docker events --filter event=die

# 監控特定容器的事件
docker events --filter container=[容器名稱]
```

## 故障排除

### 1. 常見問題檢查清單

```bash
#!/bin/bash
# docker-troubleshoot.sh - Docker 故障排除腳本

echo "🔍 Docker 系統診斷開始..."

# 1. 檢查 Docker 服務
echo "1. 檢查 Docker 服務狀態"
if docker info > /dev/null 2>&1; then
    echo "✅ Docker 服務正常運行"
else
    echo "❌ Docker 服務未運行或無法連接"
    exit 1
fi

# 2. 檢查磁碟空間
echo "2. 檢查磁碟空間"
docker system df

# 3. 檢查容器狀態
echo "3. 檢查容器狀態"
FAILED_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.Names}}")
if [ -n "$FAILED_CONTAINERS" ]; then
    echo "❌ 發現停止的容器："
    echo "$FAILED_CONTAINERS"
else
    echo "✅ 所有容器都在運行"
fi

# 4. 檢查網路連線
echo "4. 檢查 Docker 網路"
docker network ls

# 5. 檢查系統資源
echo "5. 檢查系統資源使用"
docker stats --no-stream

echo "🔍 診斷完成"
```

### 2. 清理 Docker 資源

```bash
# 清理停止的容器
docker container prune

# 清理未使用的映像檔
docker image prune

# 清理未使用的網路
docker network prune

# 清理未使用的卷
docker volume prune

# 清理整個 Docker 系統（謹慎使用）
docker system prune -a
```

## MCP Server 專用測試

### 1. MCP Server 健康檢查

```bash
#!/bin/bash
# mcp-health-check.sh - MCP Server 健康檢查腳本

echo "🔍 MCP Server 健康檢查..."

# 檢查 MCP Server 容器
if docker ps --format '{{.Names}}' | grep -q "mcp-server"; then
    echo "✅ MCP Server 容器正在運行"

    # 檢查 MCP Server 日誌中的錯誤
    ERROR_COUNT=$(docker logs mcp-server 2>&1 | grep -i error | wc -l)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo "⚠️ 發現 $ERROR_COUNT 個錯誤，查看詳細日誌："
        docker logs --tail 20 mcp-server | grep -i error
    else
        echo "✅ 未發現錯誤日誌"
    fi

else
    echo "❌ MCP Server 容器未運行"
    exit 1
fi

# 檢查相關服務
echo "📊 檢查相關服務狀態："
docker compose ps
```

### 2. MCP Server 連線測試

```bash
#!/bin/bash
# mcp-connection-test.sh - MCP Server 連線測試

MCP_HOST="localhost"
MCP_PORT="3000"  # 根據你的配置調整

echo "🔗 測試 MCP Server 連線..."

# 測試 TCP 連線
if nc -z $MCP_HOST $MCP_PORT; then
    echo "✅ MCP Server 埠口 $MCP_PORT 可達"
else
    echo "❌ 無法連接到 MCP Server 埠口 $MCP_PORT"
    exit 1
fi

# 測試 HTTP 回應（如果是 HTTP 服務）
if curl -s -o /dev/null -w "%{http_code}" http://$MCP_HOST:$MCP_PORT | grep -q "200\|404"; then
    echo "✅ MCP Server HTTP 服務回應正常"
else
    echo "⚠️ MCP Server HTTP 服務回應異常"
fi
```

### 3. Demo 環境測試腳本

```bash
#!/bin/bash
# demo-test.sh - Demo 環境完整測試

echo "🚀 開始 Demo 環境測試..."

# 1. 建立並啟動服務
echo "1. 啟動 Demo 環境"
./scripts/start-demo.sh start

# 等待服務啟動
echo "⏳ 等待服務啟動（30秒）..."
sleep 30

# 2. 檢查所有容器狀態
echo "2. 檢查容器狀態"
docker compose -f docker-compose.demo.yml ps

# 3. 檢查服務健康狀態
echo "3. 檢查服務健康狀態"
SERVICES=("mcp-server-demo" "demo-data-generator")

for service in "${SERVICES[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "$service"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' $service)
        echo "📊 $service: $STATUS"

        # 檢查最近的日誌
        echo "📝 最近日誌："
        docker logs --tail 5 $service
        echo "---"
    else
        echo "❌ $service 容器未找到"
    fi
done

# 4. 測試網路連線
echo "4. 測試網路連線"
# 這裡添加具體的連線測試

echo "✅ Demo 環境測試完成"
```

## 使用建議

1. **定期監控**：建議每天執行基本的健康檢查
2. **日誌輪替**：定期清理 Docker 日誌以避免磁碟空間不足
3. **資源限制**：為容器設定適當的 CPU 和記憶體限制
4. **備份策略**：定期備份重要的 Docker 映像檔和資料卷
5. **安全更新**：定期更新 Docker 和容器映像檔

## 自動化監控

你可以將這些檢查腳本加入到 cron 工作或 CI/CD 流程中，實現自動化監控：

```bash
# 每 5 分鐘檢查一次容器健康狀態
*/5 * * * * /path/to/health-check.sh >> /var/log/docker-health.log 2>&1

# 每天清理 Docker 系統
0 2 * * * docker system prune -f >> /var/log/docker-cleanup.log 2>&1
```

這個指南涵蓋了 Docker 運行狀態測試的各個面向，你可以根據具體需求選擇合適的測試方法。
