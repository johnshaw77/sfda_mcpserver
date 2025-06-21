# MCP 服務容錯機制改進總結

## 問題描述

原本的 MCP 服務架構中，當註冊了三個 MCP 服務時，如果其中一個服務的資料庫連線失敗，會導致整個系統無法啟動，影響其他正常服務的運行。

## 解決方案

實施了多層次的容錯機制，確保單個服務的失敗不會影響整個系統的可用性。

## 具體改進

### 1. 資料庫服務層 (`src/services/database.js`)

**主要改進：**

- ✅ **獨立初始化**：每個資料庫連接獨立處理，互不影響
- ✅ **容錯處理**：單個資料庫失敗不會阻止其他資料庫初始化
- ✅ **狀態檢查**：新增 `isDatabaseAvailable(dbName)` 方法
- ✅ **安全連接**：新增 `getConnection(dbName)` 安全連接方法
- ✅ **詳細回報**：返回每個資料庫的初始化結果

**新增方法：**

```javascript
// 檢查資料庫是否可用
isDatabaseAvailable(dbName) {
    return this.pools.has(dbName);
}

// 安全地獲取資料庫連接
async getConnection(dbName) {
    if (!this.isDatabaseAvailable(dbName)) {
        throw new Error(`資料庫 ${dbName} 不可用`);
    }
    return this.pools.get(dbName);
}
```

### 2. 基礎工具類別 (`src/tools/base-tool.js`)

**主要改進：**

- ✅ **資料庫依賴聲明**：新增 `requiredDatabases` 屬性
- ✅ **執行前檢查**：自動檢查所需資料庫可用性
- ✅ **詳細錯誤訊息**：提供明確的失敗原因
- ✅ **模組歸屬**：明確工具所屬模組

**新增功能：**

```javascript
constructor(name, description, inputSchema, options = {}) {
    // ... 原有屬性
    this.module = options.module || "other";
    this.requiredDatabases = options.requiredDatabases || [];
}

// 檢查所需資料庫是否可用
async checkDatabaseAvailability() {
    // 檢查邏輯...
}
```

### 3. 伺服器啟動邏輯 (`src/server.js`)

**主要改進：**

- ✅ **容錯啟動**：資料庫初始化失敗不阻止伺服器啟動
- ✅ **增強健康檢查**：詳細的系統狀態報告
- ✅ **工具健康檢查**：新增 `/api/tools/health` 端點
- ✅ **狀態追踪**：記錄詳細的初始化結果

**新增端點：**

- `GET /health` - 增強的系統健康檢查
- `GET /api/tools/health` - 工具可用性檢查
- `GET /api/tools/stats` - 工具統計資訊

### 4. 工具配置更新

**HR 工具模組：**

```javascript
// HR 相關工具配置
{
    module: "hr",
    requiredDatabases: ["qms"]
}
```

**MIL 工具模組：**

```javascript
// MIL 相關工具配置
{
    module: "mil",
    requiredDatabases: ["mil"]
}
```

## 容錯機制運作流程

### 啟動階段

1. 📡 嘗試連接所有配置的資料庫
2. 🔍 記錄每個資料庫的連接結果
3. ✅ 只要有一個資料庫成功，服務就正常啟動
4. 📝 失敗的資料庫會記錄錯誤但不阻止啟動

### 工具執行階段

1. 🛠️ 工具被調用時先檢查所需資料庫
2. ❌ 如果所需資料庫不可用，返回明確錯誤訊息
3. ✅ 如果資料庫可用，正常執行工具邏輯
4. 🔄 其他不依賴該資料庫的工具正常運作

## 效果展示場景

### 場景一：QMS 資料庫連接失敗

- ❌ HR 相關工具 (get_employee, search_employees 等) 不可用
- ✅ MIL 相關工具仍然正常運作 (如果 MIL 資料庫正常)
- ✅ 其他不需要資料庫的工具正常運作

### 場景二：MIL 資料庫連接失敗

- ❌ MIL 相關工具 (get-mil-list, get-equipment-list 等) 不可用
- ✅ HR 相關工具仍然正常運作 (如果 QMS 資料庫正常)
- ✅ 其他不需要資料庫的工具正常運作

### 場景三：所有資料庫連接失敗

- ❌ 所有需要資料庫的工具不可用
- ✅ 伺服器仍然正常啟動和運行
- ✅ 健康檢查端點正常回應
- ✅ 可以監控各個組件的狀態

## 監控端點

### 健康檢查

- `GET /health` - 完整的系統健康狀態
- `GET /api/tools/health` - 詳細的工具可用性檢查
- `GET /api/tools/stats` - 工具統計資訊

### 狀態資訊包含

- 🔗 各個資料庫的連接狀態
- 🛠️ 每個工具的可用性
- 📊 按模組分組的工具統計
- ❌ 不可用工具的原因分析

## 使用建議

1. **定期監控**：檢查 `/api/tools/health` 了解系統狀態
2. **日誌監控**：關注資料庫連接警告
3. **環境變數**：設定 `REQUIRE_DB=true` 啟用生產環境嚴格模式
4. **開發調試**：在開發環境下允許部分服務失敗以便調試

## 改進成果

✅ **單點故障已消除** - 不再因為單個資料庫失敗導致整個系統不可用
✅ **系統彈性大幅提升** - 部分服務失敗時，其他服務仍可正常運行
✅ **故障排除更加容易** - 詳細的狀態報告幫助快速定位問題
✅ **服務可用性大幅改善** - 最大化系統的可用性

## 技術特點

- **漸進式降級**：系統會根據可用資源自動調整服務範圍
- **詳細錯誤回報**：提供明確的錯誤原因和建議
- **模組化架構**：按功能模組組織，便於管理和維護
- **自動化檢查**：工具執行前自動檢查依賴的資源

現在您的 MCP 服務具備了強大的容錯能力，即使某個資料庫服務出現問題，其他服務仍然可以正常運行！
