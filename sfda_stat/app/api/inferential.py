from fastapi import APIRouter, HTTPException
from app.models.request_models import TTestRequest, ChiSquareRequest, ANOVARequest
from app.models.response_models import TTestResponse, ChiSquareResponse, ANOVAResponse
from app.services.inferential_stats import InferentialStatsService

router = APIRouter()
stats_service = InferentialStatsService()


@router.post("/ttest", response_model=TTestResponse)
async def perform_ttest(request: TTestRequest):
    """
    執行 t 檢定

    支援單樣本、雙樣本獨立、配對 t 檢定
    """
    try:
        return stats_service.ttest(
            sample1=request.sample1,
            sample2=request.sample2,
            paired=request.paired,
            alpha=request.alpha,
            alternative=request.alternative,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/chisquare", response_model=ChiSquareResponse)
async def perform_chisquare_test(request: ChiSquareRequest):
    """
    執行卡方檢定

    適用於獨立性檢定和適合度檢定
    """
    try:
        return stats_service.perform_chisquare_test(
            observed=request.observed, expected=request.expected
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/anova", response_model=ANOVAResponse)
async def perform_anova(request: ANOVARequest):
    """
    執行單因子變異數分析 (One-way ANOVA)

    檢定多個組別間是否有顯著差異
    """
    try:
        return stats_service.perform_anova(request.groups)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
