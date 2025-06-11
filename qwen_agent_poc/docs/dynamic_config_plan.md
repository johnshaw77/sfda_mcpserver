```python
"""
動態配置管理器
從資料庫或 API 動態載入 MCP Server 和 Ollama 配置
"""
import aiohttp
import asyncio
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ServerConfig:
    """伺服器配置資料類別"""
    mcp_server_url: str
    ollama_base_url: str
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: float = 1.0

class DynamicConfigManager:
    """動態配置管理器"""
    
    def __init__(self, nexus_api_base: str = "http://localhost:3000"):
        self.nexus_api_base = nexus_api_base
        self._cached_config: Optional[ServerConfig] = None
        self._cache_ttl = 300  # 5分鐘快取
        self._last_fetch = 0
        
    async def get_server_config(self, force_refresh: bool = False) -> ServerConfig:
        """從 SFDA Nexus 取得伺服器配置"""
        import time
        
        current_time = time.time()
        
        # 檢查是否需要重新載入配置
        if (not force_refresh and 
            self._cached_config and 
            (current_time - self._last_fetch) < self._cache_ttl):
            return self._cached_config
            
        try:
            config = await self._fetch_config_from_nexus()
            self._cached_config = config
            self._last_fetch = current_time
            
            logger.info("✅ 成功從 SFDA Nexus 載入配置")
            return config
            
        except Exception as e:
            logger.error(f"❌ 從 Nexus 載入配置失敗: {e}")
            
            # 如果有快取配置，使用快取
            if self._cached_config:
                logger.warning("⚠️  使用快取配置")
                return self._cached_config
                
            # 否則使用預設配置
            logger.warning("⚠️  使用預設配置")
            return self._get_default_config()
    
    async def _fetch_config_from_nexus(self) -> ServerConfig:
        """從 SFDA Nexus API 取得配置"""
        async with aiohttp.ClientSession() as session:
            # 取得 MCP Server 配置
            mcp_config = await self._fetch_service_config(
                session, "mcp_server"
            )
            
            # 取得 Ollama 配置
            ollama_config = await self._fetch_service_config(
                session, "ollama"
            )
            
            return ServerConfig(
                mcp_server_url=mcp_config.get("url", "http://localhost:8080"),
                ollama_base_url=ollama_config.get("url", "http://localhost:11434"),
                timeout=mcp_config.get("timeout", 30),
                retry_attempts=mcp_config.get("retry_attempts", 3),
                retry_delay=mcp_config.get("retry_delay", 1.0)
            )
    
    async def _fetch_service_config(
        self, 
        session: aiohttp.ClientSession, 
        service_name: str
    ) -> Dict[str, Any]:
        """取得特定服務的配置"""
        url = f"{self.nexus_api_base}/api/admin/services/{service_name}/config"
        
        async with session.get(url, timeout=10) as response:
            if response.status == 200:
                return await response.json()
            else:
                raise Exception(f"API 回應錯誤: {response.status}")
    
    def _get_default_config(self) -> ServerConfig:
        """取得預設配置（備用方案）"""
        import os
        return ServerConfig(
            mcp_server_url=os.getenv("MCP_SERVER_URL", "http://localhost:8080"),
            ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        )
    
    async def update_service_config(
        self, 
        service_name: str, 
        config_data: Dict[str, Any]
    ) -> bool:
        """更新服務配置（呼叫 SFDA Nexus API）"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.nexus_api_base}/api/admin/services/{service_name}/config"
                
                async with session.put(url, json=config_data) as response:
                    if response.status == 200:
                        # 清除快取，強制重新載入
                        self._cached_config = None
                        logger.info(f"✅ 成功更新 {service_name} 配置")
                        return True
                    else:
                        logger.error(f"❌ 更新配置失敗: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"❌ 更新配置時發生錯誤: {e}")
            return False

# 全域配置管理器實例
config_manager = DynamicConfigManager()

async def get_dynamic_config() -> Dict[str, Any]:
    """取得動態配置（給 Qwen-Agent 使用）"""
    server_config = await config_manager.get_server_config()
    
    return {
        "MCP_SERVER_CONFIG": {
            "base_url": server_config.mcp_server_url,
            "timeout": server_config.timeout,
            "retry_attempts": server_config.retry_attempts,
            "retry_delay": server_config.retry_delay,
        },
        "QWEN_MODEL_CONFIG": {
            "model": "qwen3:30b",
            "api_base": f"{server_config.ollama_base_url}/v1",
            "api_key": "ollama",
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.8,
        }
    }
```

然後，您需要在 sfda_nexus 中新增對應的 API 端點： 只是 example 而已

```javascript
import express from "express";
import db from "../database/db.js";

const router = express.Router();

// 取得服務配置
router.get("/services/:serviceName/config", async (req, res) => {
  try {
    const { serviceName } = req.params;
    
    const query = `
      SELECT config_data, updated_at 
      FROM service_configs 
      WHERE service_name = ? AND is_active = 1
    `;
    
    const row = await new Promise((resolve, reject) => {
      db.get(query, [serviceName], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!row) {
      return res.status(404).json({ 
        error: "服務配置未找到",
        service: serviceName 
      });
    }
    
    const configData = JSON.parse(row.config_data);
    
    res.json({
      service: serviceName,
      config: configData,
      lastUpdated: row.updated_at
    });
    
  } catch (error) {
    console.error("取得服務配置錯誤:", error);
    res.status(500).json({ error: "伺服器內部錯誤" });
  }
});

// 更新服務配置
router.put("/services/:serviceName/config", async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { config } = req.body;
    
    const query = `
      INSERT OR REPLACE INTO service_configs 
      (service_name, config_data, updated_at, is_active) 
      VALUES (?, ?, datetime('now'), 1)
    `;
    
    await new Promise((resolve, reject) => {
      db.run(query, [serviceName, JSON.stringify(config)], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
    
    res.json({ 
      message: "配置更新成功",
      service: serviceName 
    });
    
  } catch (error) {
    console.error("更新服務配置錯誤:", error);
    res.status(500).json({ error: "伺服器內部錯誤" });
  }
});

export default router;
```

最後，建立資料庫表格：

```sql
CREATE TABLE IF NOT EXISTS service_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL UNIQUE,
  config_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

-- 插入預設配置
INSERT OR REPLACE INTO service_configs (service_name, config_data) VALUES 
('mcp_server', '{"url": "http://localhost:8080", "timeout": 30, "retry_attempts": 3, "retry_delay": 1.0}'),
('ollama', '{"url": "http://localhost:11434", "model": "qwen3:30b", "temperature": 0.7}');
```

這樣的設計有以下優點：

🔄 動態配置：可以即時從資料庫更新配置，不需重啟服務
📱 前端管理：您的 sfda_nexus 前端可以提供配置編輯介面
⚡ 快取機制：避免頻繁資料庫查詢
🛡️ 錯誤處理：網路失敗時有備用配置
🔧 靈活擴展：可以輕鬆新增其他服務配置