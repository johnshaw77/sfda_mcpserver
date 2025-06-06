import { describe, test, expect } from "@jest/globals";
import config from "../src/config/config.js";

describe("配置模組", () => {
  test("應該有預設值", () => {
    expect(config.port).toBeDefined();
    expect(config.nodeEnv).toBeDefined();
    expect(config.logLevel).toBeDefined();
  });

  test("isDevelopment() 方法應該正常運作", () => {
    expect(typeof config.isDevelopment()).toBe("boolean");
  });

  test("isProduction() 方法應該正常運作", () => {
    expect(typeof config.isProduction()).toBe("boolean");
  });

  test("validate() 方法應該正常運作", () => {
    expect(() => config.validate()).not.toThrow();
  });
});
