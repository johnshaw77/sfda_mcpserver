import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Optional
from app.models.response_models import (
    BasicStatsResponse,
    DistributionStatsResponse,
    PercentilesResponse,
)


class DescriptiveStatsService:
    """描述性統計服務類別"""

    def calculate_basic_stats(self, values: List[float]) -> BasicStatsResponse:
        """
        計算基本統計量

        Args:
            values: 數值陣列

        Returns:
            BasicStatsResponse: 基本統計量結果
        """
        if not values:
            raise ValueError("數值陣列不能為空")

        arr = np.array(values)

        # 計算眾數
        mode_result = stats.mode(arr, keepdims=True)
        mode_values = mode_result.mode.tolist() if len(mode_result.mode) > 0 else None

        return BasicStatsResponse(
            mean=float(np.mean(arr)),
            median=float(np.median(arr)),
            mode=mode_values,
            std=float(np.std(arr, ddof=1)) if len(arr) > 1 else 0.0,
            variance=float(np.var(arr, ddof=1)) if len(arr) > 1 else 0.0,
            min=float(np.min(arr)),
            max=float(np.max(arr)),
            range=float(np.max(arr) - np.min(arr)),
            count=len(arr),
        )

    def calculate_distribution_stats(
        self, values: List[float]
    ) -> DistributionStatsResponse:
        """
        計算分佈統計量

        Args:
            values: 數值陣列

        Returns:
            DistributionStatsResponse: 分佈統計量結果
        """
        if len(values) < 3:
            raise ValueError("計算分佈統計量至少需要3個數值")

        arr = np.array(values)

        # 計算偏度和峰度
        skewness = float(stats.skew(arr))
        kurtosis = float(stats.kurtosis(arr))

        # 常態性檢定 (Shapiro-Wilk)
        if len(arr) >= 3:
            shapiro_stat, shapiro_p = stats.shapiro(arr)
            is_normal = shapiro_p > 0.05
            normality_p_value = float(shapiro_p)
        else:
            is_normal = False
            normality_p_value = 0.0

        return DistributionStatsResponse(
            skewness=skewness,
            kurtosis=kurtosis,
            is_normal=is_normal,
            normality_p_value=normality_p_value,
        )

    def calculate_percentiles(
        self, values: List[float], percentiles: List[float]
    ) -> PercentilesResponse:
        """
        計算百分位數

        Args:
            values: 數值陣列
            percentiles: 百分位數列表

        Returns:
            PercentilesResponse: 百分位數結果
        """
        if not values:
            raise ValueError("數值陣列不能為空")

        arr = np.array(values)

        # 計算指定百分位數
        percentile_results = {}
        for p in percentiles:
            if 0 <= p <= 100:
                percentile_results[f"P{p}"] = float(np.percentile(arr, p))

        # 計算四分位數
        quartiles = {
            "Q1": float(np.percentile(arr, 25)),
            "Q2": float(np.percentile(arr, 50)),  # 中位數
            "Q3": float(np.percentile(arr, 75)),
            "IQR": float(np.percentile(arr, 75) - np.percentile(arr, 25)),
        }

        return PercentilesResponse(percentiles=percentile_results, quartiles=quartiles)
