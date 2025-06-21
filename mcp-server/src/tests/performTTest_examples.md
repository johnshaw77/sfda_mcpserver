# performTTest MCP 工具調用範例

## 基本格式

在 MCP 工具調用器中，`performTTest` 需要兩個主要參數：

```json
{
  "data": {
    "sample1": [...],
    "sample2": [...] 或 null,
    "paired": true/false,
    "alpha": 0.05,
    "alternative": "two-sided"/"less"/"greater"
  },
  "context": {
    "scenario": "場景類型",
    "description": "分析描述",
    ...其他上下文信息
  }
}
```

## 測試範例

### 範例 1: 單樣本 t 檢定 - 產品品質控制

**data 欄位：**
```json
{
  "sample1": [498.2, 501.3, 499.8, 502.1, 500.5, 497.9, 503.2, 499.1, 501.8, 500.3],
  "sample2": null,
  "paired": false,
  "alpha": 0.05,
  "alternative": "two-sided"
}
```

**context 欄位：**
```json
{
  "scenario": "quality",
  "description": "檢測產品重量是否符合標準規格 500g",
  "hypothesis": {
    "null": "平均重量等於標準重量 500g",
    "alternative": "平均重量不等於標準重量 500g"
  }
}
```

### 範例 2: 獨立樣本 t 檢定 - 教學方法比較

**data 欄位：**
```json
{
  "sample1": [78, 82, 75, 88, 79, 85, 81, 77, 84, 80],
  "sample2": [85, 89, 91, 87, 93, 88, 90, 86, 92, 89],
  "paired": false,
  "alpha": 0.05,
  "alternative": "two-sided"
}
```

**context 欄位：**
```json
{
  "scenario": "education",
  "description": "比較傳統教學與互動教學的效果",
  "groups": {
    "sample1": "傳統教學組",
    "sample2": "互動教學組"
  }
}
```

### 範例 3: 配對樣本 t 檢定 - 藥物治療效果

**data 欄位：**
```json
{
  "sample1": [140, 138, 145, 142, 139, 144, 141, 143, 137, 146],
  "sample2": [128, 125, 132, 129, 126, 131, 127, 130, 124, 133],
  "paired": true,
  "alpha": 0.05,
  "alternative": "two-sided"
}
```

**context 欄位：**
```json
{
  "scenario": "medical",
  "description": "評估降血壓藥物的治療效果",
  "measurement": {
    "before": "治療前收縮壓 (mmHg)",
    "after": "治療後收縮壓 (mmHg)"
  }
}
```

### 範例 4: 單側檢定 - 新製程改善

**data 欄位：**
```json
{
  "sample1": [95.2, 96.8, 94.5, 97.1, 95.9, 96.3, 94.8, 97.5, 95.6, 96.2],
  "sample2": [92.1, 93.5, 91.8, 94.2, 92.7, 93.1, 91.9, 94.8, 92.4, 93.6],
  "paired": false,
  "alpha": 0.05,
  "alternative": "greater"
}
```

**context 欄位：**
```json
{
  "scenario": "manufacturing",
  "description": "測試新製程是否提高產品良率",
  "groups": {
    "sample1": "新製程良率 (%)",
    "sample2": "舊製程良率 (%)"
  }
}
```

### 範例 5: 小樣本配對檢定 - 訓練效果

**data 欄位：**
```json
{
  "sample1": [8.2, 7.9, 8.5, 8.1, 7.8],
  "sample2": [7.5, 7.1, 7.8, 7.4, 7.2],
  "paired": true,
  "alpha": 0.05,
  "alternative": "two-sided"
}
```

**context 欄位：**
```json
{
  "scenario": "fitness",
  "description": "評估個人化訓練對跑步成績的影響",
  "measurement": {
    "before": "訓練前 1500m 跑步時間（分鐘）",
    "after": "訓練後 1500m 跑步時間（分鐘）"
  },
  "note": "小樣本情況下的檢定"
}
```

## 參數說明

### data 欄位參數：
- **sample1**: 第一組數據（必填）
- **sample2**: 第二組數據（單樣本檢定時為 null）
- **paired**: 是否為配對檢定（boolean）
- **alpha**: 顯著水準（通常為 0.05）
- **alternative**: 對立假設類型
  - "two-sided": 雙側檢定（≠）
  - "less": 左側檢定（<）
  - "greater": 右側檢定（>）

### context 欄位建議：
- **scenario**: 場景類型（如 "medical", "education", "quality" 等）
- **description**: 分析描述
- **hypothesis**: 假設說明（可選）
- **groups**: 組別說明（可選）
- **measurement**: 測量說明（可選）

## 使用提示

1. **單樣本檢定**: sample2 設為 null，paired 設為 false
2. **獨立樣本檢定**: 兩組不同對象的數據，paired 設為 false
3. **配對樣本檢定**: 同一對象的前後測量，paired 設為 true
4. **context 欄位**: 提供分析背景，幫助 AI 生成更準確的解釋
5. **數據品質**: 確保數據為數值型，避免缺失值

## 預期回應格式

```json
{
  "statistic": -5.477,
  "p_value": 0.0006,
  "degrees_of_freedom": 8,
  "critical_value": 2.306,
  "reject_null": true,
  "confidence_interval": [-8.1, -1.9],
  "interpretation": {
    "summary": "在 α=0.05 的顯著水準下，拒絕虛無假設",
    "conclusion": "有統計上的顯著差異",
    "practical_significance": "治療效果顯著，具有臨床意義",
    "recommendations": ["建議考慮將此治療方案納入標準療程"]
  },
  "context": { ... }
}
``` 