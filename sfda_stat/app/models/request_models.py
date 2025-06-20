from typing import List, Optional
from pydantic import BaseModel, Field


class BasicStatsRequest(BaseModel):
    """基本統計量請求模型"""

    values: List[float] = Field(..., description="數值陣列", min_items=1)


class DistributionStatsRequest(BaseModel):
    """分佈統計量請求模型"""

    values: List[float] = Field(..., description="數值陣列", min_items=3)


class PercentilesRequest(BaseModel):
    """百分位數請求模型"""

    values: List[float] = Field(..., description="數值陣列", min_items=1)
    percentiles: List[float] = Field(default=[25, 50, 75], description="百分位數列表")


class TTestRequest(BaseModel):
    """t檢定請求模型"""

    sample1: List[float] = Field(..., description="樣本1數據", min_items=2)
    sample2: Optional[List[float]] = Field(None, description="樣本2數據(雙樣本檢定用)")
    paired: bool = Field(False, description="是否為配對檢定")
    alpha: float = Field(0.05, description="顯著水準", gt=0, lt=1)
    alternative: str = Field(
        "two-sided", description="對立假設", pattern="^(two-sided|less|greater)$"
    )


class ChiSquareRequest(BaseModel):
    """卡方檢定請求模型"""

    observed: List[List[int]] = Field(..., description="觀察值矩陣")
    expected: Optional[List[List[float]]] = Field(None, description="期望值矩陣(可選)")


class ANOVARequest(BaseModel):
    """ANOVA請求模型"""

    groups: List[List[float]] = Field(..., description="各組數據", min_items=2)


class LinearRegressionRequest(BaseModel):
    """線性迴歸請求模型"""

    x: List[float] = Field(..., description="自變數", min_items=2)
    y: List[float] = Field(..., description="依變數", min_items=2)


class MultipleRegressionRequest(BaseModel):
    """多元迴歸請求模型"""

    x: List[List[float]] = Field(..., description="自變數矩陣", min_items=1)
    y: List[float] = Field(..., description="依變數", min_items=2)


class PolynomialRegressionRequest(BaseModel):
    """多項式迴歸請求模型"""

    x: List[float] = Field(..., description="自變數", min_items=3)
    y: List[float] = Field(..., description="依變數", min_items=3)
    degree: int = Field(2, description="多項式次數", ge=1, le=10)


class CorrelationRequest(BaseModel):
    """相關性請求模型"""

    x: List[float] = Field(..., description="變數X", min_items=3)
    y: List[float] = Field(..., description="變數Y", min_items=3)


class CorrelationMatrixRequest(BaseModel):
    """相關矩陣請求模型"""

    data: List[List[float]] = Field(..., description="數據矩陣", min_items=2)
    columns: List[str] = Field(..., description="變數名稱列表")


class NormalDistributionRequest(BaseModel):
    """常態分佈請求模型"""

    values: List[float] = Field(..., description="數值陣列", min_items=8)


class DistributionTestRequest(BaseModel):
    """分佈檢定請求模型"""

    values: List[float] = Field(..., description="數值陣列", min_items=8)
    distribution: str = Field(
        "normal", description="檢定的分佈類型", pattern="^(normal|exponential|uniform)$"
    )
