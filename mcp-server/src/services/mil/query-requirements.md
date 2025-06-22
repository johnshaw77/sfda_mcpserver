# MIL 查詢需求規格書

## 最新更新 (2025年6月24日)

### ✅ 已完成的功能擴充

#### 1. 地點查詢功能 (`location`)

- **實作狀態**: ✅ 已完成並測試
- **支援類型**: 模糊查詢（LIKE 語法）
- **使用範例**:
  ```javascript
  // 查詢A棟相關案件
  { location: "A棟", limit: 20 }
  ```
- **測試結果**: 成功查詢到 9 筆包含「A棟」的案件

#### 2. 申請狀態查詢功能 (`isApply`)

- **實作狀態**: ✅ 已完成並測試
- **支援類型**: 精確查詢（"Y" 或 "N"）
- **使用範例**:

  ```javascript
  // 查詢已申請結案案件
  { isApply: "Y", limit: 50 }

  // 查詢未申請結案案件
  { isApply: "N", limit: 50 }
  ```

- **測試結果**:
  - 已申請結案 (Y): 54 筆
  - 未申請結案 (N): 1041 筆

#### 3. 負責人查詢功能 (`driName`, `driEmpNo`, `driDept`)

- **實作狀態**: ✅ 已完成並測試
- **支援類型**:
  - `driName`: 模糊查詢
  - `driEmpNo`: 精確查詢
  - `driDept`: 精確查詢
- **測試結果**: 所有查詢均正常運作，結果一致

### 📊 功能測試總結

所有新增功能已通過完整測試：

- ✅ **服務層測試通過** (`mil-service.js`)
- ✅ **MCP工具層測試通過** (`get-mil-list.js`)
- ✅ **結果一致性驗證通過** (Service層與Tool層結果100%一致)
- ✅ **組合查詢測試通過** (多條件同時使用)

### 🎯 查詢能力現狀

目前 `get-mil-list` 工具支援的所有查詢參數：

- ✅ `typeName`: MIL 類別
- ✅ `status`: 處理狀態
- ✅ `proposalFactory`: 提案廠別
- ✅ `proposerName`: 提出人姓名
- ✅ `serialNumber`: MIL 編號
- ✅ `importance`: 重要度
- ✅ `delayDayMin`/`delayDayMax`: 延遲天數範圍
- ✅ `driName`: 負責人姓名 **[新增]**
- ✅ `driEmpNo`: 負責人工號 **[新增]**
- ✅ `driDept`: 負責部門 **[新增]**
- ✅ `location`: 地點查詢 **[新增]**
- ✅ `isApply`: 申請狀態查詢 **[新增]**

## 資料表結構說明

基於現有的 MIL (Manufacturing Issue List) 資料表，包含以下主要欄位：

- 基本資訊：SerialNumber, TypeName, MidTypeName
- 狀態資訊：Status, Importance, is_APPLY
- 時間資訊：RecordDate, PlanFinishDate, ChangeFinishDate, ActualFinishDate
- 延遲資訊：DelayDay, naqi_num
- 人員資訊：Proposer*\*, DRI*\*
- 內容資訊：IssueDiscription, Solution, Remark, Location

## 現有工具功能說明

### 🔧 核心工具：get-mil-list

現有的 `get-mil-list` 工具已經非常強大，支援多種查詢條件：

#### 基本參數

- `page`: 頁數（預設 1）
- `limit`: 每頁筆數（預設 100）
- `typeName`: MIL 類別篩選
- `status`: 處理狀態篩選
- `proposalFactory`: 廠別篩選
- `proposerName`: 提出人姓名（模糊查詢）
- `serialNumber`: MIL 編號（模糊查詢）
- `importance`: 優先級篩選

#### 延遲查詢參數

- `delayDayMin`: 最小延遲天數（DelayDay >= 此值）
- `delayDayMax`: 最大延遲天數（DelayDay <= 此值）
- `delayDay`: 向後兼容參數（DelayDay >= 此值）

#### 負責人查詢參數 ✨ 新增

- `driName`: 負責人姓名（模糊查詢）
- `driEmpNo`: 負責人工號（精確查詢）
- `driDept`: 負責部門（精確查詢）

#### 地點與申請狀態參數 ✨ 新增

- `location`: 地點/區域（模糊查詢）
- `isApply`: 是否已申請結案（"Y" 或 "N"）

## 常見查詢場景實作方法

### 1. 延遲管理相關查詢

#### 1.1 延遲案件查詢 ✅ 已支援

**需求**：查詢延遲天數大於指定天數的案件
**實作方法**：

```javascript
// 查詢延遲超過 10 天的案件
await mcp.callTool("get-mil-list", {
  delayDayMin: 11, // 大於 10 天 = >= 11 天
  limit: 20,
});
```

#### 1.2 延遲範圍查詢 ✅ 已支援

**需求**：查詢特定延遲天數範圍的案件
**實作方法**：

```javascript
// 查詢延遲 5-30 天的案件
await mcp.callTool("get-mil-list", {
  delayDayMin: 5,
  delayDayMax: 30,
  limit: 50,
});
```

#### 1.3 高優先級延遲案件 ✅ 已支援

**需求**：查詢高優先級且有延遲的案件
**實作方法**：

```javascript
// 查詢高優先級延遲案件
await mcp.callTool("get-mil-list", {
  importance: "H",
  delayDayMin: 1, // 有任何延遲
  limit: 20,
});
```

### 2. 狀態與優先級查詢

#### 2.1 優先級案件查詢 ✅ 已支援

**實作方法**：

```javascript
// 查詢高優先級案件
await mcp.callTool("get-mil-list", {
  importance: "H",
  limit: 50,
});
```

#### 2.2 狀態統計查詢 ✅ 已支援

**使用現有工具**：`get-status-report`

#### 2.3 未結案案件查詢 ✅ 已支援

**實作方法**：

```javascript
// 查詢進行中的案件
await mcp.callTool("get-mil-list", {
  status: "OnGoing",
  limit: 100,
});
```

### 3. 人員與部門查詢

#### 3.1 負責人案件查詢 ✅ 已支援

**實作方法**：

```javascript
// 按負責人姓名查詢（模糊查詢）
await mcp.callTool("get-mil-list", {
  driName: "張三",
  limit: 20,
});

// 按負責人工號查詢（精確查詢）
await mcp.callTool("get-mil-list", {
  driEmpNo: "U0700034",
  limit: 20,
});

// 按負責部門查詢
await mcp.callTool("get-mil-list", {
  driDept: "品保處",
  limit: 20,
});
```

#### 3.2 部門案件查詢 ✅ 部分支援

**已支援**：

- `driDept`: 負責部門查詢

**建議未來新增**：

- `proposerDept`: 提出部門查詢

#### 3.3 廠別案件查詢 ✅ 已支援

**實作方法**：

```javascript
// 查詢特定廠別的案件
await mcp.callTool("get-mil-list", {
  proposalFactory: "KS",
  limit: 50,
});
```

### 4. 地點與申請狀態查詢 ✨ 新增

### 4. 地點與申請狀態查詢 ✨ 新增

#### 4.1 地點查詢 ✅ 已支援

**實作方法**：

```javascript
// 按地點查詢（模糊查詢）
await mcp.callTool("get-mil-list", {
  location: "A棟",
  limit: 20,
});

// 查詢包含特定關鍵字的地點
await mcp.callTool("get-mil-list", {
  location: "2F",
  limit: 30,
});
```

#### 4.2 申請狀態查詢 ✅ 已支援

**實作方法**：

```javascript
// 查詢已申請結案的案件
await mcp.callTool("get-mil-list", {
  isApply: "Y",
  limit: 50,
});

// 查詢未申請結案的案件
await mcp.callTool("get-mil-list", {
  isApply: "N",
  limit: 50,
});
```

### 5. MIL 類別查詢

#### 5.1 MIL 類別查詢 ✅ 已支援

**實作方法**：

```javascript
// 查詢特定類別的案件
await mcp.callTool("get-mil-list", {
  typeName: "品質ISSUE管理",
  limit: 30,
});
```

#### 5.2 類別統計查詢 ✅ 已支援

**使用現有工具**：

```javascript
await mcp.callTool("get-count-by", {
  columnName: "TypeName",
});
```

## 複雜查詢範例 ✨ 新增

### 組合查詢範例

#### 1. 地點 + 申請狀態 + 延遲查詢

```javascript
// 查詢A棟未申請結案且延遲的案件
await mcp.callTool("get-mil-list", {
  location: "A棟",
  isApply: "N",
  delayDayMin: 1,
  limit: 20,
});
```

#### 2. 負責人 + 優先級 + 狀態查詢

```javascript
// 查詢特定負責人的高優先級進行中案件
await mcp.callTool("get-mil-list", {
  driName: "張三",
  importance: "H",
  status: "OnGoing",
  limit: 10,
});
```

#### 3. 地點 + 負責部門 + 申請狀態查詢

```javascript
// 查詢特定地點品保處負責且未申請結案的案件
await mcp.callTool("get-mil-list", {
  location: "2F",
  driDept: "品保處",
  isApply: "N",
  limit: 15,
});
```

## 已實作功能總結

### ✅ 完全支援的查詢類型

1. **基本查詢**：編號、類別、狀態、廠別、優先級
2. **延遲查詢**：延遲天數範圍查詢
3. **負責人查詢**：姓名、工號、部門
4. **地點查詢**：地點/區域模糊查詢
5. **申請狀態查詢**：是否已申請結案
6. **組合查詢**：多條件同時查詢
7. **分頁查詢**：大數據量分頁處理

## 建議的未來擴展功能

### 需要在 get-mil-list 中新增的參數

#### 1. 時間範圍查詢

```javascript
recordDateStart: "記錄日期起始（YYYY-MM-DD）",
recordDateEnd: "記錄日期結束（YYYY-MM-DD）",
planFinishDateStart: "計劃完成日期起始",
planFinishDateEnd: "計劃完成日期結束"
driEmpNo: "負責人工號",
driDept: "負責部門",
driSuperiorDept: "負責人上級部門"
```

#### 2. 部門相關參數

```javascript
proposerDept: "提出部門",
proposerSuperiorDept: "提出人上級部門"
```

#### 3. 地點相關參數

```javascript
location: "地點/區域（模糊查詢）";
```

#### 4. 時間相關參數

```javascript
recordDateStart: "提出日期起始",
recordDateEnd: "提出日期結束",
planFinishDateStart: "預計完成日期起始",
planFinishDateEnd: "預計完成日期結束"
```

#### 5. 申請狀態參數

```javascript
isApply: "是否已申請結案（Y/N）";
```

### 實作優先順序

#### 🔥 高優先級（立即實作）

1. **負責人查詢參數** - `driName`, `driEmpNo`
2. **部門查詢參數** - `proposerDept`, `driDept`
3. **地點查詢參數** - `location`

#### 🟡 中優先級（後續實作）

4. **時間範圍查詢** - 日期範圍參數
5. **申請狀態查詢** - `isApply` 參數

#### 🟢 低優先級（按需實作）

6. **進階統計功能** - 自定義統計維度
7. **趨勢分析功能** - 時間序列統計

## 使用範例

### 常見業務場景

#### 管理層查詢

```javascript
// 查詢高優先級延遲案件
{
  importance: "H",
  delayDayMin: 5,
  status: "OnGoing",
  limit: 20
}

// 查詢特定部門的逾期案件
{
  driDept: "品保處",
  delayDayMin: 1,
  limit: 30
}
```

#### 負責人查詢

```javascript
// 查詢我負責的進行中案件
{
  driName: "張三",
  status: "OnGoing",
  limit: 50
}
```

#### 分析查詢

```javascript
// 查詢特定類別的延遲分布
{
  typeName: "品質ISSUE管理",
  delayDayMin: 0,
  limit: 100
}
```

## 結論

通過擴展現有的 `get-mil-list` 工具，我們可以滿足大部分查詢需求，避免創建重複的功能。重點是要：

1. **優化現有工具** - 在 `get-mil-list` 中新增必要的查詢參數
2. **避免功能重複** - 不另外創建專門的查詢工具
3. **保持一致性** - 統一的參數命名和回應格式
4. **文檔完善** - 清楚說明各種查詢場景的實作方法

這種方法既能滿足業務需求，又能保持代碼的簡潔和維護性。
