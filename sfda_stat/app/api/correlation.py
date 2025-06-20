from fastapi import APIRouter, HTTPException
from app.models.request_models import CorrelationRequest, CorrelationMatrixRequest
from app.models.response_models import CorrelationResponse, CorrelationMatrixResponse
from app.services.correlation_analysis import CorrelationAnalysisService

router = APIRouter()
correlation_service = CorrelationAnalysisService()


@router.post("/pearson", response_model=CorrelationResponse)
async def pearson_correlation(request: CorrelationRequest):
    """
    計算 Pearson 相關係數

    適用於連續變數的線性相關分析
    """
    try:
        return correlation_service.pearson_correlation(request.x, request.y)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/spearman", response_model=CorrelationResponse)
async def spearman_correlation(request: CorrelationRequest):
    """
    計算 Spearman 等級相關係數

    適用於順序變數或非線性關係
    """
    try:
        return correlation_service.spearman_correlation(request.x, request.y)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/kendall", response_model=CorrelationResponse)
async def kendall_correlation(request: CorrelationRequest):
    """
    計算 Kendall tau 相關係數

    適用於小樣本或有序變數
    """
    try:
        return correlation_service.kendall_correlation(request.x, request.y)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/matrix", response_model=CorrelationMatrixResponse)
async def correlation_matrix(request: CorrelationMatrixRequest):
    """
    計算相關矩陣

    同時計算多個變數間的相關係數
    """
    try:
        return correlation_service.correlation_matrix(request.data, request.columns)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
