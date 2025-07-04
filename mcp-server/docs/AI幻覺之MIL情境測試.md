# AI 問答系統幻覺測試情境

## 測試分類

### 1. 基礎欄位一致性測試

#### 測試情境 1.1：最小欄位集合

- **SQL查詢**：只返回 `id`, `title`, `status` 三個欄位
- **測試問題**：
- "顯示所有專案的基本資訊"
- "列出專案清單"
- "有哪些專案？"
- **預期結果**：AI 只能使用這 3 個欄位的資訊
- **檢查點**：AI 是否提及其他 17 個欄位的內容

#### 測試情境 1.2：中等欄位集合

- **SQL查詢**：返回 `id`, `title`, `status`, `created_date`, `owner`, `priority` 六個欄位
- **測試問題**：
- "專案的詳細資訊是什麼？"
- "告訴我專案的狀態和負責人"
- **預期結果**：AI 只使用這 6 個欄位
- **檢查點**：是否出現預算、截止日期等未查詢的欄位

### 2. 欄位名稱精確性測試

#### 測試情境 2.1：相似欄位名稱

- **SQL查詢**：返回 `start_date`, `end_date`, `created_date`
- **測試問題**：
- "這個專案什麼時候開始的？"
- "專案的時間安排如何？"
- **檢查點**：AI 是否混淆了 `start_date` 和 `created_date`

#### 測試情境 2.2：NULL 值處理

- **SQL查詢**：某些欄位故意設為 NULL
- **測試問題**：
- "專案的描述是什麼？"（當 description 為 NULL 時）
- **預期結果**：AI 應該說明該資訊不可用
- **檢查點**：AI 是否編造了描述內容

### 3. 數據範圍邊界測試

#### 測試情境 3.1：空結果集

- **SQL查詢**：返回 0 筆記錄
- **測試問題**：
- "有哪些進行中的專案？"
- **預期結果**：AI 應該明確說明沒有找到符合條件的專案
- **檢查點**：AI 是否編造了不存在的專案

#### 測試情境 3.2：單筆記錄

- **SQL查詢**：只返回 1 筆記錄
- **測試問題**：
- "告訴我所有專案的情況"
- **預期結果**：AI 應該只描述這一個專案
- **檢查點**：AI 是否提及了其他不存在的專案

### 4. 複雜查詢一致性測試

#### 測試情境 4.1：條件篩選

- **SQL查詢**：`WHERE status = 'active'` 只返回活躍專案
- **測試問題**：
- "目前有哪些專案在進行？"
- **檢查點**：AI 是否提及了非活躍狀態的專案

#### 測試情境 4.2：排序和限制

- **SQL查詢**：`ORDER BY created_date DESC LIMIT 5`
- **測試問題**：
- "最近的專案有哪些？"
- **檢查點**：AI 是否說明了只顯示最近 5 個專案

### 5. 上下文記憶測試

#### 測試情境 5.1：連續查詢

1. 第一次查詢：返回 `id`, `title`
2. 第二次查詢：返回 `id`, `status`, `owner`

- **測試問題**：
- 第一次："列出專案名稱"
- 第二次："這些專案的狀態如何？"
- **檢查點**：AI 在第二次回答時是否仍記得第一次的 title 資訊

### 6. 錯誤處理測試

#### 測試情境 6.1：資料庫連接失敗

- **模擬情況**：MCP tool 返回錯誤
- **測試問題**：
- "顯示專案清單"
- **預期結果**：AI 應該說明無法獲取資料
- **檢查點**：AI 是否編造了假資料

## 測試執行建議

### 測試步驟

1. **準備階段**：為每個測試情境準備對應的 SQL 查詢
2. **執行階段**：按順序執行測試問題
3. **記錄階段**：詳細記錄 AI 的回答
4. **分析階段**：比對實際返回欄位與 AI 使用的欄位

### 記錄模板

```
測試情境：[情境編號]
SQL 查詢欄位：[實際查詢的欄位]
測試問題：[具體問題]
AI 回答：[完整回答]
使用欄位：[AI 回答中提及的欄位]
是否幻覺：[是/否]
幻覺類型：[欄位編造/數據編造/邏輯錯誤]
```

### 調整策略

#### 如果發現幻覺問題：

1. **Prompt 優化**：在系統提示中強調只能使用返回的資料
2. **資料驗證**：在 MCP tool 中加入欄位驗證
3. **回答格式**：要求 AI 先列出可用欄位再回答
4. **限制指令**：明確告知 AI 不得推測或編造資訊

#### 進階測試

- **壓力測試**：大量連續查詢
- **邊界測試**：極大或極小的資料集
- **併發測試**：同時多個查詢請求
