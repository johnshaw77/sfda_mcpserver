#!/usr/bin/env python3
"""
真實場景 T-Test API 測試腳本
使用具有實際意義的數據集測試 SFDA Stat API
"""

import requests
import json
import pandas as pd
from pathlib import Path
import numpy as np

# API 設定
BASE_URL = "http://localhost:8001"
TTEST_ENDPOINT = f"{BASE_URL}/api/v1/inferential/ttest"


def test_api_connection():
    """測試 API 連線"""
    try:
        response = requests.get(BASE_URL)
        print(f"✅ API 連線成功: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ API 連線失敗: {e}")
        return False


def load_test_data(filename):
    """載入測試數據"""
    file_path = Path("../test_data") / filename
    if not file_path.exists():
        print(f"❌ 測試檔案不存在: {file_path}")
        return None

    df = pd.read_csv(file_path)
    print(f"📊 載入數據: {filename}")
    print(f"   數據形狀: {df.shape}")
    print(f"   欄位名稱: {list(df.columns)}")
    return df


def format_result(result, scenario_name):
    """格式化結果輸出"""
    print(f"\n📈 {scenario_name} - 統計結果:")
    print(f"   t 統計量: {result.get('statistic', 'N/A'):.4f}")
    print(f"   p 值: {result.get('p_value', 'N/A'):.6f}")
    print(f"   自由度: {result.get('degrees_of_freedom', 'N/A')}")
    print(f"   臨界值: {result.get('critical_value', 'N/A'):.4f}")
    print(f"   拒絕虛無假設: {'是' if result.get('reject_null', False) else '否'}")

    if result.get('confidence_interval'):
        ci = result['confidence_interval']
        print(f"   95% 信賴區間: [{ci[0]:.4f}, {ci[1]:.4f}]")

    # 解釋結果
    if result.get('reject_null', False):
        print(f"   📊 結論: 在 α=0.05 的顯著水準下，有統計上的顯著差異")
    else:
        print(f"   📊 結論: 在 α=0.05 的顯著水準下，沒有統計上的顯著差異")


def test_hypertension_treatment():
    """測試場景 1: 高血壓治療效果（配對 t 檢定）"""
    print("\n" + "=" * 60)
    print("🏥 場景 1: 高血壓藥物治療效果分析")
    print("=" * 60)
    print("研究問題: 新的高血壓藥物是否能有效降低血壓？")
    print("研究設計: 配對樣本設計，比較同一批患者用藥前後的血壓")
    print("虛無假設 H0: 用藥前後血壓無差異（μ差 = 0）")
    print("對立假設 H1: 用藥後血壓有顯著變化（μ差 ≠ 0）")

    df = load_test_data("hypertension_treatment.csv")
    if df is not None:
        before = df["blood_pressure_before"].tolist()
        after = df["blood_pressure_after"].tolist()

        print(f"\n📊 描述性統計:")
        print(f"   用藥前平均血壓: {np.mean(before):.1f} mmHg")
        print(f"   用藥後平均血壓: {np.mean(after):.1f} mmHg")
        print(f"   平均降幅: {np.mean(before) - np.mean(after):.1f} mmHg")
        print(f"   樣本大小: {len(before)} 位患者")

        data = {
            "sample1": before,
            "sample2": after,
            "paired": True,
            "alpha": 0.05,
            "alternative": "two-sided",
        }

        try:
            response = requests.post(TTEST_ENDPOINT, json=data)
            if response.status_code == 200:
                result = response.json()
                format_result(result, "高血壓治療效果分析")

                # 臨床意義解釋
                print(f"\n🩺 臨床意義:")
                if result.get('reject_null', False):
                    print(f"   此藥物對降低血壓有統計上顯著的效果")
                    print(f"   建議可考慮將此藥物納入治療方案")
                else:
                    print(f"   此藥物的降血壓效果不明顯")
                    print(f"   可能需要調整劑量或考慮其他治療方案")
            else:
                print(f"❌ API 錯誤: {response.text}")
        except Exception as e:
            print(f"❌ 請求失敗: {e}")


def test_teaching_method():
    """測試場景 2: 教學方法比較（獨立樣本 t 檢定）"""
    print("\n" + "=" * 60)
    print("🎓 場景 2: 傳統教學 vs 互動式教學效果比較")
    print("=" * 60)
    print("研究問題: 互動式教學是否比傳統教學更有效？")
    print("研究設計: 獨立樣本設計，比較兩組學生的考試成績")
    print("虛無假設 H0: 兩種教學方法效果相同（μ1 = μ2）")
    print("對立假設 H1: 兩種教學方法效果不同（μ1 ≠ μ2）")

    df = load_test_data("teaching_method_comparison.csv")
    if df is not None:
        traditional = df[df["teaching_method"] == "traditional"]["exam_score"].tolist()
        interactive = df[df["teaching_method"] == "interactive"]["exam_score"].tolist()

        print(f"\n📊 描述性統計:")
        print(f"   傳統教學組平均分數: {np.mean(traditional):.1f} 分")
        print(f"   互動教學組平均分數: {np.mean(interactive):.1f} 分")
        print(f"   分數差異: {np.mean(interactive) - np.mean(traditional):.1f} 分")
        print(
            f"   樣本大小: 傳統組 {len(traditional)} 人, 互動組 {len(interactive)} 人"
        )

        data = {
            "sample1": traditional,
            "sample2": interactive,
            "paired": False,
            "alpha": 0.05,
            "alternative": "two-sided",
        }

        try:
            response = requests.post(TTEST_ENDPOINT, json=data)
            if response.status_code == 200:
                result = response.json()
                format_result(result, "教學方法效果比較")

                # 教育意義解釋
                print(f"\n📚 教育意義:")
                if result.get('reject_null', False):
                    if np.mean(interactive) > np.mean(traditional):
                        print(f"   互動式教學顯著優於傳統教學")
                        print(f"   建議學校採用互動式教學方法")
                    else:
                        print(f"   傳統教學顯著優於互動式教學")
                        print(f"   建議繼續使用傳統教學方法")
                else:
                    print(f"   兩種教學方法的效果沒有顯著差異")
                    print(f"   可以根據其他因素（如成本、資源）來選擇教學方法")
            else:
                print(f"❌ API 錯誤: {response.text}")
        except Exception as e:
            print(f"❌ 請求失敗: {e}")


def test_product_quality():
    """測試場景 3: 產品品質控制（單樣本 t 檢定）"""
    print("\n" + "=" * 60)
    print("🏭 場景 3: 產品重量品質控制檢測")
    print("=" * 60)
    print("研究問題: 產品重量是否符合標準規格 500g？")
    print("研究設計: 單樣本設計，檢測產品重量是否偏離標準值")
    print("虛無假設 H0: 平均重量等於標準重量（μ = 500）")
    print("對立假設 H1: 平均重量不等於標準重量（μ ≠ 500）")

    df = load_test_data("product_quality_control.csv")
    if df is not None:
        weights = df["weight_grams"].tolist()
        standard_weight = 500.0

        print(f"\n📊 描述性統計:")
        print(f"   標準重量: {standard_weight} g")
        print(f"   實際平均重量: {np.mean(weights):.2f} g")
        print(f"   重量偏差: {np.mean(weights) - standard_weight:.2f} g")
        print(f"   標準差: {np.std(weights, ddof=1):.3f} g")
        print(f"   樣本大小: {len(weights)} 個產品")

        # 調整數據進行單樣本檢定（減去標準值）
        adjusted_weights = [w - standard_weight for w in weights]

        data = {
            "sample1": adjusted_weights,
            "sample2": None,
            "paired": False,
            "alpha": 0.05,
            "alternative": "two-sided",
        }

        try:
            response = requests.post(TTEST_ENDPOINT, json=data)
            if response.status_code == 200:
                result = response.json()
                format_result(result, "產品重量品質控制")

                # 品質控制意義解釋
                print(f"\n🏭 品質控制意義:")
                if result.get('reject_null', False):
                    if np.mean(weights) > standard_weight:
                        print(f"   產品重量顯著高於標準規格")
                        print(f"   建議調整生產參數，減少原料投入")
                    else:
                        print(f"   產品重量顯著低於標準規格")
                        print(f"   建議調整生產參數，增加原料投入")
                    print(f"   需要立即檢查生產線設定")
                else:
                    print(f"   產品重量符合標準規格範圍")
                    print(f"   生產過程正常，品質控制良好")
            else:
                print(f"❌ API 錯誤: {response.text}")
        except Exception as e:
            print(f"❌ 請求失敗: {e}")


def test_salary_comparison():
    """測試場景 4: 部門薪資比較（獨立樣本 t 檢定）"""
    print("\n" + "=" * 60)
    print("💼 場景 4: 銷售部 vs 行銷部薪資比較")
    print("=" * 60)
    print("研究問題: 銷售部和行銷部的薪資是否有顯著差異？")
    print("研究設計: 獨立樣本設計，比較兩個部門員工的月薪")
    print("虛無假設 H0: 兩部門薪資相同（μ銷售 = μ行銷）")
    print("對立假設 H1: 兩部門薪資不同（μ銷售 ≠ μ行銷）")

    df = load_test_data("salary_comparison.csv")
    if df is not None:
        sales = df[df["department"] == "sales"]["monthly_salary"].tolist()
        marketing = df[df["department"] == "marketing"]["monthly_salary"].tolist()

        print(f"\n📊 描述性統計:")
        print(f"   銷售部平均薪資: NT$ {np.mean(sales):,.0f}")
        print(f"   行銷部平均薪資: NT$ {np.mean(marketing):,.0f}")
        print(f"   薪資差異: NT$ {np.mean(marketing) - np.mean(sales):,.0f}")
        print(f"   樣本大小: 銷售部 {len(sales)} 人, 行銷部 {len(marketing)} 人")

        data = {
            "sample1": sales,
            "sample2": marketing,
            "paired": False,
            "alpha": 0.05,
            "alternative": "two-sided",
        }

        try:
            response = requests.post(TTEST_ENDPOINT, json=data)
            if response.status_code == 200:
                result = response.json()
                format_result(result, "部門薪資比較")

                # 人力資源意義解釋
                print(f"\n👥 人力資源意義:")
                if result.get('reject_null', False):
                    if np.mean(marketing) > np.mean(sales):
                        print(f"   行銷部薪資顯著高於銷售部")
                        print(f"   可能需要檢討薪資結構的公平性")
                        print(f"   建議評估是否調整銷售部薪資")
                    else:
                        print(f"   銷售部薪資顯著高於行銷部")
                        print(f"   可能反映銷售工作的績效導向特性")
                else:
                    print(f"   兩部門薪資沒有顯著差異")
                    print(f"   薪資結構相對公平合理")
            else:
                print(f"❌ API 錯誤: {response.text}")
        except Exception as e:
            print(f"❌ 請求失敗: {e}")


def test_sleep_pattern():
    """測試場景 5: 睡眠模式分析（配對 t 檢定）"""
    print("\n" + "=" * 60)
    print("😴 場景 5: 平日 vs 假日睡眠時間比較")
    print("=" * 60)
    print("研究問題: 人們在假日是否睡得比平日更久？")
    print("研究設計: 配對樣本設計，比較同一群人平日和假日的睡眠時間")
    print("虛無假設 H0: 平日和假日睡眠時間相同（μ差 = 0）")
    print("對立假設 H1: 平日和假日睡眠時間不同（μ差 ≠ 0）")

    df = load_test_data("sleep_pattern_study.csv")
    if df is not None:
        weekday = df["sleep_hours_weekday"].tolist()
        weekend = df["sleep_hours_weekend"].tolist()

        print(f"\n📊 描述性統計:")
        print(f"   平日平均睡眠時間: {np.mean(weekday):.1f} 小時")
        print(f"   假日平均睡眠時間: {np.mean(weekend):.1f} 小時")
        print(f"   睡眠時間差異: {np.mean(weekend) - np.mean(weekday):.1f} 小時")
        print(f"   樣本大小: {len(weekday)} 位參與者")

        data = {
            "sample1": weekday,
            "sample2": weekend,
            "paired": True,
            "alpha": 0.05,
            "alternative": "two-sided",
        }

        try:
            response = requests.post(TTEST_ENDPOINT, json=data)
            if response.status_code == 200:
                result = response.json()
                format_result(result, "睡眠模式分析")

                # 健康意義解釋
                print(f"\n💤 健康意義:")
                if result.get('reject_null', False):
                    if np.mean(weekend) > np.mean(weekday):
                        print(f"   假日睡眠時間顯著長於平日")
                        print(f"   可能反映平日睡眠不足的現象")
                        print(f"   建議評估工作日程安排，確保充足睡眠")
                    else:
                        print(f"   平日睡眠時間顯著長於假日")
                        print(f"   這是較不常見的現象，值得進一步研究")
                else:
                    print(f"   平日和假日睡眠時間沒有顯著差異")
                    print(f"   顯示良好的睡眠習慣和作息規律")
            else:
                print(f"❌ API 錯誤: {response.text}")
        except Exception as e:
            print(f"❌ 請求失敗: {e}")


def main():
    """主測試函數"""
    print("🔬 SFDA Stat 真實場景 T-Test 分析")
    print("使用具有實際意義的數據集進行統計檢定")
    print("=" * 80)

    # 測試 API 連線
    if not test_api_connection():
        return

    # 執行所有真實場景測試
    test_hypertension_treatment()
    test_teaching_method()
    test_product_quality()
    test_salary_comparison()
    test_sleep_pattern()

    print("\n" + "=" * 80)
    print("🎉 所有真實場景測試完成！")
    print("📊 這些結果展示了統計檢定在實際應用中的價值")
    print("💡 每個場景都提供了清楚的結論和實用的建議")


if __name__ == "__main__":
    main()
