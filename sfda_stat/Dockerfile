FROM python:3.11-slim

WORKDIR /app

# 安裝系統相依套件
RUN apt-get update && apt-get install -y \
	gcc \
	g++ \
	curl \
	&& rm -rf /var/lib/apt/lists/*

# 安裝 uv
ADD https://astral.sh/uv/install.sh /install.sh
RUN chmod -R 655 /install.sh && /install.sh && rm /install.sh

# 將 uv 加入 PATH
ENV PATH="/root/.cargo/bin/:$PATH"

# 複製專案設定檔案
COPY pyproject.toml .
COPY requirements.txt .

# 建立虛擬環境並安裝相依套件
RUN uv venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN uv pip install -r requirements.txt

# 複製應用程式碼
COPY . .

# 暴露連接埠
EXPOSE 8000

# 設定健康檢查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
	CMD curl -f http://localhost:8000/health || exit 1

# 啟動命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
