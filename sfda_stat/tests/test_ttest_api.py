#!/usr/bin/env python3
"""
T-Test API 測試腳本
測試 SFDA Stat API 的 t 檢定功能
"""

import requests
import json
import pandas as pd
from pathlib import Path

# API 設定
BASE_URL = "http://localhost:8001"
TTEST_ENDPOINT = f"{BASE_URL}/api/v1/inferential/ttest"


def test_api_connection():
    """測試 API 連線"""
    try:
        response = requests.get(BASE_URL)
        print(f"✅ API 連線成功: {response.status_code}")
        print(f"📄 回應: {response.json()}")
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
    print(f"📊 載入數據: {filename}, 形狀: {df.shape}")
    return df


def test_one_sample_ttest():
    """測試單樣本 t 檢定"""
    print("\n🧪 測試 1: 單樣本 t 檢定")

    # 測試案例 1: 正常分布 (不應拒絕 H0: μ = 0)
    df1 = load_test_data("dataset1_normal.csv")
    if df1 is not None:
        data = {
            "sample1": df1["values"].tolist(),
            "sample2": None,
            "paired": False,
            "alpha": 0.05,
            "alternative": "two-sided",
        }

        try:
            response = requests.post(TTEST_ENDPOINT, json=data)
            print(f"📈 正常分布測試 - 狀態碼: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"   統計量: {result.get('statistic', 'N/A'):.4f}")
                print(f"   p 值: {result.get('p_value', 'N/A'):.4f}")
                print(f"   拒絕 H0: {result.get('reject_null', 'N/A')}")
            else:
                print(f"❌ 錯誤: {response.text}")
        except Exception as e:
            print(f"❌ 請求失敗: {e}")

    # 測試案例 2: 偏移分布 (應該拒絕 H0: μ = 0)
    df2 = load_test_data("dataset2_shifted.csv")
    if df2 is not None:
        data = {
            "sample1": df2["values"].tolist(),
            "sample2": None,
            "paired": False,
            "alpha": 0.05,
            "alternative": "two-sided",
        }

        try:
            response = requests.post(TTEST_ENDPOINT, json=data)
            print(f"📈 偏移分布測試 - 狀態碼: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"   統計量: {result.get('statistic', 'N/A'):.4f}")
                print(f"   p 值: {result.get('p_value', 'N/A'):.4f}")
                print(f"   拒絕 H0: {result.get('reject_null', 'N/A')}")
            else:
                print(f"❌ 錯誤: {response.text}")
        except Exception as e:
            print(f"❌ 請求失敗: {e}")


def test_two_sample_ttest():
    """測試雙樣本獨立 t 檢定"""
    print("\n🧪 測試 2: 雙樣本獨立 t 檢定")

    df = load_test_data("dataset3_two_groups.csv")
    if df is not None:
        group_a = df[df["group"] == "A"]["value"].tolist()
        group_b = df[df["group"] == "B"]["value"].tolist()

        data = {
            "sample1": group_a,
            "sample2": group_b,
            "paired": False,
            "alpha": 0.05,
            "alternative": "two-sided",
        }

        try:
            response = requests.post(TTEST_ENDPOINT, json=data)
            print(f"📈 雙樣本測試 - 狀態碼: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"   樣本 A 平均: {sum(group_a)/len(group_a):.2f}")
                print(f"   樣本 B 平均: {sum(group_b)/len(group_b):.2f}")
                print(f"   統計量: {result.get('statistic', 'N/A'):.4f}")
                print(f"   p 值: {result.get('p_value', 'N/A'):.4f}")
                print(f"   拒絕 H0: {result.get('reject_null', 'N/A')}")
            else:
                print(f"❌ 錯誤: {response.text}")
        except Exception as e:
            print(f"❌ 請求失敗: {e}")


def test_paired_ttest():
    """測試配對 t 檢定"""
    print("\n🧪 測試 3: 配對 t 檢定")

    df = load_test_data("dataset4_paired.csv")
    if df is not None:
        before = df["before"].tolist()
        after = df["after"].tolist()

        data = {
            "sample1": before,
            "sample2": after,
            "paired": True,
            "alpha": 0.05,
            "alternative": "two-sided",
        }

        try:
            response = requests.post(TTEST_ENDPOINT, json=data)
            print(f"📈 配對測試 - 狀態碼: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"   治療前平均: {sum(before)/len(before):.2f}")
                print(f"   治療後平均: {sum(after)/len(after):.2f}")
                print(f"   統計量: {result.get('statistic', 'N/A'):.4f}")
                print(f"   p 值: {result.get('p_value', 'N/A'):.4f}")
                print(f"   拒絕 H0: {result.get('reject_null', 'N/A')}")
            else:
                print(f"❌ 錯誤: {response.text}")
        except Exception as e:
            print(f"❌ 請求失敗: {e}")


def main():
    """主測試函數"""
    print("🔬 SFDA Stat T-Test API 測試")
    print("=" * 50)

    # 測試 API 連線
    if not test_api_connection():
        return

    # 執行所有測試
    test_one_sample_ttest()
    test_two_sample_ttest()
    test_paired_ttest()

    print("\n" + "=" * 50)
    print("✅ 測試完成！")


if __name__ == "__main__":
    main()
