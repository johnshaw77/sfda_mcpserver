/**
 * MCP (Model Context Protocol) 核心實作
 *
 * 這個檔案實作了 MCP JSON-RPC 2.0 協議的基礎功能，
 * 包括訊息格式處理、工具調用機制等。
 *
 * MCP 協議基於 JSON-RPC 2.0 標準，支援：
 * - initialize: 初始化協議連接
 * - tools/list: 列出可用工具
 * - tools/call: 調用特定工具
 * - resources/list: 列出可用資源
 * - prompts/list: 列出可用提示範本
 */

import logger from "../config/logger.js";
import { getToolManager } from "../tools/index.js";
import { ToolExecutionError } from "../tools/base-tool.js";

/**
 * MCP 協議版本
 */
export const MCP_PROTOCOL_VERSION = "2024-11-05";

/**
 * MCP 訊息類型
 */
export const MessageType = {
  REQUEST: "request",
  RESPONSE: "response",
  NOTIFICATION: "notification",
};

/**
 * MCP 錯誤代碼 (基於 JSON-RPC 2.0)
 */
export const ErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // MCP 特定錯誤代碼
  TOOL_NOT_FOUND: -32000,
  TOOL_EXECUTION_ERROR: -32001,
  RESOURCE_NOT_FOUND: -32002,
  PROMPT_NOT_FOUND: -32003,
};

/**
 * 建立 MCP 回應訊息
 */
export function createResponse(id, result = null, error = null) {
  const response = {
    jsonrpc: "2.0",
    id,
  };

  if (error) {
    response.error = {
      code: error.code || ErrorCode.INTERNAL_ERROR,
      message: error.message || "Internal error",
      ...(error.data && { data: error.data }),
    };
  } else {
    response.result = result;
  }

  return response;
}

/**
 * 建立 MCP 通知訊息
 */
export function createNotification(method, params = null) {
  const notification = {
    jsonrpc: "2.0",
    method,
  };

  if (params) {
    notification.params = params;
  }

  return notification;
}

/**
 * 驗證 JSON-RPC 2.0 訊息格式
 */
export function validateMessage(message) {
  if (!message || typeof message !== "object") {
    throw {
      code: ErrorCode.PARSE_ERROR,
      message: "Invalid message format",
    };
  }

  if (message.jsonrpc !== "2.0") {
    throw {
      code: ErrorCode.INVALID_REQUEST,
      message: "Invalid JSON-RPC version",
    };
  }

  // 請求必須有 method 和 id
  if (message.method && typeof message.method !== "string") {
    throw {
      code: ErrorCode.INVALID_REQUEST,
      message: "Method must be a string",
    };
  }

  // 回應必須有 id，且有 result 或 error 之一
  if (
    Object.prototype.hasOwnProperty.call(message, "result") ||
    Object.prototype.hasOwnProperty.call(message, "error")
  ) {
    if (!Object.prototype.hasOwnProperty.call(message, "id")) {
      throw {
        code: ErrorCode.INVALID_REQUEST,
        message: "Response must have id",
      };
    }
  }

  return true;
}

/**
 * MCP 協議處理器類別
 */
export class MCPProtocolHandler {
  constructor() {
    this.initialized = false;
    this.toolManager = getToolManager();

    // MCP 能力宣告
    this.capabilities = {
      tools: {},
      resources: {},
      prompts: {},
    };

    // 舊的集合保留用於資源和提示
    this.resources = new Map();
    this.prompts = new Map();
  }

  /**
   * 獲取工具集合（從工具管理器）
   */
  get tools() {
    const toolsMap = new Map();
    const toolsList = this.toolManager.getToolsList();

    for (const tool of toolsList) {
      toolsMap.set(tool.name, tool);
    }

    return toolsMap;
  }

  /**
   * 處理 MCP 訊息
   */
  async handleMessage(message) {
    try {
      validateMessage(message);

      // 處理不同的訊息方法
      switch (message.method) {
        case "initialize":
          return await this.handleInitialize(message);

        case "tools/list":
          return await this.handleToolsList(message);

        case "tools/call":
          return await this.handleToolsCall(message);

        case "resources/list":
          return await this.handleResourcesList(message);

        case "prompts/list":
          return await this.handlePromptsList(message);

        default:
          throw {
            code: ErrorCode.METHOD_NOT_FOUND,
            message: `Method '${message.method}' not found`,
          };
      }
    } catch (error) {
      logger.error("MCP protocol error:", error);
      return createResponse(message.id, null, error);
    }
  }

  /**
   * 處理初始化請求
   */
  async handleInitialize(message) {
    const { params } = message;

    this.initialized = true;

    const result = {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: this.capabilities,
      serverInfo: {
        name: "SFDA MCP Server",
        version: "1.0.0",
      },
    };

    logger.info("MCP protocol initialized", {
      clientInfo: params?.clientInfo,
      capabilities: this.capabilities,
    });

    return createResponse(message.id, result);
  }

  /**
   * 處理工具列表請求
   */
  async handleToolsList(message) {
    const tools = Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));

    return createResponse(message.id, { tools });
  }

  /**
   * 處理工具調用請求
   */
  async handleToolsCall(message) {
    const { params } = message;

    if (!params?.name) {
      throw {
        code: ErrorCode.INVALID_PARAMS,
        message: "Tool name is required",
      };
    }

    try {
      // 使用工具管理器調用工具
      const result = await this.toolManager.callTool(
        params.name,
        params.arguments || {},
      );

      return createResponse(message.id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      });
    } catch (error) {
      // 處理工具執行錯誤
      if (error instanceof ToolExecutionError) {
        throw {
          code: ErrorCode.TOOL_EXECUTION_ERROR,
          message: error.message,
          data: {
            toolName: params.name,
            errorType: error.type,
            details: error.details,
          },
        };
      }

      // 其他錯誤
      throw {
        code: ErrorCode.TOOL_EXECUTION_ERROR,
        message: `Tool execution failed: ${error.message}`,
        data: { toolName: params.name, error: error.message },
      };
    }
  }

  /**
   * 處理資源列表請求
   */
  async handleResourcesList(message) {
    const resources = Array.from(this.resources.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    }));

    return createResponse(message.id, { resources });
  }

  /**
   * 處理提示範本列表請求
   */
  async handlePromptsList(message) {
    const prompts = Array.from(this.prompts.values()).map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    }));

    return createResponse(message.id, { prompts });
  }

  /**
   * 註冊工具
   */
  registerTool(name, tool) {
    this.tools.set(name, {
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: tool.execute,
    });

    logger.info(`Tool registered: ${name}`);
  }

  /**
   * 註冊資源
   */
  registerResource(uri, resource) {
    this.resources.set(uri, {
      uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
      read: resource.read,
    });

    logger.info(`Resource registered: ${uri}`);
  }

  /**
   * 註冊提示範本
   */
  registerPrompt(name, prompt) {
    this.prompts.set(name, {
      name,
      description: prompt.description,
      arguments: prompt.arguments,
      generate: prompt.generate,
    });

    logger.info(`Prompt registered: ${name}`);
  }
}
