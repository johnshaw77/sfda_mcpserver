# SFDA Nexus × Qwen-Agent Docker 容器
FROM python:3.13-slim

# 設定工作目錄
WORKDIR /app

# 設定環境變數
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 系統依賴
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 建立非 root 使用者
RUN groupadd -r qwenagent && useradd -r -g qwenagent -d /app -s /bin/bash qwenagent

# 複製需求檔案
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install gradio>=4.0.0

# 複製應用程式檔案
COPY config.py .
COPY mcp_tools.py .
COPY qwen_tools.py .
COPY qwen_agent_demo.py .
COPY gradio_ui.py .
COPY README_GRADIO.md .

# 建立日誌目錄
RUN mkdir -p /app/logs && \
    chown -R qwenagent:qwenagent /app

# 切換到非 root 使用者
USER qwenagent

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7860 || exit 1

# 曝露端口
EXPOSE 7860

# 啟動命令
CMD ["python", "gradio_ui.py"] 