/**
 * 快速 performTTest 測試腳本
 * 
 * 用於驗證 SFDA Stat API 的 t-test 功能是否正常工作
 */

const fetch = require('node-fetch');

// API 設定
const BASE_URL = 'http://localhost:8001'; // 根據您的 API 端口調整
const TTEST_ENDPOINT = `${BASE_URL}/api/v1/inferential/ttest`;

// 測試數據
const testCases = [
  {
    name: "單樣本 t 檢定",
    data: {
      sample1: [498.2, 501.3, 499.8, 502.1, 500.5, 497.9, 503.2, 499.1, 501.8, 500.3],
      sample2: null,
      paired: false,
      alpha: 0.05,
      alternative: "two-sided"
    }
  },
  {
    name: "獨立樣本 t 檢定",
    data: {
      sample1: [78, 82, 75, 88, 79, 85, 81, 77, 84, 80],
      sample2: [85, 89, 91, 87, 93, 88, 90, 86, 92, 89],
      paired: false,
      alpha: 0.05,
      alternative: "two-sided"
    }
  },
  {
    name: "配對樣本 t 檢定",
    data: {
      sample1: [140, 138, 145, 142, 139, 144, 141, 143, 137, 146],
      sample2: [128, 125, 132, 129, 126, 131, 127, 130, 124, 133],
      paired: true,
      alpha: 0.05,
      alternative: "two-sided"
    }
  }
];

async function testAPI() {
  console.log('🔬 快速 t-test API 測試');
  console.log('=' * 50);
  
  // 測試 API 連線
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ API 連線正常');
    } else {
      console.log('❌ API 健康檢查失敗');
      return;
    }
  } catch (error) {
    console.log('❌ 無法連接到 API:', error.message);
    console.log('請確保 SFDA Stat 服務正在運行');
    return;
  }
  
  // 執行測試案例
  for (const testCase of testCases) {
    console.log(`\n📊 測試: ${testCase.name}`);
    console.log('─'.repeat(30));
    
    try {
      const response = await fetch(TTEST_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 測試成功');
        console.log(`   t 統計量: ${result.statistic?.toFixed(4)}`);
        console.log(`   p 值: ${result.p_value?.toFixed(6)}`);
        console.log(`   自由度: ${result.degrees_of_freedom}`);
        console.log(`   拒絕虛無假設: ${result.reject_null ? '是' : '否'}`);
        
        if (result.confidence_interval) {
          console.log(`   95% 信賴區間: [${result.confidence_interval[0]?.toFixed(4)}, ${result.confidence_interval[1]?.toFixed(4)}]`);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ 測試失敗');
        console.log(`   狀態碼: ${response.status}`);
        console.log(`   錯誤信息: ${errorText}`);
      }
    } catch (error) {
      console.log('❌ 請求錯誤:', error.message);
    }
  }
  
  console.log('\n🎉 測試完成！');
}

// 如果直接執行此文件
if (require.main === module) {
  testAPI().catch(console.error);
}

module.exports = { testAPI }; 