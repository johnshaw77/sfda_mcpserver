# Kruskal-Wallis 檢定工具測試案例

## 工具概述
Kruskal-Wallis 檢定是單因子 ANOVA 的非參數替代方法，用於比較三個或以上獨立群組的中位數是否有顯著差異，不需要假設資料符合常態分佈。

## 統計專業情境

### 情境 1: 多種藥物劑量效果比較
**研究背景**: 比較四種不同劑量藥物對血壓降低效果，資料呈現偏態分佈
**研究設計**: 完全隨機設計，四個獨立群組
**假設**: H₀: 四組中位數相等 vs H₁: 至少有一組中位數不等

**測試數據**:
```json
{
  "groups": [
    [5, 8, 12, 6, 9, 7, 11, 8, 10, 6, 9, 7],
    [15, 18, 22, 16, 19, 17, 21, 18, 20, 16, 19, 17],
    [25, 28, 32, 26, 29, 27, 31, 28, 30, 26, 29, 27],
    [35, 38, 42, 36, 39, 37, 41, 38, 40, 36, 39, 37]
  ],
  "group_labels": ["安慰劑", "低劑量", "中劑量", "高劑量"],
  "alpha": 0.05,
  "context": {
    "scenario": "medical",
    "variable_name": "血壓降低幅度 (mmHg)",
    "factor_name": "藥物劑量",
    "distribution_note": "右偏分佈，不符合常態性"
  }
}
```

### 情境 2: 心理治療方法效果比較
**研究背景**: 比較三種心理治療方法對焦慮量表分數的影響，量表為序位資料
**研究設計**: 隨機分組設計，序位尺度測量
**假設**: H₀: 三種治療方法效果相同 vs H₁: 至少有一種方法效果不同

**測試數據**:
```json
{
  "groups": [
    [45, 42, 48, 44, 46, 43, 47, 45, 49, 41, 46, 44, 42, 47, 45],
    [38, 35, 41, 37, 39, 36, 40, 38, 42, 34, 39, 37, 35, 40, 38],
    [32, 29, 35, 31, 33, 30, 34, 32, 36, 28, 33, 31, 29, 34, 32]
  ],
  "group_labels": ["認知行為治療", "人際治療", "接受與承諾治療"],
  "alpha": 0.05,
  "context": {
    "scenario": "medical",
    "variable_name": "焦慮量表分數",
    "factor_name": "治療方法",
    "distribution_note": "序位資料，Likert 量表"
  }
}
```

### 情境 3: 品質管制多供應商比較
**研究背景**: 比較五個供應商的產品品質評分，小樣本且分佈未知
**研究設計**: 隨機抽樣，獨立樣本
**假設**: H₀: 五個供應商品質相同 vs H₁: 至少有一個供應商品質不同

**測試數據**:
```json
{
  "groups": [
    [7.8, 8.2, 7.5, 8.9, 7.1, 8.5, 7.9],
    [8.8, 9.1, 8.5, 9.3, 8.7, 9.0, 8.9],
    [6.5, 6.8, 6.2, 7.1, 6.4, 6.9, 6.6],
    [9.2, 9.5, 9.1, 9.6, 9.3, 9.4, 9.0],
    [7.2, 7.6, 7.0, 7.8, 7.3, 7.5, 7.1]
  ],
  "group_labels": ["供應商A", "供應商B", "供應商C", "供應商D", "供應商E"],
  "alpha": 0.05,
  "context": {
    "scenario": "quality",
    "variable_name": "品質評分 (1-10)",
    "factor_name": "供應商",
    "distribution_note": "小樣本，分佈未知"
  }
}
```

### 情境 4: 軟板製造良率多生產線比較
**研究背景**: 比較四條軟板生產線的良率表現，良率數據通常偏態分佈
**研究設計**: 獨立抽樣，各生產線獨立運作
**假設**: H₀: 四條生產線良率中位數相同 vs H₁: 至少有一條生產線良率不同

**測試數據**:
```json
{
  "groups": [
    [94.2, 95.8, 94.7, 96.3, 95.1, 95.9, 94.5, 96.1, 95.4, 94.8],
    [92.1, 93.7, 92.6, 94.2, 93.0, 93.8, 92.4, 94.0, 93.3, 92.7],
    [96.8, 97.4, 96.2, 98.1, 97.0, 97.6, 96.5, 97.9, 97.3, 96.9],
    [89.5, 91.2, 90.1, 92.8, 90.7, 91.9, 89.8, 92.4, 91.5, 90.3]
  ],
  "group_labels": ["生產線A", "生產線B", "生產線C", "生產線D"],
  "alpha": 0.05,
  "context": {
    "scenario": "manufacturing",
    "variable_name": "良率 (%)",
    "factor_name": "生產線",
    "distribution_note": "良率數據可能偏態分佈",
    "industry": "軟板製造業"
  }
}
```

### 情境 5: 軟板製造工藝段良率比較
**研究背景**: 比較軟板製造五個工藝段的良率，工藝段數據可能不符合常態分佈
**研究設計**: 多工藝段比較，序位性質資料
**假設**: H₀: 五個工藝段良率相同 vs H₁: 至少有一個工藝段良率不同

**測試數據**:
```json
{
  "groups": [
    [98.5, 99.1, 98.8, 99.4, 98.9, 99.2, 98.7, 99.3],
    [95.2, 96.8, 95.7, 97.3, 96.1, 96.9, 95.5, 97.1],
    [91.8, 93.5, 92.3, 94.1, 92.7, 93.8, 92.1, 93.9],
    [97.1, 98.2, 97.6, 98.7, 97.9, 98.4, 97.4, 98.6],
    [88.6, 90.2, 89.1, 91.5, 89.7, 90.8, 88.9, 91.1]
  ],
  "group_labels": ["基材處理", "圖形轉移", "蝕刻製程", "表面處理", "最終檢測"],
  "alpha": 0.05,
  "context": {
    "scenario": "manufacturing",
    "variable_name": "工藝段良率 (%)",
    "factor_name": "製程工藝段",
    "distribution_note": "工藝複雜度導致分佈偏態",
    "industry": "軟板製造業",
    "process_focus": "製程瓶頸分析"
  }
}
```

## 一般用戶情境

### 情境 1: 四家分店客戶滿意度比較
**生活情境**: 連鎖餐廳想比較四家分店的客戶滿意度評分是否有差異
**數據**: 四家分店的客戶滿意度評分（1-10分）

**測試數據**:
```json
{
  "groups": [
    [7.2, 8.1, 6.8, 7.9, 8.3, 7.5, 8.0, 7.4, 8.2, 7.1, 7.8, 8.4],
    [8.5, 8.9, 8.2, 9.1, 8.7, 8.8, 8.4, 9.0, 8.6, 8.3, 8.8, 9.2],
    [6.1, 6.5, 5.8, 6.7, 6.3, 6.4, 6.0, 6.6, 6.2, 5.9, 6.4, 6.8],
    [7.8, 8.2, 7.5, 8.1, 7.9, 8.0, 7.6, 8.3, 7.7, 7.4, 8.0, 8.5]
  ],
  "group_labels": ["信義店", "西門店", "士林店", "板橋店"],
  "alpha": 0.05,
  "context": {
    "scenario": "general",
    "variable_name": "客戶滿意度評分 (1-10)",
    "factor_name": "分店位置",
    "distribution_note": "評分資料，可能偏態"
  }
}
```

### 情境 2: 三個網購平台配送時間比較
**生活情境**: 比較三個網購平台的配送時間，配送時間通常右偏分佈
**數據**: 三個平台各自的配送天數記錄

**測試數據**:
```json
{
  "groups": [
    [2, 3, 1, 4, 2, 3, 2, 5, 3, 1, 4, 2, 3, 6, 2],
    [1, 2, 1, 3, 2, 2, 1, 3, 2, 1, 2, 3, 1, 2, 4],
    [3, 4, 2, 5, 3, 4, 3, 6, 4, 2, 5, 3, 4, 7, 3]
  ],
  "group_labels": ["平台A", "平台B", "平台C"],
  "alpha": 0.05,
  "context": {
    "scenario": "general",
    "variable_name": "配送天數",
    "factor_name": "網購平台",
    "distribution_note": "右偏分佈，存在極值"
  }
}
```

### 情境 3: 四個品牌手機電池續航力比較
**生活情境**: 比較四個品牌手機的電池續航時間，考慮到使用習慣差異導致的分佈偏態
**數據**: 每個品牌隨機測試的電池使用時間

**測試數據**:
```json
{
  "groups": [
    [12.5, 13.2, 11.8, 12.9, 13.1, 12.3, 11.9, 12.7, 13.5, 12.1],
    [14.2, 15.1, 13.7, 14.6, 14.8, 14.0, 13.9, 14.5, 15.3, 13.8],
    [11.8, 12.5, 11.2, 11.9, 12.3, 11.6, 11.4, 12.1, 12.7, 11.0],
    [13.5, 14.2, 12.9, 13.8, 14.0, 13.3, 13.1, 13.7, 14.4, 12.8]
  ],
  "group_labels": ["品牌A", "品牌B", "品牌C", "品牌D"],
  "alpha": 0.05,
  "context": {
    "scenario": "general",
    "variable_name": "電池續航時間 (小時)",
    "factor_name": "手機品牌",
    "distribution_note": "使用習慣導致分佈可能偏態"
  }
}
```

## 特殊情境

### 情境 4: 教學方法效果比較（存在綁定值）
**研究背景**: 比較五種教學方法對學習成效的影響，成績可能有相同分數
**數據**: 不同教學方法的學生成績

**測試數據**:
```json
{
  "groups": [
    [75, 78, 75, 82, 79, 78, 75, 80, 77, 78],
    [82, 85, 82, 88, 86, 85, 82, 87, 84, 85],
    [68, 71, 68, 74, 72, 71, 68, 73, 70, 71],
    [88, 91, 88, 94, 92, 91, 88, 93, 90, 91],
    [79, 82, 79, 85, 83, 82, 79, 84, 81, 82]
  ],
  "group_labels": ["講述法", "討論法", "實驗法", "專題法", "翻轉教學"],
  "alpha": 0.05,
  "context": {
    "scenario": "education",
    "variable_name": "學習成效分數",
    "factor_name": "教學方法",
    "distribution_note": "可能存在綁定值（相同分數）"
  }
}
```

### 情境 5: 工作滿意度跨部門比較
**研究背景**: 比較公司四個部門員工的工作滿意度，使用 Likert 量表
**數據**: 四個部門的滿意度調查結果

**測試數據**:
```json
{
  "groups": [
    [6, 7, 5, 8, 6, 7, 6, 8, 7, 5, 7, 8, 6, 7, 6],
    [8, 9, 7, 9, 8, 9, 8, 9, 8, 7, 8, 9, 8, 9, 8],
    [4, 5, 3, 6, 4, 5, 4, 6, 5, 3, 5, 6, 4, 5, 4],
    [7, 8, 6, 8, 7, 8, 7, 8, 7, 6, 7, 8, 7, 8, 7]
  ],
  "group_labels": ["業務部", "研發部", "生產部", "行政部"],
  "alpha": 0.05,
  "context": {
    "scenario": "general",
    "variable_name": "工作滿意度 (1-10)",
    "factor_name": "部門",
    "distribution_note": "Likert 量表，序位資料"
  }
}
```

### 情境 6: 不等樣本大小比較
**研究背景**: 比較三種治療方法，但各組樣本大小不等
**數據**: 樣本大小不相等的三組資料

**測試數據**:
```json
{
  "groups": [
    [15, 18, 12, 20, 16, 19, 14, 21, 17],
    [25, 28, 22, 30, 26, 29, 24, 31, 27, 32, 28, 25],
    [8, 11, 5, 13, 9, 12, 7, 14, 10, 15, 11, 8, 6, 12, 9]
  ],
  "group_labels": ["治療A (n=9)", "治療B (n=12)", "治療C (n=15)"],
  "alpha": 0.05,
  "context": {
    "scenario": "medical",
    "variable_name": "症狀改善分數",
    "factor_name": "治療方法",
    "distribution_note": "不等樣本大小"
  }
}
```

## 預期結果

### 統計專業用戶期望看到：
- H 統計量（或 Chi-square 統計量）
- 自由度和 p 值
- 效果量（η² 或 ε²）
- 各組平均秩次
- 事後比較結果（Dunn's test 等）
- 綁定值校正說明
- 樣本大小適當性評估
- 與 ANOVA 的比較說明

### 一般用戶期望看到：
- 群組間是否有顯著差異的結論
- 哪些群組彼此不同
- 各組中位數比較
- 視覺化圖表（盒鬚圖）
- 排名順序說明
- 實用建議和解釋

## 測試指令範例

```bash
# 基本 Kruskal-Wallis 檢定
curl -X POST http://localhost:3000/tools/stat/perform-kruskal-wallis \
  -H "Content-Type: application/json" \
  -d '{
    "groups": [[5,8,12],[15,18,22],[25,28,32]],
    "group_labels": ["低劑量","中劑量","高劑量"]
  }'

# 包含情境資訊的檢定
curl -X POST http://localhost:3000/tools/stat/perform-kruskal-wallis \
  -H "Content-Type: application/json" \
  -d '{
    "groups": [[7.2,8.1,6.8],[8.5,8.9,8.2],[6.1,6.5,5.8]],
    "group_labels": ["店A","店B","店C"],
    "context": {
      "scenario": "general",
      "variable_name": "滿意度評分"
    }
  }'
```

## 使用時機
- 比較三個或以上獨立群組
- 資料不符合常態分佈
- 序位資料或間隔資料
- ANOVA 假設不成立
- 樣本大小不等
- 存在極端值或離群值
- 需要穩健的多組比較

## 假設檢驗條件
- 各組樣本需獨立
- 資料至少為序位尺度
- 各組的資料分佈形狀相似（用於比較中位數）
- 隨機抽樣

## 與 ANOVA 的比較
- **Kruskal-Wallis**: 不需要常態性和變異數齊質性假設，較穩健
- **ANOVA**: 需要常態性和變異數齊質性，檢定力較高（當假設成立時）
- **建議**: 當 ANOVA 假設不成立時使用 Kruskal-Wallis

## 事後比較
當 Kruskal-Wallis 檢定顯著時，需要進行事後比較：
- Dunn's test（最常用）
- Bonferroni 校正
- Steel-Dwass test
- Conover-Iman test

## AI 提問範例

### 範例 1: 教育研究情境
**用戶提問**: "我是教育研究者，想比較四種不同教學方法對學生學習成效的影響。我有四組學生的測驗分數：傳統教學 [75, 78, 72, 80, 76, 74, 79, 77]，翻轉教室 [82, 85, 81, 88, 84, 83, 87, 86]，專案導向 [78, 81, 77, 84, 80, 79, 83, 82]，混成學習 [85, 88, 84, 91, 87, 86, 90, 89]。如何分析這四種方法是否有差異？"

**AI 回應**: 您想比較四個獨立群組（教學方法）的學習成效，這是典型的多組比較問題。由於我們有超過兩組的比較，且學習成績可能不完全符合常態分佈，建議使用 Kruskal-Wallis 檢定（非參數版本的 ANOVA）。

**工具調用**:
```json
{
  "tool": "perform_kruskal_wallis",
  "data": {
    "groups": [
      [75, 78, 72, 80, 76, 74, 79, 77],
      [82, 85, 81, 88, 84, 83, 87, 86],
      [78, 81, 77, 84, 80, 79, 83, 82],
      [85, 88, 84, 91, 87, 86, 90, 89]
    ],
    "alpha": 0.05
  },
  "context": {
    "scenario": "education",
    "description": "比較四種教學方法對學習成效的影響",
    "group_names": ["傳統教學", "翻轉教室", "專案導向", "混成學習"]
  },
  "visualizations": {
    "include_charts": true,
    "chart_types": ["boxplot", "histogram"],
    "generate_image": true,
    "image_format": "png"
  }
}
```

### 範例 2: 品質控制情境
**用戶提問**: "我是品管經理，想比較三個不同工廠生產的產品品質評分。工廠A的評分: [8.2, 8.5, 8.1, 8.7, 8.3, 8.4, 8.6]，工廠B的評分: [7.8, 8.0, 7.9, 8.2, 7.7, 8.1, 7.9]，工廠C的評分: [9.1, 9.3, 9.0, 9.4, 9.2, 9.5, 9.1]。三個工廠的品質是否有顯著差異？"

**AI 回應**: 您想比較三個工廠的產品品質，這需要進行多組比較分析。由於品質評分可能不符合常態分佈，而且您有三個獨立的群組，Kruskal-Wallis 檢定是最適合的方法。

**工具調用**:
```json
{
  "tool": "perform_kruskal_wallis",
  "data": {
    "groups": [
      [8.2, 8.5, 8.1, 8.7, 8.3, 8.4, 8.6],
      [7.8, 8.0, 7.9, 8.2, 7.7, 8.1, 7.9],
      [9.1, 9.3, 9.0, 9.4, 9.2, 9.5, 9.1]
    ],
    "alpha": 0.05
  },
  "context": {
    "scenario": "quality",
    "description": "比較三個工廠的產品品質評分差異",
    "group_names": ["工廠A", "工廠B", "工廠C"]
  },
  "visualizations": {
    "include_charts": true,
    "chart_types": ["boxplot", "rank_plot"],
    "generate_image": true,
    "image_format": "png"
  }
}
```

### 範例 3: 軟板生產線良率比較 - 白話提問
**用戶提問**: "我們軟板廠有四條生產線，最近老闆要我分析哪條線的良率比較好。我收集了各條線的良率數據，但發現數據分佈好像不太正常，有些偏斜。

生產線A：94.2, 95.8, 94.7, 96.3, 95.1, 95.9, 94.5, 96.1, 95.4, 94.8
生產線B：92.1, 93.7, 92.6, 94.2, 93.0, 93.8, 92.4, 94.0, 93.3, 92.7
生產線C：96.8, 97.4, 96.2, 98.1, 97.0, 97.6, 96.5, 97.9, 97.3, 96.9
生產線D：89.5, 91.2, 90.1, 92.8, 90.7, 91.9, 89.8, 92.4, 91.5, 90.3

有什麼方法可以比較這四條線的差異嗎？"

**AI 回應**: 由於您的數據分佈不正常且有偏斜，建議使用 Kruskal-Wallis 檢定。這是非參數統計方法，不需要假設數據符合常態分佈，很適合比較多條生產線的良率差異。

**工具調用**:
```json
{
  "tool": "perform_kruskal_wallis",
  "data": {
    "groups": [
      [94.2, 95.8, 94.7, 96.3, 95.1, 95.9, 94.5, 96.1, 95.4, 94.8],
      [92.1, 93.7, 92.6, 94.2, 93.0, 93.8, 92.4, 94.0, 93.3, 92.7],
      [96.8, 97.4, 96.2, 98.1, 97.0, 97.6, 96.5, 97.9, 97.3, 96.9],
      [89.5, 91.2, 90.1, 92.8, 90.7, 91.9, 89.8, 92.4, 91.5, 90.3]
    ],
    "alpha": 0.05
  },
  "context": {
    "scenario": "manufacturing",
    "description": "比較四條軟板生產線的良率差異",
    "group_names": ["生產線A", "生產線B", "生產線C", "生產線D"]
  }
}
```

### 範例 4: 軟板工藝段良率分析 - 白話提問
**用戶提問**: "我們軟板製程有五個主要步驟，我想看看哪個步驟的良率最需要改善。因為每個步驟的複雜度不同，良率分佈也不太一樣，有些步驟數據比較集中，有些比較分散。

基材處理：98.5, 99.1, 98.8, 99.4, 98.9, 99.2, 98.7, 99.3
圖形轉移：95.2, 96.8, 95.7, 97.3, 96.1, 96.9, 95.5, 97.1
蝕刻製程：91.8, 93.5, 92.3, 94.1, 92.7, 93.8, 92.1, 93.9
表面處理：97.1, 98.2, 97.6, 98.7, 97.9, 98.4, 97.4, 98.6
最終檢測：88.6, 90.2, 89.1, 91.5, 89.7, 90.8, 88.9, 91.1

能幫我分析這五個工藝段的良率是否真的有差異？"

**AI 回應**: 您想比較五個工藝段的良率表現，由於各工藝段的複雜度不同導致數據分佈不一致，Kruskal-Wallis 檢定最適合這種情況。它能幫您找出哪些工藝段需要重點改善。

**工具調用**:
```json
{
  "tool": "perform_kruskal_wallis",
  "data": {
    "groups": [
      [98.5, 99.1, 98.8, 99.4, 98.9, 99.2, 98.7, 99.3],
      [95.2, 96.8, 95.7, 97.3, 96.1, 96.9, 95.5, 97.1],
      [91.8, 93.5, 92.3, 94.1, 92.7, 93.8, 92.1, 93.9],
      [97.1, 98.2, 97.6, 98.7, 97.9, 98.4, 97.4, 98.6],
      [88.6, 90.2, 89.1, 91.5, 89.7, 90.8, 88.9, 91.1]
    ],
    "alpha": 0.05
  },
  "context": {
    "scenario": "manufacturing",
    "description": "比較軟板製造五個工藝段的良率差異",
    "group_names": ["基材處理", "圖形轉移", "蝕刻製程", "表面處理", "最終檢測"]
  }
}
```