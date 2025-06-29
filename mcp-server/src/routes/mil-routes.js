/**
 * 製造智能資訊實驗室 (MIL) 模組 API 路由
 */

import express from "express";
import { getToolManager, getModuleMetadata } from "../tools/index.js";
import logger from "../config/logger.js";

/**
 * 將工具結果分塊串流輸出
 * @param {Response} res - Express 回應物件
 * @param {any} result - 工具執行結果
 * @param {string} toolName - 工具名稱
 */
async function streamToolResult(res, result, toolName) {
  try {
    // 將結果轉換為 markdown 格式的文字
    const content = formatResultAsMarkdown(result, toolName);
    
    // 分塊策略：每個chunk大小在15-30字符之間
    const chunks = splitIntoChunks(content, 15, 30);
    
    logger.info(`開始串流 ${toolName} 結果，共 ${chunks.length} 個塊`);
    
    // 逐塊發送
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      res.write(`data: ${JSON.stringify({
        content: chunk,
        index: i,
        total: chunks.length,
        toolName,
        timestamp: new Date().toISOString()
      })}\n\n`);
      
      // 隨機延遲 30-80ms，模擬真實的AI回應速度
      const delay = 30 + Math.random() * 50;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // 發送完成信號
    res.write('data: [DONE]\n\n');
    res.end();
    
    logger.info(`${toolName} 串流輸出完成`);
    
  } catch (error) {
    logger.error(`串流輸出失敗:`, error);
    res.write(`data: ${JSON.stringify({
      error: true,
      message: "串流輸出失敗",
      details: error.message
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

/**
 * 將內容分割成隨機大小的塊
 * @param {string} content - 要分割的內容
 * @param {number} minSize - 最小塊大小
 * @param {number} maxSize - 最大塊大小
 * @returns {string[]} 分割後的塊陣列
 */
function splitIntoChunks(content, minSize, maxSize) {
  const chunks = [];
  let currentIndex = 0;
  
  while (currentIndex < content.length) {
    // 隨機塊大小
    const chunkSize = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const chunk = content.substring(currentIndex, currentIndex + chunkSize);
    chunks.push(chunk);
    currentIndex += chunkSize;
  }
  
  return chunks;
}

/**
 * 將工具結果格式化為 Markdown
 * @param {any} result - 工具結果
 * @param {string} toolName - 工具名稱
 * @returns {string} 格式化後的 Markdown 文字
 */
function formatResultAsMarkdown(result, toolName) {
  // 基於工具類型生成不同的格式
  let content = '';
  
  try {
    if (typeof result === 'string') {
      content = result;
    } else if (result && typeof result === 'object') {
      // 將 JSON 結果轉換為易讀的 markdown 格式
      content = `## ${getToolDisplayName(toolName)} 查詢結果\n\n`;
      content += JSON.stringify(result, null, 2);
    } else {
      content = `查詢完成，但沒有返回具體結果。`;
    }
  } catch (error) {
    logger.error('格式化結果失敗:', error);
    content = '結果格式化失敗，請稍後重試。';
  }
  
  return content;
}

/**
 * 獲取工具的顯示名稱
 * @param {string} toolName - 工具名稱
 * @returns {string} 顯示名稱
 */
function getToolDisplayName(toolName) {
  const displayNames = {
    'get-mil-list': 'MIL 列表',
    'get-mil-details': 'MIL 詳細資訊',
    'get-status-report': 'MIL 狀態報告',
    'get-mil-type-list': 'MIL 類型列表',
    'get-count-by': 'MIL 統計分析'
  };
  
  return displayNames[toolName] || toolName;
}

// 創建模組路由
const router = express.Router();

// 獲取工具管理器實例
const toolManager = getToolManager();

// 工具列表端點
router.get("/tools", (req, res) => {
  res.json({
    module: "mil",
    tools: [
      "get-mil-list",
      "get-mil-details",
      "get-status-report",
      "get-mil-type-list",
      "get-count-by",
    ],
    timestamp: new Date().toISOString(),
  });
});

// 工具調用端點 - SSE 串流版本
router.post("/:toolName", async (req, res) => {
  const { toolName } = req.params;
  const params = req.body;
  
  // 檢查是否要求SSE輸出
  const useSSE = req.headers['accept'] === 'text/event-stream';

  try {
    // 檢查工具是否存在
    const validTools = [
      "get-mil-list",
      "get-mil-details",
      "get-status-report",
      "get-mil-type-list",
      "get-count-by",
    ];

    if (!validTools.includes(toolName)) {
      if (useSSE) {
        // SSE 錯誤回應
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        res.write(`data: ${JSON.stringify({
          error: true,
          message: `找不到工具 ${toolName}`,
          availableTools: validTools
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      
      return res.status(404).json({
        success: false,
        error: {
          message: `找不到工具 ${toolName}`,
          availableTools: validTools,
        },
      });
    }

    if (useSSE) {
      // SSE 模式
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // 執行工具
      const result = await toolManager.callTool(toolName, params);
      
      // 檢查工具執行是否成功
      if (!result.success) {
        res.write(`data: ${JSON.stringify({
          error: true,
          code: "TOOL_EXECUTION_FAILED",
          message: result.error?.message || "工具執行失敗",
          details: result.error?.details,
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      // 將結果分塊串流輸出
      await streamToolResult(res, result.result, toolName);
      
    } else {
      // 傳統 JSON 模式
      const result = await toolManager.callTool(toolName, params);

      // 添加調試日誌
      logger.info(`MIL 工具調用結果:`, {
        toolName,
        resultKeys: Object.keys(result || {}),
        success: result?.success,
        hasResult: !!result?.result,
        resultType: typeof result?.result,
      });

      // 檢查工具執行是否成功
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: "TOOL_EXECUTION_FAILED",
            message: result.error?.message || "工具執行失敗",
            details: result.error?.details,
          },
        });
      }

      res.json({
        success: true,
        module: "mil",
        toolName: toolName,
        result: result.result,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error(`MIL 工具 ${toolName} 調用失敗:`, {
      error: error.message,
      stack: error.stack,
      params: JSON.stringify(params),
    });

    // 處理不同類型的錯誤
    if (error.type === "validation_error") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.details,
        },
      });
    } else if (error.type === "not_found") {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: error.message,
          details: error.details,
        },
      });
    }

    // 其他錯誤
    res.status(500).json({
      success: false,
      error: {
        code: "EXECUTION_ERROR",
        message: error.message,
      },
    });
  }
});

// 文檔端點
router.get("/docs", (req, res) => {
  // 獲取模組元數據
  const moduleMetadata = getModuleMetadata("mil");

  res.json({
    module: "mil",
    name: moduleMetadata.name,
    description: moduleMetadata.description,
    tools: [
      {
        name: "get-mil-list",
        description: "根據條件查詢 MIL 列表",
        endpoint: "/api/mil/get-mil-list",
        method: "POST",
        parameters: {
          status: "選填，MIL 處理狀態",
          proposerName: "選填，提出人姓名，支持模糊查詢",
          serialNumber: "選填，MIL 編號，支持模糊查詢",
          importance: "選填，重要度",
          page: "選填，頁數，預設 1",
          limit: "選填，每頁返回結果數量限制，預設 100",
        },
      },
      {
        name: "get-mil-details",
        description: "查詢特定 MIL 的詳細資訊",
        endpoint: "/api/mil/get-mil-details",
        method: "POST",
        parameters: {
          serialNumber: "必填，MIL 編號",
        },
      },
      {
        name: "get-status-report",
        description: "生成 MIL 狀態分布統計報告",
        endpoint: "/api/mil/get-status-report",
        method: "POST",
        parameters: {},
      },
      {
        name: "get-mil-type-list",
        description: "取得 MIL 類型列表，獲取所有 MIL 類型的唯一列表",
        endpoint: "/api/mil/get-mil-type-list",
        method: "POST",
        parameters: {},
      },
      {
        name: "get-count-by",
        description:
          "依指定欄位（如狀態、類型、廠別等）統計 MIL 記錄數量，用於數據分析和報表生成",
        endpoint: "/api/mil/get-count-by",
        method: "POST",
        parameters: {
          columnName: {
            type: "string",
            required: true,
            description: "要統計的欄位名稱",
            enum: [
              "Status",
              "TypeName",
              "ProposalFactory",
              "Proposer_Name",
              "ResponsibleDepartment",
              "Priority",
              "Source",
            ],
            examples: ["Status", "TypeName", "ProposalFactory"],
          },
        },
      },
    ],
    timestamp: new Date().toISOString(),
  });
});

export default router;
