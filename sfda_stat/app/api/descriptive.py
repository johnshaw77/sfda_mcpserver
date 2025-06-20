from fastapi import APIRouter, HTTPException
from app.models.request_models import (
    BasicStatsRequest,
    DistributionStatsRequest,
    PercentilesRequest,
)
from app.models.response_models import (
    BasicStatsResponse,
    DistributionStatsResponse,
    PercentilesResponse,
)
from app.services.descriptive_stats import DescriptiveStatsService

router = APIRouter()
stats_service = DescriptiveStatsService()


@router.post("/basic", response_model=BasicStatsResponse)
async def calculate_basic_stats(request: BasicStatsRequest):
    """
    計算基本統計量

    包括：平均數、中位數、眾數、標準差、變異數、最小值、最大值、全距等
    """
    try:
        return stats_service.calculate_basic_stats(request.values)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/distribution", response_model=DistributionStatsResponse)
async def calculate_distribution_stats(request: DistributionStatsRequest):
    """
    計算分佈統計量

    包括：偏度、峰度、常態性檢定等
    """
    try:
        return stats_service.calculate_distribution_stats(request.values)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/percentiles", response_model=PercentilesResponse)
async def calculate_percentiles(request: PercentilesRequest):
    """
    計算百分位數

    包括：指定百分位數、四分位數等
    """
    try:
        return stats_service.calculate_percentiles(request.values, request.percentiles)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
