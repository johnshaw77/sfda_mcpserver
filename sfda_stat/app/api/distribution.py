from fastapi import APIRouter, HTTPException
from app.models.request_models import NormalDistributionRequest, DistributionTestRequest
from app.models.response_models import DistributionAnalysisResponse
from app.services.distribution_analysis import DistributionAnalysisService

router = APIRouter()
distribution_service = DistributionAnalysisService()


@router.post("/normal", response_model=DistributionAnalysisResponse)
async def normal_distribution_analysis(request: NormalDistributionRequest):
    """
    常態分佈分析

    估計參數並檢定是否符合常態分佈
    """
    try:
        return distribution_service.normal_distribution_analysis(request.values)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/test", response_model=DistributionAnalysisResponse)
async def distribution_goodness_of_fit(request: DistributionTestRequest):
    """
    分佈適合度檢定

    檢定數據是否符合指定的機率分佈
    """
    try:
        return distribution_service.distribution_test(
            request.values, request.distribution
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
