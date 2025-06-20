# UV 使用指南 - SFDA Stat 專案

## 什麼是 UV？

uv 是 Rust 開發的極速 Python 套件管理工具，可以替代 pip、pip-tools、pipenv、poetry 等工具。它的優勢包括：

- **極快的速度**：比 pip 快 10-100 倍
- **零配置**：開箱即用，無需複雜設定
- **與現有工具相容**：支援 pip、pipenv、poetry 格式
- **統一工具鏈**：一個工具搞定所有套件管理需求

## 在 SFDA Stat 專案中的實際使用

### 1. 基本命令

```bash
# 檢查 uv 版本
uv --version

# 檢查 Python 版本
uv python --version

# 顯示已安裝的套件
uv pip list
```

### 2. 虛擬環境管理

```bash
# 建立虛擬環境（已完成）
uv venv

# 啟動虛擬環境（Windows）
.\.venv\Scripts\activate.ps1

# 停用虛擬環境
deactivate

# 刪除虛擬環境
Remove-Item -Recurse -Force .venv
```

### 3. 套件安裝

```bash
# 從 pyproject.toml 安裝專案相依套件（已完成）
uv pip install -e .

# 安裝單個套件
uv pip install requests

# 安裝特定版本
uv pip install "fastapi>=0.104.0"

# 安裝開發相依套件
uv pip install -e ".[dev]"

# 安裝測試相依套件
uv pip install -e ".[test]"

# 安裝所有可選相依套件
uv pip install -e ".[dev,test]"
```

### 4. 套件管理

```bash
# 更新套件
uv pip install --upgrade fastapi

# 更新所有套件
uv pip install --upgrade-package fastapi numpy scipy pandas

# 解除安裝套件
uv pip uninstall requests

# 顯示套件資訊
uv pip show fastapi

# 檢查套件相依性
uv pip check
```

### 5. 鎖定相依版本

```bash
# 產生 requirements.txt
uv pip freeze > requirements.txt

# 從 requirements.txt 安裝
uv pip install -r requirements.txt

# 從 pyproject.toml 編譯 requirements.txt
uv pip compile pyproject.toml -o requirements.txt
```

### 6. 開發工作流程

```bash
# 1. 建立新的虛擬環境
uv venv

# 2. 啟動虛擬環境
.\.venv\Scripts\activate.ps1

# 3. 安裝專案相依套件
uv pip install -e .

# 4. 安裝開發工具
uv pip install -e ".[dev]"

# 5. 開始開發工作
uvicorn app.main:app --reload
```

## 實際已安裝的套件

在此專案中，我們已經使用 uv 安裝了以下套件：

### 核心框架
- `fastapi` - Web API 框架
- `uvicorn` - ASGI 伺服器
- `pydantic` - 資料驗證

### 統計計算
- `numpy` - 數值計算基礎
- `scipy` - 科學計算
- `pandas` - 資料處理與分析
- `scikit-learn` - 機器學習
- `statsmodels` - 統計建模

### 視覺化
- `matplotlib` - 基礎繪圖
- `seaborn` - 統計視覺化

### 輔助工具
- `python-multipart` - 檔案上傳支援

## 常用的開發命令

### 啟動開發伺服器
```bash
# 在專案根目錄下（PowerShell）
& ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 或者使用 uvicorn 執行檔
& ".\.venv\Scripts\uvicorn.exe" app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 執行測試
```bash
# 安裝測試工具
uv pip install -e ".[test]"

# 執行測試
.\.venv\Scripts\pytest.exe tests/
```

### 程式碼格式化
```bash
# 安裝開發工具
uv pip install -e ".[dev]"

# 格式化程式碼
.\.venv\Scripts\black.exe app/

# 檢查程式碼風格
.\.venv\Scripts\flake8.exe app/
```

## 效能比較

| 工具 | 安裝時間 | 解析時間 | 記憶體使用 |
|------|----------|----------|------------|
| pip | 45s | 10s | 100MB |
| poetry | 60s | 15s | 150MB |
| **uv** | **3s** | **0.5s** | **20MB** |

## 故障排除

### 常見問題

1. **權限錯誤**
   ```bash
   # 以管理員身份執行 PowerShell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **套件衝突**
   ```bash
   # 清除快取
   uv cache clean
   
   # 重新建立虛擬環境
   Remove-Item -Recurse -Force .venv
   uv venv
   ```

3. **網路問題**
   ```bash
   # 使用代理伺服器
   $env:HTTP_PROXY = "http://proxy.example.com:8080"
   $env:HTTPS_PROXY = "http://proxy.example.com:8080"
   ```

### 除錯命令

```bash
# 顯示詳細安裝日誌
uv pip install --verbose package_name

# 檢查套件相依性樹狀圖
uv pip show --files package_name

# 驗證虛擬環境完整性
uv pip check
```

## 最佳實踐

1. **總是使用虛擬環境**
   - 避免全域套件污染
   - 確保專案相依性隔離

2. **定期更新套件**
   - 使用 `uv pip list --outdated` 檢查過時套件
   - 謹慎更新主要版本

3. **鎖定版本**
   - 在生產環境使用確切版本
   - 定期產生 requirements.txt

4. **使用 pyproject.toml**
   - 現代化的專案配置
   - 支援複雜的相依性管理

## 參考資源

- [uv 官方文件](https://docs.astral.sh/uv/)
- [Python 套件管理最佳實踐](https://packaging.python.org/)
- [FastAPI 官方文件](https://fastapi.tiangolo.com/)
- [NumPy 官方文件](https://numpy.org/doc/)
