from typing import List
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import r2_score
from scipy import stats
from app.models.response_models import RegressionResponse


class RegressionAnalysisService:
    """迴歸分析服務類別"""

    def linear_regression(self, x: List[float], y: List[float]) -> RegressionResponse:
        """執行簡單線性迴歸"""
        try:
            x_array = np.array(x).reshape(-1, 1)
            y_array = np.array(y)

            # 建立線性迴歸模型
            model = LinearRegression()
            model.fit(x_array, y_array)

            # 預測值
            y_pred = model.predict(x_array)

            # 計算統計量
            n = len(y)
            coefficients = [float(model.coef_[0])]
            intercept = float(model.intercept_)
            r_squared = r2_score(y_array, y_pred)
            adjusted_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - 2)

            # 計算 F 統計量
            mse = np.mean((y_array - y_pred) ** 2)
            if mse > 0:
                f_statistic = r_squared * (n - 2) / ((1 - r_squared))
                p_value = 1 - stats.f.cdf(f_statistic, 1, n - 2)
            else:
                f_statistic = float('inf')
                p_value = 0.0

            # 殘差
            residuals = (y_array - y_pred).tolist()
            fitted_values = y_pred.tolist()

            return RegressionResponse(
                coefficients=coefficients,
                intercept=intercept,
                r_squared=float(r_squared),
                adjusted_r_squared=float(adjusted_r_squared),
                f_statistic=float(f_statistic),
                p_value=float(p_value),
                residuals=residuals,
                fitted_values=fitted_values,
            )

        except Exception as e:
            raise ValueError(f"線性迴歸計算失敗: {str(e)}")

    def multiple_regression(
        self, x: List[List[float]], y: List[float]
    ) -> RegressionResponse:
        """執行多元線性迴歸"""
        try:
            x_array = np.array(x)
            y_array = np.array(y)

            # 建立多元線性迴歸模型
            model = LinearRegression()
            model.fit(x_array, y_array)

            # 預測值
            y_pred = model.predict(x_array)

            # 計算統計量
            n, p = x_array.shape
            coefficients = model.coef_.tolist()
            intercept = float(model.intercept_)
            r_squared = r2_score(y_array, y_pred)
            adjusted_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - p - 1)

            # 計算 F 統計量
            mse = np.mean((y_array - y_pred) ** 2)
            if mse > 0:
                f_statistic = r_squared * (n - p - 1) / ((1 - r_squared) * p)
                p_value = 1 - stats.f.cdf(f_statistic, p, n - p - 1)
            else:
                f_statistic = float('inf')
                p_value = 0.0

            # 殘差
            residuals = (y_array - y_pred).tolist()
            fitted_values = y_pred.tolist()

            return RegressionResponse(
                coefficients=coefficients,
                intercept=intercept,
                r_squared=float(r_squared),
                adjusted_r_squared=float(adjusted_r_squared),
                f_statistic=float(f_statistic),
                p_value=float(p_value),
                residuals=residuals,
                fitted_values=fitted_values,
            )

        except Exception as e:
            raise ValueError(f"多元迴歸計算失敗: {str(e)}")

    def polynomial_regression(
        self, x: List[float], y: List[float], degree: int = 2
    ) -> RegressionResponse:
        """執行多項式迴歸"""
        try:
            x_array = np.array(x).reshape(-1, 1)
            y_array = np.array(y)

            # 建立多項式特徵
            poly_features = PolynomialFeatures(degree=degree)
            x_poly = poly_features.fit_transform(x_array)

            # 建立線性迴歸模型（針對多項式特徵）
            model = LinearRegression()
            model.fit(x_poly, y_array)

            # 預測值
            y_pred = model.predict(x_poly)

            # 計算統計量
            n = len(y)
            p = degree  # 多項式的項數
            coefficients = model.coef_.tolist()
            intercept = float(model.intercept_)
            r_squared = r2_score(y_array, y_pred)
            adjusted_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - p - 1)

            # 計算 F 統計量
            mse = np.mean((y_array - y_pred) ** 2)
            if mse > 0:
                f_statistic = r_squared * (n - p - 1) / ((1 - r_squared) * p)
                p_value = 1 - stats.f.cdf(f_statistic, p, n - p - 1)
            else:
                f_statistic = float('inf')
                p_value = 0.0

            # 殘差
            residuals = (y_array - y_pred).tolist()
            fitted_values = y_pred.tolist()

            return RegressionResponse(
                coefficients=coefficients,
                intercept=intercept,
                r_squared=float(r_squared),
                adjusted_r_squared=float(adjusted_r_squared),
                f_statistic=float(f_statistic),
                p_value=float(p_value),
                residuals=residuals,
                fitted_values=fitted_values,
            )

        except Exception as e:
            raise ValueError(f"多項式迴歸計算失敗: {str(e)}")
