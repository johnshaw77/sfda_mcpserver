# SFDA 統計學分析 API 開發腳本 (Windows PowerShell)

param(
	[Parameter(Position = 0)]
	[string]$Command = "help"
)

# 顏色定義
$Colors = @{
	Red    = "Red"
	Green  = "Green" 
	Yellow = "Yellow"
	Blue   = "Blue"
	White  = "White"
}

# 印出彩色訊息
function Write-Message {
	param([string]$Message)
	Write-Host "[SFDA-STAT] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
	param([string]$Message)
	Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
	param([string]$Message)
	Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
	param([string]$Message)
	Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# 檢查是否安裝 uv
function Test-UV {
	try {
		$uvVersion = uv --version
		Write-Success "uv 已安裝: $uvVersion"
		return $true
	}
	catch {
		Write-Error "uv 未安裝，請先安裝 uv"
		Write-Host "執行: powershell -c `"irm https://astral.sh/uv/install.ps1 | iex`""
		return $false
	}
}

# 建立虛擬環境
function Setup-Environment {
	Write-Message "建立虛擬環境..."
    
	if (-not (Test-Path ".venv")) {
		uv venv
		Write-Success "虛擬環境建立完成"
	}
 else {
		Write-Warning "虛擬環境已存在"
	}
    
	Write-Message "安裝相依套件..."
	uv pip install -e ".[dev,test]"
	Write-Success "相依套件安裝完成"
}

# 執行測試
function Invoke-Tests {
	Write-Message "執行測試..."
	uv run pytest tests/ -v --cov=app --cov-report=html
	Write-Success "測試完成，覆蓋率報告已產生在 htmlcov/ 目錄"
}

# 程式碼格式化
function Format-Code {
	Write-Message "格式化程式碼..."
	uv run black app/ tests/
	uv run isort app/ tests/
	Write-Success "程式碼格式化完成"
}

# 程式碼檢查
function Test-CodeQuality {
	Write-Message "檢查程式碼品質..."
	uv run flake8 app/ tests/
	uv run mypy app/
	Write-Success "程式碼檢查完成"
}

# 啟動開發伺服器
function Start-DevServer {
	Write-Message "啟動開發伺服器..."
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

# 啟動生產伺服器
function Start-ProdServer {
	Write-Message "啟動生產伺服器..."
	uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
}

# 清理暫存檔案
function Clear-TempFiles {
	Write-Message "清理暫存檔案..."
    
	# 清理 __pycache__ 目錄
	Get-ChildItem -Path . -Recurse -Directory -Name "__pycache__" | ForEach-Object {
		Remove-Item -Path $_ -Recurse -Force -ErrorAction SilentlyContinue
	}
    
	# 清理 .pyc 檔案
	Get-ChildItem -Path . -Recurse -Filter "*.pyc" | Remove-Item -Force -ErrorAction SilentlyContinue
    
	# 清理其他暫存目錄
	$tempDirs = @(".pytest_cache", "htmlcov", "dist", "build", ".coverage")
	foreach ($dir in $tempDirs) {
		if (Test-Path $dir) {
			Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
		}
	}
    
	# 清理 .egg-info 目錄
	Get-ChildItem -Path . -Recurse -Directory -Filter "*.egg-info" | ForEach-Object {
		Remove-Item -Path $_ -Recurse -Force -ErrorAction SilentlyContinue
	}
    
	Write-Success "清理完成"
}

# 建置 Docker 映像檔
function Build-Docker {
	Write-Message "建置 Docker 映像檔..."
	docker build -t sfda-stat:latest .
	Write-Success "Docker 映像檔建置完成"
}

# 顯示幫助資訊
function Show-Help {
	Write-Host "SFDA 統計學分析 API 開發工具" -ForegroundColor $Colors.Blue
	Write-Host ""
	Write-Host "使用方式: .\dev.ps1 [命令]" -ForegroundColor $Colors.White
	Write-Host ""
	Write-Host "可用命令:" -ForegroundColor $Colors.White
	Write-Host "  setup     - 建立虛擬環境並安裝相依套件" -ForegroundColor $Colors.White
	Write-Host "  test      - 執行測試" -ForegroundColor $Colors.White
	Write-Host "  format    - 格式化程式碼" -ForegroundColor $Colors.White
	Write-Host "  lint      - 檢查程式碼品質" -ForegroundColor $Colors.White
	Write-Host "  dev       - 啟動開發伺服器" -ForegroundColor $Colors.White
	Write-Host "  prod      - 啟動生產伺服器" -ForegroundColor $Colors.White
	Write-Host "  clean     - 清理暫存檔案" -ForegroundColor $Colors.White
	Write-Host "  docker    - 建置 Docker 映像檔" -ForegroundColor $Colors.White
	Write-Host "  help      - 顯示此幫助資訊" -ForegroundColor $Colors.White
	Write-Host ""
	Write-Host "範例:" -ForegroundColor $Colors.Yellow
	Write-Host "  .\dev.ps1 setup     # 初始化專案" -ForegroundColor $Colors.Yellow
	Write-Host "  .\dev.ps1 dev       # 啟動開發伺服器" -ForegroundColor $Colors.Yellow
	Write-Host "  .\dev.ps1 test      # 執行測試" -ForegroundColor $Colors.Yellow
}

# 主函數
function Main {
	if (-not (Test-UV)) {
		exit 1
	}
    
	switch ($Command.ToLower()) {
		"setup" {
			Setup-Environment
		}
		"test" {
			Invoke-Tests
		}
		"format" {
			Format-Code
		}
		"lint" {
			Test-CodeQuality
		}
		"dev" {
			Start-DevServer
		}
		"prod" {
			Start-ProdServer
		}
		"clean" {
			Clear-TempFiles
		}
		"docker" {
			Build-Docker
		}
		"help" {
			Show-Help
		}
		default {
			Write-Error "未知命令: $Command"
			Show-Help
			exit 1
		}
	}
}

# 執行主函數
Main
