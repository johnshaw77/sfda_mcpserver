/**
 * MIL API 端點測試腳本
 *
 * 測試 MIL 模組的 API 端點
 * 模擬前端呼叫 API 的行為
 */

import http from "http";
import express from "express";
import config from "../config/config.js";
import routes from "../routes/index.js";
import databaseService from "../services/database.js";
import toolManager from "../tools/tool-manager.js";

// 測試端口
const TEST_PORT = 3099;

// 創建臨時測試服務器
async function createTestServer() {
  const app = express();
  app.use(express.json());

  // 註冊所有路由
  routes(app);

  return new Promise(resolve => {
    const server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      console.log(`🚀 測試服務器已啟動於端口 ${TEST_PORT}`);
      resolve(server);
    });
  });
}

// 發送 API 請求
async function sendRequest(path, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: TEST_PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, res => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          };
          resolve(result);
        } catch (error) {
          reject(
            new Error(`解析響應失敗: ${error.message}, 原始數據: ${data}`),
          );
        }
      });
    });

    req.on("error", error => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testMILAPI() {
  console.log("🔍 開始 MIL API 端點測試...\n");

  let server;

  try {
    // 初始化資料庫
    await databaseService.initialize();
    console.log("✅ 資料庫初始化成功");

    // 啟動測試服務器
    server = await createTestServer();

    // 測試 MIL 模組 API 端點
    console.log("\n📋 測試 MIL 模組 API 端點...");

    // 測試 MIL 工具文檔
    console.log("\n📌 測試 GET /api/mil/docs");
    let response = await sendRequest("/api/mil/docs");

    if (response.statusCode === 200) {
      console.log("✅ 成功取得 MIL 工具文檔");
      console.log(`   共有 ${response.body.tools.length} 個 MIL 工具`);

      if (response.body.tools.length > 0) {
        console.log("   工具列表:");
        response.body.tools.forEach((tool, index) => {
          console.log(
            `   ${index + 1}. ${tool.name} - ${tool.description.substring(0, 50)}...`,
          );
        });
      }
    } else {
      console.log(`❌ 取得 MIL 工具文檔失敗，狀態碼: ${response.statusCode}`);
      console.log("   回應內容:", response.body);
    }

    // 測試 MIL 列表 API
    console.log("\n📌 測試 POST /api/mil/get-mil-list");
    response = await sendRequest("/api/mil/get-mil-list", "POST", { limit: 5 });

    if (response.statusCode === 200) {
      console.log("✅ 成功取得 MIL 列表");

      if (response.body.milList && response.body.milList.length > 0) {
        console.log(`   共有 ${response.body.milList.length} 筆記錄`);
        console.log("   MIL 列表範例 (前 2 筆):");

        for (let i = 0; i < Math.min(2, response.body.milList.length); i++) {
          const item = response.body.milList[i];
          console.log(
            `   ${i + 1}. ${item.SerialNumber} - ${item.Proposer_Name || "N/A"}`,
          );
          console.log(`      狀態: ${item.Status || "N/A"}`);
        }

        // 保存第一個記錄的 SerialNumber 用於下一個測試
        const firstSerialNumber = response.body.milList[0].SerialNumber;

        // 測試 MIL 詳情 API
        if (firstSerialNumber) {
          console.log("\n📌 測試 POST /api/mil/get-mil-details");
          response = await sendRequest("/api/mil/get-mil-details", "POST", {
            serialNumber: firstSerialNumber,
          });

          if (response.statusCode === 200) {
            console.log(`✅ 成功取得 MIL 詳情 (${firstSerialNumber})`);

            if (response.body.details) {
              console.log("   MIL 詳情摘要:");
              console.log(
                `   SerialNumber: ${response.body.details.SerialNumber}`,
              );
              console.log(
                `   Status: ${response.body.details.Status || "N/A"}`,
              );
              console.log(
                `   Proposer_Name: ${response.body.details.Proposer_Name || "N/A"}`,
              );
              console.log(
                `   RecordDate: ${response.body.details.RecordDate ? new Date(response.body.details.RecordDate).toLocaleString() : "N/A"}`,
              );
            }
          } else {
            console.log(`❌ 取得 MIL 詳情失敗，狀態碼: ${response.statusCode}`);
            console.log("   回應內容:", response.body);
          }
        }
      } else {
        console.log("⚠️  MIL 列表為空");
      }
    } else {
      console.log(`❌ 取得 MIL 列表失敗，狀態碼: ${response.statusCode}`);
      console.log("   回應內容:", response.body);
    }

    // 測試 MIL 狀態報告 API
    console.log("\n📌 測試 POST /api/mil/get-status-report");
    response = await sendRequest("/api/mil/get-status-report", "POST", {});

    if (response.statusCode === 200) {
      console.log("✅ 成功取得 MIL 狀態報告");

      if (response.body.statusReport && response.body.statusReport.length > 0) {
        console.log(`   共有 ${response.body.statusReport.length} 種狀態`);
        console.log("   狀態報告摘要:");

        response.body.statusReport.forEach((status, index) => {
          console.log(`   ${index + 1}. 狀態: ${status.Status || "N/A"}`);
          console.log(`      數量: ${status.Count || "0"}`);
          console.log(
            `      平均天數: ${status.AvgDays ? status.AvgDays.toFixed(1) : "N/A"} 天`,
          );
        });
      } else {
        console.log("⚠️  MIL 狀態報告為空");
      }
    } else {
      console.log(`❌ 取得 MIL 狀態報告失敗，狀態碼: ${response.statusCode}`);
      console.log("   回應內容:", response.body);
    }

    console.log("\n🎉 MIL API 端點測試完成！");
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
  } finally {
    // 關閉測試服務器
    if (server) {
      server.close();
      console.log("🔒 測試服務器已關閉");
    }

    // 關閉資料庫連接
    await databaseService.close();
    console.log("🔒 資料庫連接已關閉");
  }
}

// 執行測試
testMILAPI().catch(console.error);
