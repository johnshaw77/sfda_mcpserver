/**
 * 工具系統測試
 *
 * 測試基礎工具類別、工具管理器和具體工具實作
 */

import {
  BaseTool,
  ToolExecutionError,
  ToolErrorType,
} from "../src/tools/base-tool.js";
import { ToolManager } from "../src/tools/tool-manager.js";
import { GetEmployeeInfoTool } from "../src/tools/hr/get-employee-info.js";

describe("工具系統測試", () => {
  describe("BaseTool 基礎工具測試", () => {
    class TestTool extends BaseTool {
      constructor() {
        super("test_tool", "測試工具", {
          type: "object",
          properties: {
            value: { type: "string" },
            count: { type: "number" },
          },
          required: ["value"],
        });
      }

      async _execute(params) {
        if (params.value === "error") {
          throw new Error("Test error");
        }
        return { result: `Hello ${params.value}` };
      }
    }

    let testTool;

    beforeEach(() => {
      testTool = new TestTool();
    });

    test("應該正確初始化工具", () => {
      expect(testTool.name).toBe("test_tool");
      expect(testTool.description).toBe("測試工具");
      expect(testTool.inputSchema).toBeDefined();
    });

    test("應該驗證輸入參數", () => {
      // 正確參數
      expect(() => testTool.validateInput({ value: "test" })).not.toThrow();

      // 缺少必要參數
      expect(() => testTool.validateInput({})).toThrow(ToolExecutionError);

      // 錯誤的參數類型
      expect(() => testTool.validateInput({ value: 123 })).toThrow(
        ToolExecutionError,
      );
    });

    test("應該成功執行工具", async () => {
      const result = await testTool.execute({ value: "world" });

      expect(result.success).toBe(true);
      expect(result.result.result).toBe("Hello world");
      expect(result.toolName).toBe("test_tool");
      expect(result.executionId).toBeDefined();
    });

    test("應該處理執行錯誤", async () => {
      await expect(testTool.execute({ value: "error" })).rejects.toThrow();
    });

    test("應該記錄執行歷史", async () => {
      await testTool.execute({ value: "test1" });
      try {
        await testTool.execute({ value: "error" });
      } catch (e) {
        // 忽略錯誤
      }

      const history = testTool.getExecutionHistory();
      expect(history.length).toBe(2);
      expect(testTool.stats.totalExecutions).toBe(2);
    });
  });

  describe("ToolManager 工具管理器測試", () => {
    let toolManager;
    let testTool;

    beforeEach(() => {
      toolManager = new ToolManager();
      testTool = new (class extends BaseTool {
        constructor() {
          super("test_tool", "測試工具", {
            type: "object",
            properties: { value: { type: "string" } },
            required: ["value"],
          });
        }
        async _execute(params) {
          return { echo: params.value };
        }
      })();
    });

    test("應該註冊工具", () => {
      toolManager.registerTool(testTool);

      expect(toolManager.hasTool("test_tool")).toBe(true);
      expect(toolManager.getTool("test_tool")).toBe(testTool);
    });

    test("應該列出所有工具", () => {
      toolManager.registerTool(testTool);

      const tools = toolManager.getToolsList();
      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe("test_tool");
    });

    test("應該調用工具", async () => {
      toolManager.registerTool(testTool);

      const result = await toolManager.callTool("test_tool", {
        value: "hello",
      });
      expect(result.success).toBe(true);
      expect(result.result.echo).toBe("hello");
    });

    test("應該處理不存在的工具", async () => {
      await expect(toolManager.callTool("nonexistent", {})).rejects.toThrow(
        ToolExecutionError,
      );
    });

    test("應該獲取統計資料", async () => {
      toolManager.registerTool(testTool);
      await toolManager.callTool("test_tool", { value: "test" });

      const stats = toolManager.getGlobalStats();
      expect(stats.totalExecutions).toBe(1);
      expect(stats.totalSuccesses).toBe(1);
    });
  });

  describe("GetEmployeeInfoTool HR工具測試", () => {
    let hrTool;

    beforeEach(() => {
      hrTool = new GetEmployeeInfoTool();
    });

    test("應該正確初始化HR工具", () => {
      expect(hrTool.name).toBe("get_employee_info");
      expect(hrTool.description).toContain("員工基本資訊");
      expect(hrTool.inputSchema.required).toContain("employeeId");
    });

    test("應該驗證員工編號格式", () => {
      // 正確格式
      expect(() =>
        hrTool.validateInput({ employeeId: "A123456" }),
      ).not.toThrow();

      // 錯誤格式
      expect(() => hrTool.validateInput({ employeeId: "123456" })).toThrow(
        ToolExecutionError,
      );
      expect(() => hrTool.validateInput({ employeeId: "AB123456" })).toThrow(
        ToolExecutionError,
      );
      expect(() => hrTool.validateInput({ employeeId: "A12345" })).toThrow(
        ToolExecutionError,
      );
    });

    test("應該查詢存在的員工資訊", async () => {
      const result = await hrTool.execute({ employeeId: "A123456" });

      expect(result.success).toBe(true);
      expect(result.result.employeeId).toBe("A123456");
      expect(result.result.data.basic).toBeDefined();
      expect(result.result.data.basic.name).toBe("張小明");
    });

    test("應該處理不存在的員工", async () => {
      await expect(hrTool.execute({ employeeId: "A999999" })).rejects.toThrow(
        ToolExecutionError,
      );
    });

    test("應該支援欄位篩選", async () => {
      const result = await hrTool.execute({
        employeeId: "A123456",
        fields: ["basic"],
      });

      expect(result.result.data.basic).toBeDefined();
      expect(result.result.data.contact).toBeUndefined();
    });

    test("應該支援簡化模式", async () => {
      const result = await hrTool.execute({
        employeeId: "A123456",
        includeDetails: false,
      });

      expect(result.result.data.basic.name).toBe("張小明");
      expect(result.result.data.basic.birthDate).toBeUndefined();
    });
  });
});
