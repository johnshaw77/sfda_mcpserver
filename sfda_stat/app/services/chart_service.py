from typing import List, Dict, Any, Optional
from app.models.chart_models import ChartDataPoint, ChartResponse


class ChartService:
    """圖表服務類"""

    def create_pie_chart(
        self, 
        data: List[ChartDataPoint], 
        title: Optional[str] = None
    ) -> ChartResponse:
        """
        創建圓餅圖
        
        Args:
            data: 圖表數據點列表
            title: 圖表標題
            
        Returns:
            ChartResponse: 圖表響應
        """
        try:
            # 驗證數據
            if not data:
                raise ValueError("數據不能為空")
            
            # 轉換數據格式，與現有 SmartChart 組件兼容
            chart_data = []
            for point in data:
                chart_data.append({
                    "label": point.label,
                    "value": point.value
                })
            
            # 計算總和用於驗證
            total_value = sum(point.value for point in data)
            
            return ChartResponse(
                success=True,
                chart_type="pie",
                data=chart_data,
                title=title or "圓餅圖",
                confidence=1.0,
                reasoning=f"成功創建包含 {len(data)} 個數據點的圓餅圖，總值為 {total_value}",
                metadata={
                    "total_value": total_value,
                    "data_points_count": len(data)
                }
            )
            
        except Exception as e:
            return ChartResponse(
                success=False,
                chart_type="pie",
                data=[],
                title=title,
                confidence=0.0,
                reasoning=f"創建圓餅圖失敗: {str(e)}"
            )

    def create_bar_chart(
        self, 
        data: List[ChartDataPoint], 
        title: Optional[str] = None,
        x_axis_label: Optional[str] = None,
        y_axis_label: Optional[str] = None
    ) -> ChartResponse:
        """
        創建長條圖
        
        Args:
            data: 圖表數據點列表
            title: 圖表標題
            x_axis_label: X軸標籤
            y_axis_label: Y軸標籤
            
        Returns:
            ChartResponse: 圖表響應
        """
        try:
            # 驗證數據
            if not data:
                raise ValueError("數據不能為空")
            
            # 轉換數據格式
            chart_data = []
            for point in data:
                chart_data.append({
                    "label": point.label,
                    "value": point.value
                })
            
            # 計算統計信息
            values = [point.value for point in data]
            max_value = max(values)
            min_value = min(values)
            
            return ChartResponse(
                success=True,
                chart_type="bar",
                data=chart_data,
                title=title or "長條圖",
                confidence=1.0,
                reasoning=f"成功創建包含 {len(data)} 個數據點的長條圖，數值範圍 {min_value} - {max_value}",
                metadata={
                    "max_value": max_value,
                    "min_value": min_value,
                    "data_points_count": len(data),
                    "x_axis_label": x_axis_label,
                    "y_axis_label": y_axis_label
                }
            )
            
        except Exception as e:
            return ChartResponse(
                success=False,
                chart_type="bar",
                data=[],
                title=title,
                confidence=0.0,
                reasoning=f"創建長條圖失敗: {str(e)}"
            )

    def create_line_chart(
        self, 
        data: List[ChartDataPoint], 
        title: Optional[str] = None,
        x_axis_label: Optional[str] = None,
        y_axis_label: Optional[str] = None
    ) -> ChartResponse:
        """
        創建折線圖
        
        Args:
            data: 圖表數據點列表
            title: 圖表標題
            x_axis_label: X軸標籤
            y_axis_label: Y軸標籤
            
        Returns:
            ChartResponse: 圖表響應
        """
        try:
            # 驗證數據
            if len(data) < 2:
                raise ValueError("折線圖至少需要2個數據點")
            
            # 轉換數據格式
            chart_data = []
            for point in data:
                chart_data.append({
                    "label": point.label,
                    "value": point.value
                })
            
            # 計算統計信息
            values = [point.value for point in data]
            max_value = max(values)
            min_value = min(values)
            
            return ChartResponse(
                success=True,
                chart_type="line",
                data=chart_data,
                title=title or "折線圖",
                confidence=1.0,
                reasoning=f"成功創建包含 {len(data)} 個數據點的折線圖，數值範圍 {min_value} - {max_value}",
                metadata={
                    "max_value": max_value,
                    "min_value": min_value,
                    "data_points_count": len(data),
                    "x_axis_label": x_axis_label,
                    "y_axis_label": y_axis_label
                }
            )
            
        except Exception as e:
            return ChartResponse(
                success=False,
                chart_type="line",
                data=[],
                title=title,
                confidence=0.0,
                reasoning=f"創建折線圖失敗: {str(e)}"
            )

    def create_chart_from_simple_data(
        self, 
        labels: List[str], 
        values: List[float], 
        chart_type: str,
        title: Optional[str] = None
    ) -> ChartResponse:
        """
        從簡單的標籤和數值數組創建圖表
        
        Args:
            labels: 標籤列表
            values: 數值列表
            chart_type: 圖表類型 (pie, bar, line)
            title: 圖表標題
            
        Returns:
            ChartResponse: 圖表響應
        """
        try:
            # 驗證數據
            if len(labels) != len(values):
                raise ValueError("標籤和數值的數量必須相同")
            
            if not labels or not values:
                raise ValueError("標籤和數值不能為空")
            
            # 轉換為 ChartDataPoint 格式
            data_points = [
                ChartDataPoint(label=label, value=value)
                for label, value in zip(labels, values)
            ]
            
            # 根據圖表類型調用對應方法
            if chart_type == "pie":
                return self.create_pie_chart(data_points, title)
            elif chart_type == "bar":
                return self.create_bar_chart(data_points, title)
            elif chart_type == "line":
                return self.create_line_chart(data_points, title)
            else:
                raise ValueError(f"不支援的圖表類型: {chart_type}")
                
        except Exception as e:
            return ChartResponse(
                success=False,
                chart_type=chart_type,
                data=[],
                title=title,
                confidence=0.0,
                reasoning=f"創建圖表失敗: {str(e)}"
            ) 