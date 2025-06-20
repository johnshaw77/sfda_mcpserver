from typing import List, Dict, Any, Optional
import numpy as np
from scipy import stats
from app.models.response_models import DistributionAnalysisResponse


class DistributionAnalysisService:
    """分布分析服務類別"""

    def normal_distribution_analysis(
        self,
        data: List[float],
        confidence_level: float = 0.95,
        test_normal: bool = True,
    ) -> DistributionAnalysisResponse:
        """常態分布分析"""
        try:
            data_array = np.array(data)

            # 基本統計量
            mean = float(np.mean(data_array))
            std = float(np.std(data_array, ddof=1))
            variance = float(np.var(data_array, ddof=1))

            # 信賴區間
            alpha = 1 - confidence_level
            n = len(data_array)
            se = std / np.sqrt(n)
            t_critical = stats.t.ppf(1 - alpha / 2, n - 1)
            ci_lower = mean - t_critical * se
            ci_upper = mean + t_critical * se

            # 常態性檢定
            normality_tests = {}
            if test_normal and n >= 3:
                # Shapiro-Wilk 檢定
                if n <= 5000:  # Shapiro-Wilk 適用於小樣本
                    shapiro_stat, shapiro_p = stats.shapiro(data_array)
                    normality_tests["shapiro"] = {
                        "statistic": float(shapiro_stat),
                        "p_value": float(shapiro_p),
                        "is_normal": shapiro_p > 0.05,
                    }

                # Kolmogorov-Smirnov 檢定
                if n >= 8:
                    ks_stat, ks_p = stats.kstest(data_array, 'norm', args=(mean, std))
                    normality_tests["kolmogorov_smirnov"] = {
                        "statistic": float(ks_stat),
                        "p_value": float(ks_p),
                        "is_normal": ks_p > 0.05,
                    }

                # Anderson-Darling 檢定
                ad_result = stats.anderson(data_array, dist='norm')
                normality_tests["anderson_darling"] = {
                    "statistic": float(ad_result.statistic),
                    "critical_values": ad_result.critical_values.tolist(),
                    "significance_levels": ad_result.significance_level.tolist(),
                }

            # 偏度和峰度
            skewness = float(stats.skew(data_array))
            kurtosis = float(stats.kurtosis(data_array))

            return DistributionAnalysisResponse(
                distribution_type="normal",
                parameters={"mean": mean, "std": std, "variance": variance},
                confidence_interval={
                    "level": confidence_level,
                    "lower": float(ci_lower),
                    "upper": float(ci_upper),
                },
                goodness_of_fit=normality_tests,
                descriptive_stats={
                    "skewness": skewness,
                    "kurtosis": kurtosis,
                    "sample_size": n,
                },
            )

        except Exception as e:
            raise ValueError(f"常態分布分析錯誤: {str(e)}")

    def distribution_test(
        self, data: List[float], distribution: str = "normal", alpha: float = 0.05
    ) -> DistributionAnalysisResponse:
        """分布適合度檢定"""
        try:
            data_array = np.array(data)
            n = len(data_array)

            if distribution.lower() == "normal":
                return self.normal_distribution_analysis(
                    data, confidence_level=1 - alpha, test_normal=True
                )

            elif distribution.lower() == "uniform":
                # 均勻分布檢定
                ks_stat, ks_p = stats.kstest(data_array, 'uniform')

                return DistributionAnalysisResponse(
                    distribution_type="uniform",
                    parameters={
                        "min": float(np.min(data_array)),
                        "max": float(np.max(data_array)),
                    },
                    goodness_of_fit={
                        "kolmogorov_smirnov": {
                            "statistic": float(ks_stat),
                            "p_value": float(ks_p),
                            "fits_distribution": ks_p > alpha,
                        }
                    },
                    descriptive_stats={
                        "sample_size": n,
                        "range": float(np.max(data_array) - np.min(data_array)),
                    },
                )

            elif distribution.lower() == "exponential":
                # 指數分布檢定
                # 估計參數 (lambda = 1/mean)
                lambda_param = 1 / np.mean(data_array)
                ks_stat, ks_p = stats.kstest(
                    data_array, 'expon', args=(0, 1 / lambda_param)
                )

                return DistributionAnalysisResponse(
                    distribution_type="exponential",
                    parameters={
                        "lambda": float(lambda_param),
                        "scale": float(1 / lambda_param),
                    },
                    goodness_of_fit={
                        "kolmogorov_smirnov": {
                            "statistic": float(ks_stat),
                            "p_value": float(ks_p),
                            "fits_distribution": ks_p > alpha,
                        }
                    },
                    descriptive_stats={
                        "sample_size": n,
                        "mean": float(np.mean(data_array)),
                    },
                )

            else:
                raise ValueError(f"不支援的分布類型: {distribution}")

        except Exception as e:
            raise ValueError(f"分布檢定錯誤: {str(e)}")

    def compare_distributions(
        self, data1: List[float], data2: List[float], test_type: str = "ks"
    ) -> Dict[str, Any]:
        """比較兩個分布"""
        try:
            data1_array = np.array(data1)
            data2_array = np.array(data2)

            if test_type.lower() == "ks":
                # Kolmogorov-Smirnov 兩樣本檢定
                ks_stat, ks_p = stats.ks_2samp(data1_array, data2_array)

                return {
                    "test_type": "kolmogorov_smirnov_2sample",
                    "statistic": float(ks_stat),
                    "p_value": float(ks_p),
                    "same_distribution": ks_p > 0.05,
                    "sample_sizes": {
                        "sample1": len(data1_array),
                        "sample2": len(data2_array),
                    },
                }

            elif test_type.lower() == "mannwhitney":
                # Mann-Whitney U 檢定
                mw_stat, mw_p = stats.mannwhitneyu(
                    data1_array, data2_array, alternative='two-sided'
                )

                return {
                    "test_type": "mann_whitney_u",
                    "statistic": float(mw_stat),
                    "p_value": float(mw_p),
                    "same_distribution": mw_p > 0.05,
                    "sample_sizes": {
                        "sample1": len(data1_array),
                        "sample2": len(data2_array),
                    },
                }

            else:
                raise ValueError(f"不支援的檢定類型: {test_type}")

        except Exception as e:
            raise ValueError(f"分布比較錯誤: {str(e)}")
