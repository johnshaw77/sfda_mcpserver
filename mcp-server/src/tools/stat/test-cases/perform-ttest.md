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

## AI 提問範例

### 範例 1: 醫療研究配對設計
**用戶提問**: "我是醫生，研究一種新的降血壓藥物。我有 10 位病患服藥前後的血壓數據：服藥前 [140, 138, 145, 142, 139, 144, 141, 143, 137, 146]，服藥後 [128, 125, 132, 129, 126, 131, 127, 130, 124, 133]。如何分析這個藥物是否有效？"

**AI 回應**: 這是典型的配對前後測設計，適合使用配對樣本 t 檢定。由於是同一批病患在不同時間點的測量，我們需要考慮個體間的差異。讓我來分析藥物治療前後的血壓變化。

**工具調用**:
```json
{
  "tool": "perform_ttest",
  "data": {
    "sample1": [140, 138, 145, 142, 139, 144, 141, 143, 137, 146],
    "sample2": [128, 125, 132, 129, 126, 131, 127, 130, 124, 133],
    "test_type": "paired",
    "alpha": 0.05,
    "alternative": "two-sided"
  },
  "context": {
    "scenario": "medical",
    "description": "評估降血壓藥物的治療效果",
    "variable_names": {
      "sample1_name": "治療前血壓",
      "sample2_name": "治療後血壓"
    }
  },
  "visualizations": {
    "include_charts": true,
    "chart_types": ["histogram", "boxplot", "qq_plot"],
    "generate_image": true,
    "image_format": "png"
  }
}
```

### 範例 2: 教育評估獨立樣本
**用戶提問**: "我想比較兩種教學方法的效果。實驗組（新方法）的測驗成績: [85, 92, 78, 88, 91, 83, 87, 89, 84, 90]，對照組（傳統方法）的成績: [75, 82, 70, 78, 80, 73, 77, 81, 74, 79]。新方法是否真的比較好？"

**AI 回應**: 您想比較兩個獨立群組的教學效果，這適合使用獨立樣本 t 檢定。由於是不同的學生群組，我們需要檢驗兩組平均成績是否有顯著差異。

**工具調用**:
```json
{
  "tool": "perform_ttest",
  "data": {
    "sample1": [75, 82, 70, 78, 80, 73, 77, 81, 74, 79],
    "sample2": [85, 92, 78, 88, 91, 83, 87, 89, 84, 90],
    "test_type": "independent",
    "alpha": 0.05,
    "alternative": "two-sided"
  },
  "context": {
    "scenario": "education",
    "description": "比較兩種教學方法的效果差異",
    "variable_names": {
      "sample1_name": "傳統教學法",
      "sample2_name": "新教學方法"
    }
  },
  "visualizations": {
    "include_charts": true,
    "chart_types": ["histogram", "boxplot"],
    "generate_image": true,
    "image_format": "png"
  }
}
```