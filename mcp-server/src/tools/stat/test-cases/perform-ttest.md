# T 檢定工具測試案例

## 工具概述
T 檢定是用於比較平均數差異的統計方法，適用於小樣本或母體標準差未知的情況。

## 統計專業情境

### 情境 1: 新藥療效評估（配對樣本 t 檢定）
**研究背景**: 評估新降血壓藥物的療效
**研究設計**: 配對樣本設計，比較同一組患者用藥前後的血壓差異
**假設**: H₀: μ_diff = 0 vs H₁: μ_diff ≠ 0

**測試數據**:
```json
{
  "group1": [142, 138, 155, 148, 162, 151, 145, 139, 158, 147, 144, 153, 160, 149, 156],
  "group2": [135, 132, 148, 141, 154, 143, 138, 133, 150, 140, 137, 146, 152, 142, 149],
  "paired": true,
  "alpha": 0.05,
  "alternative": "two-sided",
  "context": {
    "scenario": "medical",
    "variable_name": "收縮壓 (mmHg)",
    "group1_name": "用藥前",
    "group2_name": "用藥後"
  }
}
```

### 情境 2: 獨立樣本 t 檢定（教育研究）
**研究背景**: 比較兩種教學方法對學習成效的影響
**研究設計**: 獨立樣本設計
**假設**: H₀: μ₁ = μ₂ vs H₁: μ₁ ≠ μ₂

**測試數據**:
```json
{
  "group1": [85, 92, 78, 88, 91, 87, 83, 90, 86, 89, 84, 93, 81, 88, 87],
  "group2": [92, 95, 89, 94, 97, 91, 88, 96, 93, 98, 90, 94, 87, 95, 92],
  "paired": false,
  "alpha": 0.05,
  "alternative": "two-sided",
  "context": {
    "scenario": "education", 
    "variable_name": "考試成績",
    "group1_name": "傳統教學",
    "group2_name": "互動式教學"
  }
}
```

## 一般用戶情境

### 情境 1: 減重效果評估
**生活情境**: 想知道新的減重方法是否真的有效果
**數據**: 10 個人減重前後的體重記錄

**測試數據**:
```json
{
  "group1": [75.2, 82.1, 68.5, 91.3, 77.8, 85.6, 73.4, 79.9, 88.2, 71.7],
  "group2": [72.8, 79.5, 66.1, 88.7, 75.3, 82.9, 70.8, 77.2, 85.1, 69.4],
  "paired": true,
  "alpha": 0.05,
  "alternative": "two-sided",
  "context": {
    "scenario": "general",
    "variable_name": "體重 (公斤)",
    "group1_name": "減重前",
    "group2_name": "減重後"
  }
}
```

### 情境 2: 兩班學生成績比較
**生活情境**: 想比較 A 班和 B 班學生的數學成績是否有差異
**數據**: 兩班學生的數學成績

**測試數據**:
```json
{
  "group1": [78, 85, 92, 76, 88, 83, 90, 79, 86, 81, 87, 84, 91, 77, 89],
  "group2": [82, 89, 95, 80, 92, 87, 94, 83, 90, 85, 91, 88, 95, 81, 93],
  "paired": false,
  "alpha": 0.05,
  "alternative": "two-sided",
  "context": {
    "scenario": "education",
    "variable_name": "數學成績",
    "group1_name": "A 班",
    "group2_name": "B 班"
  }
}
```

## 單樣本 t 檢定

### 情境 3: 品質管控（統計專業）
**研究背景**: 檢驗產品規格是否符合標準
**假設**: H₀: μ = 100 vs H₁: μ ≠ 100

**測試數據**:
```json
{
  "group1": [98.5, 101.2, 99.8, 100.5, 97.9, 102.1, 99.4, 100.8, 98.7, 101.5, 99.1, 100.3, 98.9, 101.7, 99.6],
  "mu": 100,
  "alpha": 0.05,
  "alternative": "two-sided",
  "context": {
    "scenario": "quality",
    "variable_name": "產品重量 (克)",
    "test_type": "one-sample"
  }
}
```

### 情境 4: 咖啡店每日營業額（一般用戶）
**生活情境**: 想知道咖啡店的平均每日營業額是否達到目標 15000 元
**數據**: 15 天的營業額記錄

**測試數據**:
```json
{
  "group1": [14200, 15800, 13900, 16100, 14700, 15300, 13800, 15900, 14500, 16200, 14100, 15600, 13700, 15400, 14800],
  "mu": 15000,
  "alpha": 0.05,
  "alternative": "two-sided",
  "context": {
    "scenario": "general",
    "variable_name": "每日營業額 (元)",
    "test_type": "one-sample"
  }
}
```

## 預期結果

### 統計專業用戶期望看到：
- 詳細的統計量（t 值、自由度、p 值）
- 效果量（Cohen's d）
- 置信區間
- 假設檢定步驟說明
- 統計功效分析建議

### 一般用戶期望看到：
- 簡單明瞭的結論（有顯著差異/無顯著差異）
- 生活化的解釋
- 圖表視覺化
- 實際意義說明
- 改進建議

## 測試指令範例

```bash
# 配對樣本 t 檢定
curl -X POST http://localhost:3000/tools/stat/perform-ttest \
  -H "Content-Type: application/json" \
  -d '{"group1": [142, 138, 155], "group2": [135, 132, 148], "paired": true}'

# 獨立樣本 t 檢定  
curl -X POST http://localhost:3000/tools/stat/perform-ttest \
  -H "Content-Type: application/json" \
  -d '{"group1": [85, 92, 78], "group2": [92, 95, 89], "paired": false}'

# 單樣本 t 檢定
curl -X POST http://localhost:3000/tools/stat/perform-ttest \
  -H "Content-Type: application/json" \
  -d '{"group1": [98.5, 101.2, 99.8], "mu": 100}'
```