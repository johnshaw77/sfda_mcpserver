# 卡方檢定工具測試案例

## 工具概述
卡方檢定用於分析類別變數之間的關聯性，或檢驗觀察頻率是否符合期望頻率分佈。

## 統計專業情境

### 情境 1: 藥物療效與性別關聯性分析
**研究背景**: 分析新藥療效是否與患者性別有關聯
**研究設計**: 2×2 列聯表分析
**假設**: H₀: 藥物療效與性別無關 vs H₁: 藥物療效與性別有關

**測試數據**:
```json
{
  "observed": [
    [45, 25],
    [30, 50]
  ],
  "row_labels": ["有效", "無效"],
  "col_labels": ["男性", "女性"],
  "alpha": 0.05,
  "context": {
    "scenario": "medical",
    "variable1_name": "治療效果",
    "variable2_name": "性別",
    "study_type": "療效性別關聯分析"
  }
}
```

### 情境 2: 教育程度與職業類別關聯性
**研究背景**: 探討教育程度與職業類別之間的關聯性
**研究設計**: 3×4 列聯表分析
**假設**: H₀: 教育程度與職業類別無關 vs H₁: 教育程度與職業類別有關

**測試數據**:
```json
{
  "observed": [
    [20, 35, 15, 10],
    [15, 45, 30, 25],
    [5, 25, 40, 45]
  ],
  "row_labels": ["高中", "大學", "研究所"],
  "col_labels": ["服務業", "製造業", "科技業", "金融業"],
  "alpha": 0.05,
  "context": {
    "scenario": "education",
    "variable1_name": "教育程度",
    "variable2_name": "職業類別",
    "study_type": "教育職業關聯分析"
  }
}
```

### 情境 3: 適合度檢定（基因頻率）
**研究背景**: 檢驗觀察到的基因型頻率是否符合孟德爾遺傳定律
**研究設計**: 適合度檢定
**假設**: H₀: 觀察頻率符合理論比例 3:1 vs H₁: 觀察頻率不符合理論比例

**測試數據**:
```json
{
  "observed": [75, 23],
  "expected": [73.5, 24.5],
  "categories": ["顯性性狀", "隱性性狀"],
  "alpha": 0.05,
  "context": {
    "scenario": "medical",
    "variable_name": "基因型頻率",
    "study_type": "適合度檢定",
    "theoretical_ratio": "3:1"
  }
}
```

## 一般用戶情境

### 情境 1: 顧客偏好與年齡層關係
**生活情境**: 咖啡店想了解不同年齡層顧客對飲品種類的偏好是否有差異
**數據**: 三個年齡層對四種飲品類型的選擇統計

**測試數據**:
```json
{
  "observed": [
    [30, 20, 15, 10],
    [25, 35, 25, 20],
    [15, 25, 30, 35]
  ],
  "row_labels": ["18-30歲", "31-50歲", "51歲以上"],
  "col_labels": ["咖啡", "茶類", "果汁", "奶茶"],
  "alpha": 0.05,
  "context": {
    "scenario": "general",
    "variable1_name": "年齡層",
    "variable2_name": "飲品偏好",
    "study_type": "顧客偏好分析"
  }
}
```

### 情境 2: 網購平台與付款方式關係
**生活情境**: 電商公司想知道不同網購平台的用戶付款方式偏好是否不同
**數據**: 三個購物平台用戶的付款方式統計

**測試數據**:
```json
{
  "observed": [
    [120, 80, 60, 40],
    [100, 110, 70, 20],
    [90, 70, 90, 50]
  ],
  "row_labels": ["平台A", "平台B", "平台C"],
  "col_labels": ["信用卡", "電子錢包", "ATM轉帳", "貨到付款"],
  "alpha": 0.05,
  "context": {
    "scenario": "general",
    "variable1_name": "購物平台",
    "variable2_name": "付款方式",
    "study_type": "付款偏好分析"
  }
}
```

### 情境 3: 學科成績分佈檢定
**生活情境**: 老師想知道班上數學成績分佈是否符合預期的常態分佈
**數據**: 成績分佈的觀察頻率 vs 期望頻率

**測試數據**:
```json
{
  "observed": [5, 12, 18, 20, 15, 8, 2],
  "expected": [4, 10, 16, 24, 16, 10, 4],
  "categories": ["0-40", "41-50", "51-60", "61-70", "71-80", "81-90", "91-100"],
  "alpha": 0.05,
  "context": {
    "scenario": "education",
    "variable_name": "數學成績分佈",
    "study_type": "成績分佈適合度檢定",
    "theoretical_distribution": "常態分佈"
  }
}
```

## 特殊情境

### 情境 4: 品質管制（不良率檢定）
**研究背景**: 檢驗四條生產線的不良率是否相同
**數據**: 各生產線的良品與不良品數量

**測試數據**:
```json
{
  "observed": [
    [480, 20],
    [470, 30],
    [485, 15],
    [475, 25]
  ],
  "row_labels": ["生產線1", "生產線2", "生產線3", "生產線4"],
  "col_labels": ["良品", "不良品"],
  "alpha": 0.05,
  "context": {
    "scenario": "quality",
    "variable1_name": "生產線",
    "variable2_name": "產品品質",
    "study_type": "品質管制分析"
  }
}
```

### 情境 5: 問卷調查獨立性檢定
**研究背景**: 分析工作滿意度與部門之間的關聯性
**數據**: 不同部門員工的滿意度調查結果

**測試數據**:
```json
{
  "observed": [
    [15, 25, 10],
    [20, 30, 15],
    [10, 20, 25],
    [5, 15, 20]
  ],
  "row_labels": ["業務部", "技術部", "行政部", "財務部"],
  "col_labels": ["滿意", "普通", "不滿意"],
  "alpha": 0.05,
  "context": {
    "scenario": "general",
    "variable1_name": "部門",
    "variable2_name": "工作滿意度",
    "study_type": "員工滿意度調查"
  }
}
```

## AI 提問範例

### 範例 1: 市場調研分析
**用戶提問**: "我做了一項消費者偏好調查，想知道年齡層和產品偏好是否有關係。我的數據是：18-30歲 (產品A: 45人, 產品B: 35人, 產品C: 20人)，31-45歲 (產品A: 30人, 產品B: 50人, 產品C: 25人)，46歲以上 (產品A: 25人, 產品B: 40人, 產品C: 40人)。如何分析這個關聯性？"

**AI 回應**: 您想分析兩個分類變數（年齡層和產品偏好）之間是否存在關聯性，這是典型的卡方獨立性檢定情境。這個檢定可以告訴我們年齡層和產品偏好是否相互獨立。

**工具調用**:
```json
{
  "tool": "perform_chisquare",
  "data": {
    "observed": [
      [45, 35, 20],
      [30, 50, 25],
      [25, 40, 40]
    ],
    "alpha": 0.05
  },
  "context": {
    "scenario": "business",
    "description": "分析年齡層與產品偏好的關聯性",
    "variable1_name": "年齡層",
    "variable2_name": "產品偏好",
    "row_labels": ["18-30歲", "31-45歲", "46歲以上"],
    "col_labels": ["產品A", "產品B", "產品C"]
  },
  "visualizations": {
    "include_charts": true,
    "chart_types": ["bar_chart", "mosaic_plot"],
    "generate_image": true,
    "image_format": "png"
  }
}
```

### 範例 2: 醫療研究療效分析
**用戶提問**: "我研究兩種治療方法的效果。治療方法A: 有效 35人，無效 15人；治療方法B: 有效 42人，無效 8人。這兩種方法的效果有顯著差異嗎？"

**AI 回應**: 您想比較兩種治療方法的效果，這是典型的 2×2 列聯表分析。卡方檢定可以幫助我們判斷治療方法和療效之間是否存在顯著關聯。

**工具調用**:
```json
{
  "tool": "perform_chisquare",
  "data": {
    "observed": [
      [35, 15],
      [42, 8]
    ],
    "alpha": 0.05
  },
  "context": {
    "scenario": "medical",
    "description": "比較兩種治療方法的療效差異",
    "variable1_name": "治療方法",
    "variable2_name": "治療效果",
    "row_labels": ["治療方法A", "治療方法B"],
    "col_labels": ["有效", "無效"]
  },
  "visualizations": {
    "include_charts": true,
    "chart_types": ["bar_chart", "residual_plot"],
    "generate_image": true,
    "image_format": "png"
  }
}
```

## 預期結果

### 統計專業用戶期望看到：
- 卡方統計量、自由度、p 值
- 效果量（Cramér's V 或 φ 係數）
- 期望頻率矩陣
- 標準化殘差分析
- 假設檢定條件檢查（期望頻率 ≥ 5）
- 列聯係數或關聯強度測量

### 一般用戶期望看到：
- 簡潔的關聯性結論
- 關聯強度的描述（弱/中等/強）
- 視覺化列聯表或長條圖
- 哪些組合特別突出
- 實用的商業或生活建議

## 測試指令範例

```bash
# 獨立性檢定
curl -X POST http://localhost:3000/tools/stat/perform-chisquare \
  -H "Content-Type: application/json" \
  -d '{
    "observed": [[45,25],[30,50]],
    "row_labels": ["有效","無效"],
    "col_labels": ["男性","女性"]
  }'

# 適合度檢定
curl -X POST http://localhost:3000/tools/stat/perform-chisquare \
  -H "Content-Type: application/json" \
  -d '{
    "observed": [75,23],
    "expected": [73.5,24.5],
    "categories": ["顯性","隱性"]
  }'
```

## 假設檢驗條件
- 觀察值需為頻率計數（非比例或百分比）
- 各組期望頻率應 ≥ 5
- 觀察值需獨立
- 樣本需隨機抽取
- 類別需互斥且完整