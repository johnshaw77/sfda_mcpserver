import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """測試根端點"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_check():
    """測試健康檢查端點"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_basic_stats():
    """測試基本統計量計算"""
    data = {"values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
    response = client.post("/api/v1/descriptive/basic", json=data)
    assert response.status_code == 200

    result = response.json()
    assert "mean" in result
    assert "median" in result
    assert "std" in result
    assert result["mean"] == 5.5
    assert result["median"] == 5.5


def test_basic_stats_empty_array():
    """測試空陣列的錯誤處理"""
    data = {"values": []}
    response = client.post("/api/v1/descriptive/basic", json=data)
    assert response.status_code == 422  # 驗證錯誤


def test_distribution_stats():
    """測試分佈統計量計算"""
    data = {"values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
    response = client.post("/api/v1/descriptive/distribution", json=data)
    assert response.status_code == 200

    result = response.json()
    assert "skewness" in result
    assert "kurtosis" in result
    assert "is_normal" in result
    assert "normality_p_value" in result


def test_percentiles():
    """測試百分位數計算"""
    data = {"values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "percentiles": [25, 50, 75, 90]}
    response = client.post("/api/v1/descriptive/percentiles", json=data)
    assert response.status_code == 200

    result = response.json()
    assert "percentiles" in result
    assert "quartiles" in result
    assert "P25" in result["percentiles"]
    assert "P50" in result["percentiles"]
    assert "Q1" in result["quartiles"]
