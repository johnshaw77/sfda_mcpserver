const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * 演示數據生成器
 * 定期生成模擬的 API 調用和事件，讓演示環境更生動
 */
class DemoDataGenerator {
  constructor() {
    this.mcpServerUrl = process.env.MCP_SERVER_URL || "http://localhost:8080";
    this.interval = parseInt(process.env.DEMO_INTERVAL) || 60000; // 60 秒
    this.isRunning = false;
    this.stats = {
      callsGenerated: 0,
      eventsGenerated: 0,
      lastActivity: null,
    };
  }

  /**
   * 啟動生成器
   */
  start() {
    console.log("🎬 啟動演示數據生成器...");
    console.log(`📡 MCP Server: ${this.mcpServerUrl}`);
    console.log(`⏰ 生成間隔: ${this.interval}ms`);

    this.isRunning = true;
    this.scheduleNext();

    // 啟動健康檢查伺服器
    this.startHealthServer();
  }

  /**
   * 停止生成器
   */
  stop() {
    console.log("⏹️ 停止演示數據生成器...");
    this.isRunning = false;
  }

  /**
   * 排程下一次生成
   */
  scheduleNext() {
    if (!this.isRunning) return;

    setTimeout(async () => {
      try {
        await this.generateActivity();
      } catch (error) {
        console.error("❌ 生成活動失敗:", error.message);
      }

      this.scheduleNext();
    }, this.interval);
  }

  /**
   * 生成模擬活動
   */
  async generateActivity() {
    const activities = [
      this.simulateEmployeeQuery,
      this.simulateNewsQuery,
      this.simulateDepartmentQuery,
      this.simulateSystemStats,
      this.simulateHealthCheck,
    ];

    // 隨機選擇活動
    const activity = activities[Math.floor(Math.random() * activities.length)];

    try {
      await activity.call(this);
      this.stats.callsGenerated++;
      this.stats.lastActivity = new Date().toISOString();

      console.log(`📊 已生成 ${this.stats.callsGenerated} 個模擬調用`);
    } catch (error) {
      console.error("活動生成失敗:", error.message);
    }
  }

  /**
   * 模擬員工查詢
   */
  async simulateEmployeeQuery() {
    const employeeIds = ["EMP001", "EMP002", "EMP003", "EMP004", "EMP005"];
    const randomId =
      employeeIds[Math.floor(Math.random() * employeeIds.length)];

    console.log(`👤 模擬員工查詢: ${randomId}`);

    const response = await axios.post(
      `${this.mcpServerUrl}/tools/get_employee_info`,
      {
        employee_id: randomId,
      },
      {
        timeout: 10000,
        headers: {
          "User-Agent": "Demo-Data-Generator/1.0",
        },
      }
    );

    console.log(`✅ 員工查詢成功: ${response.data.name || "Unknown"}`);
  }

  /**
   * 模擬新聞查詢
   */
  async simulateNewsQuery() {
    console.log("📰 模擬新聞查詢...");

    const response = await axios.post(
      `${this.mcpServerUrl}/tools/get_company_news`,
      {
        limit: Math.floor(Math.random() * 5) + 1,
        category: Math.random() > 0.5 ? "技術公告" : null,
      },
      {
        timeout: 10000,
        headers: {
          "User-Agent": "Demo-Data-Generator/1.0",
        },
      }
    );

    console.log(`✅ 新聞查詢成功: ${response.data.news?.length || 0} 條新聞`);
  }

  /**
   * 模擬部門查詢
   */
  async simulateDepartmentQuery() {
    console.log("🏢 模擬部門查詢...");

    const response = await axios.post(
      `${this.mcpServerUrl}/tools/get_department_list`,
      {
        include_stats: Math.random() > 0.5,
      },
      {
        timeout: 10000,
        headers: {
          "User-Agent": "Demo-Data-Generator/1.0",
        },
      }
    );

    console.log(
      `✅ 部門查詢成功: ${response.data.departments?.length || 0} 個部門`
    );
  }

  /**
   * 模擬系統統計查詢
   */
  async simulateSystemStats() {
    console.log("📈 模擬系統統計查詢...");

    const response = await axios.get(`${this.mcpServerUrl}/tools/stats`, {
      timeout: 10000,
      headers: {
        "User-Agent": "Demo-Data-Generator/1.0",
      },
    });

    console.log(`✅ 統計查詢成功: ${response.data.tools?.length || 0} 個工具`);
  }

  /**
   * 模擬健康檢查
   */
  async simulateHealthCheck() {
    console.log("💓 模擬健康檢查...");

    const response = await axios.get(`${this.mcpServerUrl}/health`, {
      timeout: 5000,
      headers: {
        "User-Agent": "Demo-Data-Generator/1.0",
      },
    });

    console.log(`✅ 健康檢查成功: ${response.data.status}`);
  }

  /**
   * 啟動健康檢查伺服器
   */
  startHealthServer() {
    const http = require("http");

    const server = http.createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "healthy",
            uptime: process.uptime(),
            stats: this.stats,
            isRunning: this.isRunning,
          })
        );
      } else if (req.url === "/stats") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(this.stats));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });

    server.listen(3001, () => {
      console.log("🏥 健康檢查伺服器啟動於 http://localhost:3001");
    });
  }
}

// 處理程序終止信號
process.on("SIGTERM", () => {
  console.log("收到 SIGTERM 信號，正在關閉...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("收到 SIGINT 信號，正在關閉...");
  process.exit(0);
});

// 啟動生成器
const generator = new DemoDataGenerator();
generator.start();
