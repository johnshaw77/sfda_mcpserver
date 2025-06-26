#!/usr/bin/env python3
"""
測試 sfda_stat 的 base64 圖片生成功能
"""

import sys
sys.path.append('/Users/johnhsiao/Desktop/@Projects/sfda_stat')

from app.services.chart_service import ChartService
from app.models.chart_models import ChartDataPoint

def test_image_generation():
    """測試圖片生成功能"""
    print("🧪 測試 base64 圖片生成功能...")
    
    chart_service = ChartService()
    
    # 測試數據
    test_data = [
        ChartDataPoint(label="A", value=10),
        ChartDataPoint(label="B", value=20),
        ChartDataPoint(label="C", value=15)
    ]
    
    # 測試圓餅圖圖片生成
    print("\n1. 測試圓餅圖 (不含圖片)")
    result_no_image = chart_service.create_pie_chart(
        data=test_data,
        title="測試圓餅圖",
        generate_image=False
    )
    print(f"   成功: {result_no_image.success}")
    print(f"   包含圖片: {result_no_image.has_image}")
    print(f"   推理: {result_no_image.reasoning}")
    
    print("\n2. 測試圓餅圖 (含 PNG 圖片)")
    result_with_image = chart_service.create_pie_chart(
        data=test_data,
        title="測試圓餅圖 (含圖片)",
        generate_image=True,
        image_format="png",
        figsize=(8, 6),
        dpi=100
    )
    print(f"   成功: {result_with_image.success}")
    print(f"   包含圖片: {result_with_image.has_image}")
    print(f"   圖片格式: {result_with_image.image_format}")
    print(f"   Base64 長度: {len(result_with_image.image_base64) if result_with_image.image_base64 else 0}")
    print(f"   推理: {result_with_image.reasoning}")
    
    # 測試簡單圖表圖片生成
    print("\n3. 測試簡單圖表 API (含圖片)")
    result_simple = chart_service.create_chart_from_simple_data_with_image(
        labels=["Apple", "Banana", "Cherry"],
        values=[25, 35, 40],
        chart_type="bar",
        title="水果銷量圖",
        generate_image=True,
        image_format="png",
        figsize=(10, 6),
        dpi=150
    )
    print(f"   成功: {result_simple.success}")
    print(f"   包含圖片: {result_simple.has_image}")
    print(f"   圖片格式: {result_simple.image_format}")
    print(f"   Base64 長度: {len(result_simple.image_base64) if result_simple.image_base64 else 0}")
    print(f"   推理: {result_simple.reasoning}")
    
    # 測試直方圖
    print("\n4. 測試直方圖 (含圖片)")
    import numpy as np
    histogram_data = np.random.normal(50, 15, 100).tolist()
    
    result_histogram = chart_service.create_histogram(
        values=histogram_data,
        bins=15,
        title="數據分佈直方圖",
        x_axis_label="數值",
        y_axis_label="頻率",
        generate_image=True,
        image_format="png"
    )
    print(f"   成功: {result_histogram.success}")
    print(f"   包含圖片: {result_histogram.has_image}")
    print(f"   圖片格式: {result_histogram.image_format}")
    print(f"   Base64 長度: {len(result_histogram.image_base64) if result_histogram.image_base64 else 0}")
    print(f"   推理: {result_histogram.reasoning}")
    
    # 檢查 base64 格式
    if result_with_image.image_base64:
        print(f"\n5. Base64 格式驗證")
        print(f"   前 50 字符: {result_with_image.image_base64[:50]}...")
        print(f"   後 50 字符: ...{result_with_image.image_base64[-50:]}")
        
        # 驗證是否為有效的 base64
        import base64
        try:
            decoded = base64.b64decode(result_with_image.image_base64)
            print(f"   Base64 解碼成功，圖片大小: {len(decoded)} bytes")
        except Exception as e:
            print(f"   Base64 解碼失敗: {e}")
    
    print("\n✅ 測試完成！")

if __name__ == "__main__":
    test_image_generation()