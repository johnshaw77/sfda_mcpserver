# Copilot Custom Instructions

- 永遠用繁體中文回覆
- git 的自動產生訊息也使用繁體文
- js 程式碼使用「雙引號」，不使用單引號
- 不要使用 TypeScript
## 專案簡介

這是一個使用 JavaScript (Node.js) 開發的後端 API 專案。  
請優先考慮使用現代 JavaScript 語法（如 ES6+），並遵循最佳實踐。

## 技術棧

- Node.js
- Express.js（如有用到）
- 主要語言為 JavaScript
- 資料庫（測試用 SQLite ）

## 風格與慣例

- 使用 async/await 進行非同步操作
- 優先使用 ES6+ 語法（例如：let/const、箭頭函式、解構賦值、模板字串等）
- 請加入適當的錯誤處理（try/catch 或中介層）
- API 路由請清楚分層（如：/api/users、/api/products）
- 輸出 JSON 格式的回應
- 適當撰寫註解，說明複雜邏輯
- 遵循 RESTful API 設計原則

## 你可以這樣協助我

- 撰寫連接資料庫的程式碼，不使用 ORM, 使用原生 SQL
- 撰寫單元測試（如有用到 Jest 等）

## 範例

```js
// 建立一個新的使用者
router.post("/api/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

## 其他注意事項

- 不要產生前端相關程式碼
- 不要使用 TypeScript
- 請不要產生與專案無關的內容
