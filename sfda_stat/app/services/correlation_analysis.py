from typing import List
import numpy as np
from scipy import stats
from app.models.response_models import CorrelationResponse, CorrelationMatrixResponse


class CorrelationAnalysisService:
    """相關性分析服務類別"""

    def pearson_correlation(
        self, x: List[float], y: List[float]
    ) -> CorrelationResponse:
        """計算 Pearson 相關係數"""
        try:
            x_array = np.array(x)
            y_array = np.array(y)

            # 計算 Pearson 相關係數
            correlation_coefficient, p_value = stats.pearsonr(x_array, y_array)

            # 計算信賴區間（使用 Fisher z 轉換）
            n = len(x)
            z = np.arctanh(correlation_coefficient)
            se = 1 / np.sqrt(n - 3)
            alpha = 0.05
            z_critical = stats.norm.ppf(1 - alpha / 2)

            z_lower = z - z_critical * se
            z_upper = z + z_critical * se

            confidence_interval = [float(np.tanh(z_lower)), float(np.tanh(z_upper))]

            # 解釋相關強度
            abs_corr = abs(correlation_coefficient)
            if abs_corr >= 0.9:
                interpretation = "非常強相關"
            elif abs_corr >= 0.7:
                interpretation = "強相關"
            elif abs_corr >= 0.5:
                interpretation = "中等相關"
            elif abs_corr >= 0.3:
                interpretation = "弱相關"
            else:
                interpretation = "非常弱相關"

            if correlation_coefficient > 0:
                interpretation = "正" + interpretation
            elif correlation_coefficient < 0:
                interpretation = "負" + interpretation
            else:
                interpretation = "無相關"

            return CorrelationResponse(
                correlation_coefficient=float(correlation_coefficient),
                p_value=float(p_value),
                confidence_interval=confidence_interval,
                interpretation=interpretation,
            )

        except Exception as e:
            raise ValueError(f"Pearson 相關係數計算失敗: {str(e)}")

    def spearman_correlation(
        self, x: List[float], y: List[float]
    ) -> CorrelationResponse:
        """計算 Spearman 等級相關係數"""
        try:
            x_array = np.array(x)
            y_array = np.array(y)

            # 計算 Spearman 相關係數
            correlation_coefficient, p_value = stats.spearmanr(x_array, y_array)

            # Spearman 相關係數的信賴區間較複雜，這裡提供近似值
            n = len(x)
            se = 1 / np.sqrt(n - 3)
            alpha = 0.05
            z_critical = stats.norm.ppf(1 - alpha / 2)

            # 使用 Fisher z 轉換的近似
            z = np.arctanh(correlation_coefficient)
            z_lower = z - z_critical * se
            z_upper = z + z_critical * se

            confidence_interval = [float(np.tanh(z_lower)), float(np.tanh(z_upper))]

            # 解釋相關強度
            abs_corr = abs(correlation_coefficient)
            if abs_corr >= 0.9:
                interpretation = "非常強等級相關"
            elif abs_corr >= 0.7:
                interpretation = "強等級相關"
            elif abs_corr >= 0.5:
                interpretation = "中等等級相關"
            elif abs_corr >= 0.3:
                interpretation = "弱等級相關"
            else:
                interpretation = "非常弱等級相關"

            if correlation_coefficient > 0:
                interpretation = "正" + interpretation
            elif correlation_coefficient < 0:
                interpretation = "負" + interpretation
            else:
                interpretation = "無等級相關"

            return CorrelationResponse(
                correlation_coefficient=float(correlation_coefficient),
                p_value=float(p_value),
                confidence_interval=confidence_interval,
                interpretation=interpretation,
            )

        except Exception as e:
            raise ValueError(f"Spearman 相關係數計算失敗: {str(e)}")

    def kendall_correlation(
        self, x: List[float], y: List[float]
    ) -> CorrelationResponse:
        """計算 Kendall τ 相關係數"""
        try:
            x_array = np.array(x)
            y_array = np.array(y)

            # 計算 Kendall τ 相關係數
            correlation_coefficient, p_value = stats.kendalltau(x_array, y_array)

            # Kendall τ 的信賴區間計算較複雜，這裡提供近似值
            n = len(x)
            se = np.sqrt(2 * (2 * n + 5) / (9 * n * (n - 1)))
            alpha = 0.05
            z_critical = stats.norm.ppf(1 - alpha / 2)

            confidence_interval = [
                float(correlation_coefficient - z_critical * se),
                float(correlation_coefficient + z_critical * se),
            ]

            # 限制信賴區間在 [-1, 1] 範圍內
            confidence_interval[0] = max(-1.0, confidence_interval[0])
            confidence_interval[1] = min(1.0, confidence_interval[1])

            # 解釋相關強度
            abs_corr = abs(correlation_coefficient)
            if abs_corr >= 0.7:
                interpretation = "強 Kendall 相關"
            elif abs_corr >= 0.5:
                interpretation = "中等 Kendall 相關"
            elif abs_corr >= 0.3:
                interpretation = "弱 Kendall 相關"
            else:
                interpretation = "非常弱 Kendall 相關"

            if correlation_coefficient > 0:
                interpretation = "正" + interpretation
            elif correlation_coefficient < 0:
                interpretation = "負" + interpretation
            else:
                interpretation = "無 Kendall 相關"

            return CorrelationResponse(
                correlation_coefficient=float(correlation_coefficient),
                p_value=float(p_value),
                confidence_interval=confidence_interval,
                interpretation=interpretation,
            )

        except Exception as e:
            raise ValueError(f"Kendall 相關係數計算失敗: {str(e)}")

    def correlation_matrix(
        self, data: List[List[float]], columns: List[str]
    ) -> CorrelationMatrixResponse:
        """計算相關矩陣"""
        try:
            data_array = np.array(data).T  # 轉置，使每列為一個變數

            # 計算相關矩陣
            n_vars = data_array.shape[1]
            correlation_matrix = []
            p_values_matrix = []

            for i in range(n_vars):
                corr_row = []
                p_row = []
                for j in range(n_vars):
                    if i == j:
                        corr_row.append(1.0)
                        p_row.append(0.0)
                    else:
                        corr, p_val = stats.pearsonr(data_array[:, i], data_array[:, j])
                        corr_row.append(float(corr))
                        p_row.append(float(p_val))

                correlation_matrix.append(corr_row)
                p_values_matrix.append(p_row)

            return CorrelationMatrixResponse(
                correlation_matrix=correlation_matrix,
                p_values_matrix=p_values_matrix,
                columns=columns,
            )

        except Exception as e:
            raise ValueError(f"相關矩陣計算失敗: {str(e)}")
