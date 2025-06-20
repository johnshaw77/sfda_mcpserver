from typing import List, Optional, Tuple
import numpy as np
from scipy import stats
from app.models.response_models import TTestResponse, ChiSquareResponse, ANOVAResponse


class InferentialStatsService:
    """推論統計服務類別"""

    def ttest(
        self,
        sample1: List[float],
        sample2: Optional[List[float]] = None,
        paired: bool = False,
        alpha: float = 0.05,
        alternative: str = "two-sided",
    ) -> TTestResponse:
        """執行 t 檢定"""
        try:
            sample1_array = np.array(sample1)

            if sample2 is None:
                # 單樣本 t 檢定
                statistic, p_value = stats.ttest_1samp(sample1_array, 0)
                degrees_of_freedom = len(sample1) - 1
            else:
                sample2_array = np.array(sample2)
                if paired:
                    # 配對樣本 t 檢定
                    statistic, p_value = stats.ttest_rel(sample1_array, sample2_array)
                    degrees_of_freedom = len(sample1) - 1
                else:
                    # 獨立樣本 t 檢定
                    statistic, p_value = stats.ttest_ind(sample1_array, sample2_array)
                    degrees_of_freedom = len(sample1) + len(sample2) - 2

            # 調整 p 值根據對立假設
            if alternative == "less":
                p_value = p_value / 2 if statistic < 0 else 1 - p_value / 2
            elif alternative == "greater":
                p_value = p_value / 2 if statistic > 0 else 1 - p_value / 2

            # 計算臨界值
            if alternative == "two-sided":
                critical_value = stats.t.ppf(1 - alpha / 2, degrees_of_freedom)
            else:
                critical_value = stats.t.ppf(1 - alpha, degrees_of_freedom)

            # 判斷是否拒絕虛無假設
            reject_null = p_value < alpha

            # 計算信賴區間（僅針對雙側檢定）
            if alternative == "two-sided" and sample2 is None:
                margin_error = critical_value * stats.sem(sample1_array)
                mean = np.mean(sample1_array)
                confidence_interval = [mean - margin_error, mean + margin_error]
            else:
                confidence_interval = None

            return TTestResponse(
                statistic=float(statistic),
                p_value=float(p_value),
                degrees_of_freedom=int(degrees_of_freedom),
                critical_value=float(critical_value),
                reject_null=reject_null,
                confidence_interval=confidence_interval,
            )

        except Exception as e:
            raise ValueError(f"t 檢定計算失敗: {str(e)}")

    def chi_square_test(
        self, observed: List[List[int]], expected: Optional[List[List[float]]] = None
    ) -> ChiSquareResponse:
        """執行卡方檢定"""
        try:
            observed_array = np.array(observed)

            if expected is None:
                # 獨立性檢定
                statistic, p_value, dof, expected_freq = stats.chi2_contingency(
                    observed_array
                )
                expected_frequencies = expected_freq.tolist()
            else:
                # 適合度檢定
                expected_array = np.array(expected)
                statistic, p_value = stats.chisquare(
                    observed_array.flatten(), expected_array.flatten()
                )
                dof = observed_array.size - 1
                expected_frequencies = expected

            # 判斷是否拒絕虛無假設（使用 α = 0.05）
            alpha = 0.05
            critical_value = stats.chi2.ppf(1 - alpha, dof)
            reject_null = p_value < alpha

            return ChiSquareResponse(
                statistic=float(statistic),
                p_value=float(p_value),
                degrees_of_freedom=int(dof),
                expected_frequencies=expected_frequencies,
                reject_null=reject_null,
            )

        except Exception as e:
            raise ValueError(f"卡方檢定計算失敗: {str(e)}")

    def anova(self, groups: List[List[float]]) -> ANOVAResponse:
        """執行單因子 ANOVA"""
        try:
            # 轉換為 numpy 陣列
            group_arrays = [np.array(group) for group in groups]

            # 執行 ANOVA
            f_statistic, p_value = stats.f_oneway(*group_arrays)

            # 計算自由度
            k = len(groups)  # 組數
            n = sum(len(group) for group in groups)  # 總樣本數
            df_between = k - 1
            df_within = n - k

            # 計算平方和
            grand_mean = np.mean(np.concatenate(group_arrays))

            # 組間平方和 (SSB)
            ssb = sum(
                len(group) * (np.mean(group) - grand_mean) ** 2
                for group in group_arrays
            )

            # 組內平方和 (SSW)
            ssw = sum(
                np.sum((np.array(group) - np.mean(group)) ** 2)
                for group in group_arrays
            )

            # 均方
            msb = ssb / df_between
            msw = ssw / df_within

            # 判斷是否拒絕虛無假設（使用 α = 0.05）
            alpha = 0.05
            reject_null = p_value < alpha

            return ANOVAResponse(
                f_statistic=float(f_statistic),
                p_value=float(p_value),
                degrees_of_freedom_between=int(df_between),
                degrees_of_freedom_within=int(df_within),
                sum_of_squares_between=float(ssb),
                sum_of_squares_within=float(ssw),
                mean_square_between=float(msb),
                mean_square_within=float(msw),
                reject_null=reject_null,
            )

        except Exception as e:
            raise ValueError(f"ANOVA 計算失敗: {str(e)}")
