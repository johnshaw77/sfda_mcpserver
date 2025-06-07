# MCP Server 故障排除指南

> 📅 最後更新：2025 年 6 月 7 日  
> 🎯 適用於：開發者、運維人員、系統管理員

## 🚨 常見問題與解決方案

### 🐳 Docker 相關問題

#### 問題：Docker Compose 啟動失敗

**症狀**：

```bash
ERROR: Network mcp-demo-network not found
```

**解決方案**：

```bash
# 重新建立網路
docker network create mcp-demo-network

# 或重置整個環境
./scripts/start-demo.sh reset
```

#### 問題：埠號衝突

**症狀**：

```bash
ERROR: Port 8080 is already in use
```

**解決方案**：

```bash
# 檢查佔用埠號的程序
lsof -i :8080

# 停止衝突的服務或修改 .env.demo 中的埠號
MCP_PORT=8081
```

#### 問題：容器無法啟動

**症狀**：

```bash
mcp-server-demo exited with code 1
```

**解決方案**：

```bash
# 查看詳細日誌
docker-compose -f docker-compose.demo.yml logs mcp-server

# 檢查容器狀態
docker ps -a

# 重新建構映像
./scripts/start-demo.sh build
```

---

### 🔌 連接相關問題

#### 問題：無法連接到 MCP Server

**症狀**：

```bash
curl: (7) Failed to connect to localhost port 8080
```

**檢查步驟**：

```bash
# 1. 檢查服務狀態
./scripts/start-demo.sh status

# 2. 檢查健康狀態
./scripts/start-demo.sh health

# 3. 檢查網路連接
docker network inspect mcp-demo-network

# 4. 查看詳細日誌
docker-compose -f docker-compose.demo.yml logs -f mcp-server
```

#### 問題：SSE 連接斷開

**症狀**：

```javascript
EventSource failed: Error during WebSocket handshake
```

**解決方案**：

```bash
# 檢查 SSE 配置
curl -N http://localhost:8080/sse

# 檢查防火牆設定
# 確保埠號 8080 已開放

# 檢查 Nginx 配置（如有使用）
# SSE 需要特殊的代理設定
```

---

### 📊 監控相關問題

#### 問題：Prometheus 無法收集指標

**症狀**：

- Grafana 儀表板顯示 "No data"
- Prometheus targets 顯示 "DOWN"

**檢查步驟**：

```bash
# 1. 檢查 Prometheus 配置
curl http://localhost:9090/api/v1/targets

# 2. 檢查 MCP Server 指標端點
curl http://localhost:8080/metrics

# 3. 檢查網路連接
docker exec prometheus-demo ping mcp-server

# 4. 重啟 Prometheus
docker-compose -f docker-compose.demo.yml restart prometheus
```

#### 問題：Grafana 登入失敗

**症狀**：

```
Invalid username or password
```

**解決方案**：

```bash
# 檢查環境變數
grep GRAFANA .env.demo

# 預設帳號密碼
# 使用者名稱: admin
# 密碼: demo123

# 重置 Grafana 密碼
docker exec grafana-demo grafana-cli admin reset-admin-password newpassword
```

---

### 🔧 API 相關問題

#### 問題：工具調用失敗

**症狀**：

```json
{
  "error": "Tool not found: get_employee_info"
}
```

**檢查步驟**：

```bash
# 1. 檢查可用工具
curl http://localhost:8080/tools | jq '.tools[].name'

# 2. 檢查工具狀態
curl http://localhost:8080/tools/stats

# 3. 檢查工具註冊
docker-compose -f docker-compose.demo.yml logs mcp-server | grep "Tool registered"

# 4. 測試特定工具
curl -X POST http://localhost:8080/tools/get_employee_info \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "EMP001"}'
```

#### 問題：請求超時

**症狀**：

```bash
curl: (28) Operation timed out after 30000 milliseconds
```

**解決方案**：

```bash
# 檢查系統負載
docker stats

# 增加超時時間
curl --max-time 60 http://localhost:8080/health

# 檢查日誌中的錯誤
docker-compose -f docker-compose.demo.yml logs --tail=100 mcp-server
```

---

### 💾 資料相關問題

#### 問題：演示數據載入失敗

**症狀**：

```json
{
  "error": "Demo data not found"
}
```

**檢查步驟**：

```bash
# 1. 檢查數據檔案
ls -la demo-data/

# 2. 檢查檔案權限
chmod 644 demo-data/*.json

# 3. 驗證 JSON 格式
jq . demo-data/employees.json

# 4. 重新載入數據
docker-compose -f docker-compose.demo.yml restart mcp-server
```

#### 問題：快取相關問題

**症狀**：

- 數據更新不即時
- 記憶體使用過高

**解決方案**：

```bash
# 清除 Redis 快取
docker exec redis-demo redis-cli FLUSHALL

# 重啟快取服務
docker-compose -f docker-compose.demo.yml restart redis

# 檢查快取狀態
docker exec redis-demo redis-cli INFO memory
```

---

### 🔍 除錯工具

#### 日誌分析

```bash
# 查看即時日誌
./scripts/start-demo.sh logs

# 查看特定服務日誌
docker-compose -f docker-compose.demo.yml logs mcp-server

# 查看錯誤日誌
docker-compose -f docker-compose.demo.yml logs mcp-server | grep ERROR

# 匯出日誌
docker-compose -f docker-compose.demo.yml logs --no-color > debug.log
```

#### 效能分析

```bash
# 檢查容器資源使用
docker stats

# 檢查系統資源
top -p $(docker inspect --format='{{.State.Pid}}' mcp-server-demo)

# 記憶體使用分析
docker exec mcp-server-demo cat /proc/meminfo

# 網路連接分析
docker exec mcp-server-demo netstat -an
```

#### 網路診斷

```bash
# 測試容器間連接
docker exec mcp-server-demo ping prometheus

# 檢查 DNS 解析
docker exec mcp-server-demo nslookup grafana

# 檢查埠號開放狀況
docker exec mcp-server-demo netstat -tln
```

---

### 🩹 快速修復指令

#### 環境重置

```bash
# 完全重置演示環境
./scripts/start-demo.sh reset

# 重新建構所有映像
docker-compose -f docker-compose.demo.yml build --no-cache

# 清理未使用的資源
docker system prune -a -f
```

#### 服務重啟

```bash
# 重啟特定服務
docker-compose -f docker-compose.demo.yml restart mcp-server

# 重啟所有服務
./scripts/start-demo.sh restart

# 依序重啟服務
docker-compose -f docker-compose.demo.yml restart prometheus
docker-compose -f docker-compose.demo.yml restart grafana
docker-compose -f docker-compose.demo.yml restart mcp-server
```

#### 健康檢查

```bash
# 全面健康檢查
./scripts/start-demo.sh health

# 基本功能測試
./scripts/start-demo.sh test

# 手動測試
curl http://localhost:8080/health
curl http://localhost:8080/tools
curl -N http://localhost:8080/sse
```

---

### 📞 尋求協助

如果以上解決方案都無法解決問題，請：

1. **收集資訊**：

   ```bash
   # 建立除錯資訊包
   mkdir debug-info
   ./scripts/start-demo.sh status > debug-info/status.txt
   docker-compose -f docker-compose.demo.yml logs --no-color > debug-info/logs.txt
   docker ps -a > debug-info/containers.txt
   docker images > debug-info/images.txt
   ```

2. **環境資訊**：

   - 作業系統版本
   - Docker 版本
   - 錯誤發生時間
   - 執行的具體步驟

3. **聯絡方式**：
   - 提交 Issue 到專案儲存庫
   - 附上除錯資訊包
   - 詳細描述問題現象

---

### 📚 相關文檔

- [演示環境指南](./demo-environment.md)
- [開發者指南](./developer-guide.md)
- [API 規格文檔](./api-spec.md)
- [部署指南](./deployment.md)
