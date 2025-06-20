from fastapi import APIRouter, HTTPException
from app.models.request_models import (
    LinearRegressionRequest,
    MultipleRegressionRequest,
    PolynomialRegressionRequest,
)
from app.models.response_models import RegressionResponse
from app.services.regression_analysis import RegressionAnalysisService

router = APIRouter()
regression_service = RegressionAnalysisService()


@router.post("/linear", response_model=RegressionResponse)
async def linear_regression(request: LinearRegressionRequest):
    """
    執行簡單線性迴歸分析

    分析兩個變數間的線性關係
    """
    try:
        return regression_service.linear_regression(request.x, request.y)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/multiple", response_model=RegressionResponse)
async def multiple_regression(request: MultipleRegressionRequest):
    """
    執行多元線性迴歸分析

    分析多個自變數與因變數的關係
    """
    try:
        return regression_service.multiple_regression(request.x, request.y)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/polynomial", response_model=RegressionResponse)
async def polynomial_regression(request: PolynomialRegressionRequest):
    """
    執行多項式迴歸分析

    分析非線性關係
    """
    try:
        return regression_service.polynomial_regression(
            request.x, request.y, request.degree
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
