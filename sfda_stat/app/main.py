from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import descriptive, inferential, regression, correlation, distribution, charts

app = FastAPI(
    title="SFDA 統計學分析 API",
    description="提供各種統計學方法的計算功能",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊路由
app.include_router(
    descriptive.router, prefix="/api/v1/descriptive", tags=["描述性統計"]
)
app.include_router(inferential.router, prefix="/api/v1/inferential", tags=["推論統計"])
app.include_router(regression.router, prefix="/api/v1/regression", tags=["迴歸分析"])
app.include_router(
    correlation.router, prefix="/api/v1/correlation", tags=["相關性分析"]
)
app.include_router(
    distribution.router, prefix="/api/v1/distribution", tags=["機率分佈"]
)
app.include_router(
    charts.router, prefix="/api/v1/charts", tags=["圖表創建"]
)


@app.get("/")
async def root():
    """
    根端點，回傳 API 基本資訊
    """
    return {
        "message": "歡迎使用 SFDA 統計學分析 API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    """
    健康檢查端點
    """
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
