# SFDA 統計學分析 API

一個使用 Python FastAPI 建構的統計學分析 API 服務，提供各種統計學方法的計算功能。

## 功能特色

- 📊 **描述性統計**: 平均數、中位數、標準差、變異數等
- 📈 **推論統計**: t檢定、卡方檢定、ANOVA等假設檢定
- 📉 **迴歸分析**: 線性迴歸、多元迴歸、非線性迴歸
- 🔗 **相關性分析**: Pearson、Spearman、Kendall相關係數
- 📋 **機率分佈**: 常態分佈、t分佈、卡方分佈等各種分佈分析
- ⏱️ **時間序列**: 趨勢分析、季節性分析、ARIMA模型
- 🎯 **多變量分析**: 主成分分析、因子分析、分群分析

## 技術棧

- **FastAPI**: 現代化的 Web 框架
- **NumPy**: 數值計算
- **SciPy**: 科學計算
- **Pandas**: 資料處理
- **Statsmodels**: 統計模型
- **Scikit-learn**: 機器學習

## 快速開始

### 1. 安裝 uv（如果尚未安裝）

**Windows (PowerShell)**:
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**macOS/Linux**:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. 建立虛擬環境並安裝相依套件

```bash
# 建立虛擬環境
uv venv

# 啟動虛擬環境（Windows）
.venv\Scripts\activate

# 啟動虛擬環境（macOS/Linux）
source .venv/bin/activate

# 安裝相依套件
uv pip install -r requirements.txt
```

### 3. 啟動服務

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd "d:\@Projects\sfda_mcpserver\sfda_stat"; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### 3. 存取 API 文件

開啟瀏覽器，前往：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 環境管理

### 使用 uv 管理專案

本專案推薦使用 `uv` 進行 Python 環境管理，`uv` 是一個現代化、高效能的 Python 套件管理工具。

#### 基本指令

```bash
# 建立新的虛擬環境
uv venv

# 啟動虛擬環境
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# 安裝套件
uv pip install fastapi uvicorn[standard]

# 安裝開發相依套件
uv pip install -r requirements.txt

# 或者安裝完整專案（推薦）
uv pip install -e ".[dev,test]"

# 直接執行（無需啟動虛擬環境）
uv run uvicorn app.main:app --reload

# 執行測試
uv run pytest

# 新增套件並更新 requirements.txt
uv pip install new-package
uv pip freeze > requirements.txt
```

#### 使用開發腳本

為了簡化開發流程，我們提供了開發腳本：

**Windows (PowerShell)**:
```powershell
# 初始化專案
.\dev.ps1 setup

# 啟動開發伺服器
.\dev.ps1 dev

# 執行測試
.\dev.ps1 test

# 格式化程式碼
.\dev.ps1 format

# 檢查程式碼品質
.\dev.ps1 lint
```

**macOS/Linux (Bash)**:
```bash
# 給予執行權限
chmod +x dev.sh

# 初始化專案
./dev.sh setup

# 啟動開發伺服器
./dev.sh dev

# 執行測試
./dev.sh test
```

#### pyproject.toml 配置

本專案使用 `pyproject.toml` 進行現代化的 Python 專案配置，包含：

- 專案元資料和相依套件定義
- 開發和測試環境的可選相依套件
- 程式碼品質工具配置 (black, isort, flake8, mypy)
- 測試配置 (pytest, coverage)

安裝不同的相依套件組合：
```bash
# 僅安裝基本相依套件
uv pip install -e .

# 安裝開發相依套件
uv pip install -e ".[dev]"

# 安裝測試相依套件
uv pip install -e ".[test]"

# 安裝所有相依套件
uv pip install -e ".[dev,test]"
```

## API 端點

### 描述性統計
- `POST /api/v1/descriptive/basic` - 基本統計量
- `POST /api/v1/descriptive/distribution` - 分佈形狀測量
- `POST /api/v1/descriptive/percentiles` - 百分位數計算

### 推論統計
- `POST /api/v1/inferential/ttest` - t檢定
- `POST /api/v1/inferential/chisquare` - 卡方檢定
- `POST /api/v1/inferential/anova` - 變異數分析

### 迴歸分析
- `POST /api/v1/regression/linear` - 線性迴歸
- `POST /api/v1/regression/multiple` - 多元迴歸
- `POST /api/v1/regression/polynomial` - 多項式迴歸

### 相關性分析
- `POST /api/v1/correlation/pearson` - Pearson相關
- `POST /api/v1/correlation/spearman` - Spearman相關
- `POST /api/v1/correlation/matrix` - 相關矩陣

### 機率分佈
- `POST /api/v1/distribution/normal` - 常態分佈分析
- `POST /api/v1/distribution/test` - 分佈適合度檢定

## 使用範例

### 描述性統計

```python
import requests

data = {
    "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

response = requests.post("http://localhost:8000/api/v1/descriptive/basic", json=data)
result = response.json()

print(result)
# {
#     "mean": 5.5,
#     "median": 5.5,
#     "std": 3.0277,
#     "variance": 9.1667,
#     "min": 1,
#     "max": 10
# }
```

### 線性迴歸

```python
data = {
    "x": [1, 2, 3, 4, 5],
    "y": [2, 4, 6, 8, 10]
}

response = requests.post("http://localhost:8000/api/v1/regression/linear", json=data)
result = response.json()

print(result)
# {
#     "slope": 2.0,
#     "intercept": 0.0,
#     "r_squared": 1.0,
#     "p_value": 0.0
# }
```

## 專案結構

```
sfda_stat/
├── app/
│   ├── main.py                 # FastAPI 應用程式入口
│   ├── api/                    # API 路由
│   ├── services/               # 服務層
│   └── models/                 # 資料模型
├── tests/                      # 測試檔案
├── docs/                       # 文件
└── requirements.txt            # 相依套件
```

## 測試

執行測試：

```bash
# 使用 uv 執行測試
uv run pytest

# 執行特定測試
uv run pytest tests/test_descriptive.py

# 執行測試並產生覆蓋率報告
uv run pytest --cov=app tests/
```

## 部署

### 使用 uv 部署

```bash
# 建立生產環境
uv venv --python 3.11
source .venv/bin/activate  # Linux/macOS
# 或
.venv\Scripts\activate     # Windows

# 安裝生產相依套件
uv pip install -e .

# 啟動生產伺服器
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker 部署

```bash
# 建置 Docker 映像檔
docker build -t sfda-stat .

# 執行容器
docker run -p 8000:8000 sfda-stat

# 或使用開發腳本
.\dev.ps1 docker  # Windows
./dev.sh docker   # Linux/macOS
```

### Docker Compose 部署

建立 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  sfda-stat:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PYTHONPATH=/app
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

啟動：
```bash
docker-compose up -d
```

## 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/新功能`)
3. 提交變更 (`git commit -am '新增: 某某功能'`)
4. 推送到分支 (`git push origin feature/新功能`)
5. 建立 Pull Request

## 授權

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 聯絡資訊

如有問題或建議，請透過 GitHub Issues 聯絡我們。
