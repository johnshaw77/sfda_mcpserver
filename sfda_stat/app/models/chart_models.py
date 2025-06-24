from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChartDataPoint(BaseModel):
    """圖表數據點模型"""
    label: str = Field(..., description="標籤")
    value: float = Field(..., description="數值")


class CreatePieChartRequest(BaseModel):
    """創建圓餅圖請求模型"""
    data: List[ChartDataPoint] = Field(..., description="圖表數據", min_items=1)
    title: Optional[str] = Field(None, description="圖表標題")


class CreateBarChartRequest(BaseModel):
    """創建長條圖請求模型"""
    data: List[ChartDataPoint] = Field(..., description="圖表數據", min_items=1)
    title: Optional[str] = Field(None, description="圖表標題")
    x_axis_label: Optional[str] = Field(None, description="X軸標籤")
    y_axis_label: Optional[str] = Field(None, description="Y軸標籤")


class CreateLineChartRequest(BaseModel):
    """創建折線圖請求模型"""
    data: List[ChartDataPoint] = Field(..., description="圖表數據", min_items=2)
    title: Optional[str] = Field(None, description="圖表標題")
    x_axis_label: Optional[str] = Field(None, description="X軸標籤")
    y_axis_label: Optional[str] = Field(None, description="Y軸標籤")


class ChartResponse(BaseModel):
    """圖表響應模型"""
    success: bool = Field(..., description="是否成功")
    chart_type: str = Field(..., description="圖表類型")
    data: List[Dict[str, Any]] = Field(..., description="圖表數據")
    title: Optional[str] = Field(None, description="圖表標題")
    confidence: float = Field(1.0, description="信心度")
    reasoning: str = Field(..., description="創建原因")
    metadata: Optional[Dict[str, Any]] = Field(None, description="附加元數據")


class SimpleChartRequest(BaseModel):
    """簡化圖表請求模型 - 支援直接傳入標籤和數值"""
    labels: List[str] = Field(..., description="標籤陣列", min_items=1)
    values: List[float] = Field(..., description="數值陣列", min_items=1)
    title: Optional[str] = Field(None, description="圖表標題")
    chart_type: str = Field(..., description="圖表類型", pattern="^(pie|bar|line)$") 