/**
 * Jest 測試環境設置
 */

import { jest } from "@jest/globals";

// 設置全域 fetch 模擬
globalThis.fetch = jest.fn();

// 簡單的 Response, 模擬實現
globalThis.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Map(Object.entries(init.headers || {}));
    this.statusText = init.statusText || "OK";
  }

  async json() {
    return typeof this.body === "string" ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === "string"
      ? this.body
      : JSON.stringify(this.body);
  }
};

// 設置 setTimeout 為全域可用
// globalThis.setTimeout = setTimeout;
// globalThis.clearTimeout = clearTimeout;
