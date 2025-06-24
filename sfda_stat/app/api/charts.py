from fastapi import APIRouter, HTTPException
from app.models.chart_models import (
    CreatePieChartRequest,
    CreateBarChartRequest,
    CreateLineChartRequest,
    SimpleChartRequest,
    ChartResponse,
)
from app.services.chart_service import ChartService

router = APIRouter()
chart_service = ChartService()


@router.post("/pie", response_model=ChartResponse)
async def create_pie_chart(request: CreatePieChartRequest):
    """
    創建圓餅圖

    用於顯示各部分占整體的比例關係
    """
    try:
        return chart_service.create_pie_chart(request.data, request.title)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bar", response_model=ChartResponse)
async def create_bar_chart(request: CreateBarChartRequest):
    """
    創建長條圖

    用於比較不同類別的數值大小
    """
    try:
        return chart_service.create_bar_chart(
            request.data, 
            request.title, 
            request.x_axis_label, 
            request.y_axis_label
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/line", response_model=ChartResponse)
async def create_line_chart(request: CreateLineChartRequest):
    """
    創建折線圖

    用於顯示數據隨時間或其他連續變量的變化趨勢
    """
    try:
        return chart_service.create_line_chart(
            request.data, 
            request.title, 
            request.x_axis_label, 
            request.y_axis_label
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/simple", response_model=ChartResponse)
async def create_simple_chart(request: SimpleChartRequest):
    """
    創建簡單圖表

    接受標籤和數值數組，根據指定類型創建圖表
    這是最常用的端點，適合 MCP 工具調用
    """
    try:
        return chart_service.create_chart_from_simple_data(
            request.labels,
            request.values,
            request.chart_type,
            request.title
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/health")
async def chart_health_check():
    """
    圖表服務健康檢查
    """
    return {
        "status": "healthy",
        "service": "chart_service",
        "supported_types": ["pie", "bar", "line"]
    } 