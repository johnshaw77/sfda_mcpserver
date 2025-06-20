# SFDA 統計學分析 API 文件

## 概述

SFDA 統計學分析 API 是一個基於 FastAPI 的統計計算服務，提供各種統計學方法的 RESTful API 端點。

## 基本資訊

- **基礎 URL**: `http://localhost:8000`
- **API 版本**: v1
- **回應格式**: JSON
- **請求格式**: JSON

## 認證

此 API 目前不需要認證。

## 端點總覽

### 健康檢查
- `GET /` - 根端點
- `GET /health` - 健康檢查

### 描述性統計
- `POST /api/v1/descriptive/basic` - 基本統計量
- `POST /api/v1/descriptive/distribution` - 分佈統計量
- `POST /api/v1/descriptive/percentiles` - 百分位數

### 推論統計
- `POST /api/v1/inferential/ttest` - t 檢定
- `POST /api/v1/inferential/chisquare` - 卡方檢定
- `POST /api/v1/inferential/anova` - ANOVA 分析

### 迴歸分析
- `POST /api/v1/regression/linear` - 線性迴歸
- `POST /api/v1/regression/multiple` - 多元迴歸
- `POST /api/v1/regression/polynomial` - 多項式迴歸

### 相關性分析
- `POST /api/v1/correlation/pearson` - Pearson 相關
- `POST /api/v1/correlation/spearman` - Spearman 相關
- `POST /api/v1/correlation/kendall` - Kendall 相關
- `POST /api/v1/correlation/matrix` - 相關矩陣

### 機率分佈
- `POST /api/v1/distribution/normal` - 常態分佈分析
- `POST /api/v1/distribution/test` - 分佈適合度檢定

## 詳細 API 端點

### 1. 健康檢查

#### GET /
根端點，回傳 API 基本資訊。

**回應**:
```json
{
  "message": "歡迎使用 SFDA 統計學分析 API",
  "version": "1.0.0",
  "docs": "/docs",
  "redoc": "/redoc"
}
```

#### GET /health
健康檢查端點。

**回應**:
```json
{
  "status": "healthy"
}
```

### 2. 描述性統計

#### POST /api/v1/descriptive/basic
計算基本統計量。

**請求參數**:
```json
{
  "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

**回應**:
```json
{
  "mean": 5.5,
  "median": 5.5,
  "mode": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "std": 3.0277,
  "variance": 9.1667,
  "min": 1,
  "max": 10,
  "range": 9,
  "count": 10
}
```

#### POST /api/v1/descriptive/distribution
計算分佈統計量。

**請求參數**:
```json
{
  "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

**回應**:
```json
{
  "skewness": 0.0,
  "kurtosis": -1.2,
  "is_normal": true,
  "normality_p_value": 0.8275
}
```

#### POST /api/v1/descriptive/percentiles
計算百分位數。

**請求參數**:
```json
{
  "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "percentiles": [25, 50, 75, 90]
}
```

**回應**:
```json
{
  "percentiles": {
    "P25": 3.25,
    "P50": 5.5,
    "P75": 7.75,
    "P90": 9.1
  },
  "quartiles": {
    "Q1": 3.25,
    "Q2": 5.5,
    "Q3": 7.75,
    "IQR": 4.5
  }
}
```

### 3. 推論統計

#### POST /api/v1/inferential/ttest
執行 t 檢定。

**請求參數**:
```json
{
  "sample1": [1, 2, 3, 4, 5],
  "sample2": [6, 7, 8, 9, 10],
  "paired": false,
  "alpha": 0.05,
  "alternative": "two-sided"
}
```

**回應**:
```json
{
  "statistic": -5.477,
  "p_value": 0.0006,
  "degrees_of_freedom": 8,
  "critical_value": 2.306,
  "reject_null": true,
  "confidence_interval": [-8.1, -1.9]
}
```

#### POST /api/v1/inferential/chisquare
執行卡方檢定。

**請求參數**:
```json
{
  "observed": [
    [10, 20, 30],
    [6, 9, 17]
  ]
}
```

**回應**:
```json
{
  "statistic": 2.745,
  "p_value": 0.254,
  "degrees_of_freedom": 2,
  "expected_frequencies": [
    [8.7, 15.7, 25.5],
    [7.3, 13.3, 21.5]
  ],
  "reject_null": false
}
```

#### POST /api/v1/inferential/anova
執行單因子 ANOVA。

**請求參數**:
```json
{
  "groups": [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
  ]
}
```

**回應**:
```json
{
  "f_statistic": 60.0,
  "p_value": 0.0000,
  "degrees_of_freedom_between": 2,
  "degrees_of_freedom_within": 12,
  "sum_of_squares_between": 200.0,
  "sum_of_squares_within": 20.0,
  "mean_square_between": 100.0,
  "mean_square_within": 1.667,
  "reject_null": true
}
```

### 4. 迴歸分析

#### POST /api/v1/regression/linear
執行簡單線性迴歸。

**請求參數**:
```json
{
  "x": [1, 2, 3, 4, 5],
  "y": [2, 4, 6, 8, 10]
}
```

**回應**:
```json
{
  "coefficients": [2.0],
  "intercept": 0.0,
  "r_squared": 1.0,
  "adjusted_r_squared": 1.0,
  "f_statistic": 999999.0,
  "p_value": 0.0000,
  "residuals": [0.0, 0.0, 0.0, 0.0, 0.0],
  "fitted_values": [2.0, 4.0, 6.0, 8.0, 10.0]
}
```

#### POST /api/v1/regression/multiple
執行多元線性迴歸。

**請求參數**:
```json
{
  "x": [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6]
  ],
  "y": [3, 5, 7, 9, 11]
}
```

**回應**:
```json
{
  "coefficients": [1.0, 1.0],
  "intercept": 0.0,
  "r_squared": 1.0,
  "adjusted_r_squared": 1.0,
  "f_statistic": 999999.0,
  "p_value": 0.0000,
  "residuals": [0.0, 0.0, 0.0, 0.0, 0.0],
  "fitted_values": [3.0, 5.0, 7.0, 9.0, 11.0]
}
```

#### POST /api/v1/regression/polynomial
執行多項式迴歸。

**請求參數**:
```json
{
  "x": [1, 2, 3, 4, 5],
  "y": [1, 4, 9, 16, 25],
  "degree": 2
}
```

**回應**:
```json
{
  "coefficients": [0.0, 0.0, 1.0],
  "intercept": 0.0,
  "r_squared": 1.0,
  "adjusted_r_squared": 1.0,
  "f_statistic": 999999.0,
  "p_value": 0.0000,
  "residuals": [0.0, 0.0, 0.0, 0.0, 0.0],
  "fitted_values": [1.0, 4.0, 9.0, 16.0, 25.0]
}
```

### 5. 相關性分析

#### POST /api/v1/correlation/pearson
計算 Pearson 相關係數。

**請求參數**:
```json
{
  "x": [1, 2, 3, 4, 5],
  "y": [2, 4, 6, 8, 10]
}
```

**回應**:
```json
{
  "correlation_coefficient": 1.0,
  "p_value": 0.0000,
  "confidence_interval": [1.0, 1.0],
  "interpretation": "完全正相關"
}
```

#### POST /api/v1/correlation/spearman
計算 Spearman 等級相關係數。

**請求參數**:
```json
{
  "x": [1, 2, 3, 4, 5],
  "y": [1, 4, 9, 16, 25]
}
```

**回應**:
```json
{
  "correlation_coefficient": 1.0,
  "p_value": 0.0000,
  "confidence_interval": [1.0, 1.0],
  "interpretation": "完全正相關"
}
```

#### POST /api/v1/correlation/matrix
計算相關矩陣。

**請求參數**:
```json
{
  "data": [
    [1, 2, 3],
    [2, 4, 6],
    [3, 6, 9],
    [4, 8, 12]
  ],
  "columns": ["X1", "X2", "X3"]
}
```

**回應**:
```json
{
  "correlation_matrix": [
    [1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0]
  ],
  "p_values_matrix": [
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0]
  ],
  "columns": ["X1", "X2", "X3"]
}
```

### 6. 機率分佈

#### POST /api/v1/distribution/normal
執行常態分佈分析。

**請求參數**:
```json
{
  "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

**回應**:
```json
{
  "parameters": {
    "mean": 5.5,
    "std": 3.0277
  },
  "goodness_of_fit": 0.827,
  "p_value": 0.827,
  "is_good_fit": true
}
```

#### POST /api/v1/distribution/test
執行分佈適合度檢定。

**請求參數**:
```json
{
  "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "distribution": "normal"
}
```

**回應**:
```json
{
  "parameters": {
    "mean": 5.5,
    "std": 3.0277
  },
  "goodness_of_fit": 0.827,
  "p_value": 0.827,
  "is_good_fit": true
}
```

## 錯誤處理

### 錯誤回應格式

所有錯誤都會回傳以下格式：

```json
{
  "detail": "錯誤訊息描述"
}
```

### 常見錯誤狀態碼

- `400 Bad Request`: 請求參數錯誤或計算失敗
- `422 Unprocessable Entity`: 請求格式錯誤或資料驗證失敗
- `500 Internal Server Error`: 伺服器內部錯誤

### 常見錯誤情況

1. **資料驗證錯誤**:
   - 數值陣列為空
   - 數值陣列長度不足
   - 參數超出有效範圍

2. **計算錯誤**:
   - 除以零
   - 矩陣不可逆
   - 數值計算溢位

3. **統計假設違反**:
   - 樣本大小不足
   - 分佈假設不符
   - 資料類型不適用

## 使用限制

### 資料大小限制
- 單次請求最大資料點數: 10,000
- 請求檔案大小限制: 10MB

### 計算複雜度限制
- 多項式迴歸最高次數: 10
- 相關矩陣最大維度: 100x100

### 請求頻率限制
- 目前無請求頻率限制

## 範例程式碼

### Python 範例

```python
import requests
import json

# 基本統計量計算
url = "http://localhost:8000/api/v1/descriptive/basic"
data = {"values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}

response = requests.post(url, json=data)
result = response.json()

print(f"平均數: {result['mean']}")
print(f"標準差: {result['std']}")
```

### JavaScript 範例

```javascript
const url = "http://localhost:8000/api/v1/descriptive/basic";
const data = {values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]};

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
.then(response => response.json())
.then(result => {
  console.log("平均數:", result.mean);
  console.log("標準差:", result.std);
});
```

### cURL 範例

```bash
curl -X POST "http://localhost:8000/api/v1/descriptive/basic" \
     -H "Content-Type: application/json" \
     -d '{"values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}'
```

## 效能最佳化

### 資料格式建議
- 使用數值陣列而非字串陣列
- 避免傳送不必要的大量資料
- 適當的資料預處理

### 並行請求
- 支援並行請求處理
- 建議使用連接池管理

### 快取策略
- 相同資料的計算結果會在短時間內快取
- 減少重複計算的開銷

## 版本資訊

### 當前版本: 1.0.0

#### 功能特色
- 完整的描述性統計功能
- 主要推論統計檢定
- 基本迴歸分析
- 相關性分析
- 機率分佈分析

#### 已知限制
- 尚未支援時間序列分析
- 尚未支援多變量統計分析
- 尚未支援非參數檢定

### 未來版本規劃

#### 1.1.0 (規劃中)
- 新增時間序列分析功能
- 新增非參數統計檢定
- 效能最佳化

#### 1.2.0 (規劃中)
- 新增多變量統計分析
- 新增視覺化端點
- 新增批次處理功能

## 支援與回饋

### 文件
- 線上文件: http://localhost:8000/docs
- API 參考: http://localhost:8000/redoc

### 問題回報
- 透過 GitHub Issues 回報問題
- 提供詳細的錯誤訊息和重現步驟

### 功能建議
- 歡迎透過 GitHub 提出功能建議
- 參與開源貢獻
