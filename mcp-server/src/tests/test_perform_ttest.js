/**
 * performTTest 測試數據
 * 
 * 測試 MCP 工具調用器中的 performTTest 功能
 * 對應 sfda_stat API 的 /api/v1/inferential/ttest 端點
 */

const StatService = require('../services/stat/stat-service.js');

// 測試數據集
const testScenarios = {
  // 場景 1: 單樣本 t 檢定 - 產品重量品質控制
  singleSample: {
    data: {
      sample1: [498.2, 501.3, 499.8, 502.1, 500.5, 497.9, 503.2, 499.1, 501.8, 500.3],
      sample2: null,
      paired: false,
      alpha: 0.05,
      alternative: "two-sided"
    },
    context: {
      scenario: "quality",
      description: "檢測產品重量是否符合標準規格 500g",
      hypothesis: {
        null: "平均重量等於標準重量 500g",
        alternative: "平均重量不等於標準重量 500g"
      },
      expectedOutcome: "應該不拒絕虛無假設（重量符合規格）"
    }
  },

  // 場景 2: 獨立樣本 t 檢定 - 教學方法比較
  independentSamples: {
    data: {
      sample1: [78, 82, 75, 88, 79, 85, 81, 77, 84, 80], // 傳統教學
      sample2: [85, 89, 91, 87, 93, 88, 90, 86, 92, 89], // 互動教學
      paired: false,
      alpha: 0.05,
      alternative: "two-sided"
    },
    context: {
      scenario: "education",
      description: "比較傳統教學與互動教學的效果",
      groups: {
        sample1: "傳統教學組",
        sample2: "互動教學組"
      },
      hypothesis: {
        null: "兩種教學方法效果相同",
        alternative: "兩種教學方法效果不同"
      },
      expectedOutcome: "應該拒絕虛無假設（互動教學效果更好）"
    }
  },

  // 場景 3: 配對樣本 t 檢定 - 藥物治療效果
  pairedSamples: {
    data: {
      sample1: [140, 138, 145, 142, 139, 144, 141, 143, 137, 146], // 治療前血壓
      sample2: [128, 125, 132, 129, 126, 131, 127, 130, 124, 133], // 治療後血壓
      paired: true,
      alpha: 0.05,
      alternative: "two-sided"
    },
    context: {
      scenario: "medical",
      description: "評估降血壓藥物的治療效果",
      measurement: {
        before: "治療前收縮壓 (mmHg)",
        after: "治療後收縮壓 (mmHg)"
      },
      hypothesis: {
        null: "治療前後血壓無差異",
        alternative: "治療前後血壓有顯著差異"
      },
      expectedOutcome: "應該拒絕虛無假設（藥物有效降血壓）"
    }
  },

  // 場景 4: 單側檢定 - 新製程改善
  oneTailed: {
    data: {
      sample1: [95.2, 96.8, 94.5, 97.1, 95.9, 96.3, 94.8, 97.5, 95.6, 96.2], // 新製程
      sample2: [92.1, 93.5, 91.8, 94.2, 92.7, 93.1, 91.9, 94.8, 92.4, 93.6], // 舊製程
      paired: false,
      alpha: 0.05,
      alternative: "greater" // 測試新製程是否更好
    },
    context: {
      scenario: "manufacturing",
      description: "測試新製程是否提高產品良率",
      groups: {
        sample1: "新製程良率 (%)",
        sample2: "舊製程良率 (%)"
      },
      hypothesis: {
        null: "新製程良率 ≤ 舊製程良率",
        alternative: "新製程良率 > 舊製程良率"
      },
      expectedOutcome: "應該拒絕虛無假設（新製程確實更好）"
    }
  },

  // 場景 5: 小樣本配對檢定 - 個人化訓練效果
  smallSamplePaired: {
    data: {
      sample1: [8.2, 7.9, 8.5, 8.1, 7.8], // 訓練前跑步時間（分鐘）
      sample2: [7.5, 7.1, 7.8, 7.4, 7.2], // 訓練後跑步時間（分鐘）
      paired: true,
      alpha: 0.05,
      alternative: "two-sided"
    },
    context: {
      scenario: "fitness",
      description: "評估個人化訓練對跑步成績的影響",
      measurement: {
        before: "訓練前 1500m 跑步時間（分鐘）",
        after: "訓練後 1500m 跑步時間（分鐘）"
      },
      hypothesis: {
        null: "訓練前後跑步時間無差異",
        alternative: "訓練前後跑步時間有顯著差異"
      },
      expectedOutcome: "應該拒絕虛無假設（訓練有效提升成績）",
      note: "小樣本情況下的檢定"
    }
  }
};

// 執行測試的函數
async function runTTestScenario(scenarioName, scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 測試場景: ${scenarioName}`);
  console.log(`📋 描述: ${scenario.context.description}`);
  console.log(`${'='.repeat(60)}`);
  
  console.log('\n📊 測試數據:');
  console.log('data:', JSON.stringify(scenario.data, null, 2));
  console.log('\ncontext:', JSON.stringify(scenario.context, null, 2));
  
  try {
    const result = await StatService.performTTest(scenario.data, scenario.context);
    
    console.log('\n📈 統計結果:');
    console.log(`t 統計量: ${result.statistic?.toFixed(4)}`);
    console.log(`p 值: ${result.p_value?.toFixed(6)}`);
    console.log(`自由度: ${result.degrees_of_freedom}`);
    console.log(`臨界值: ${result.critical_value?.toFixed(4)}`);
    console.log(`拒絕虛無假設: ${result.reject_null ? '是' : '否'}`);
    
    if (result.confidence_interval) {
      console.log(`95% 信賴區間: [${result.confidence_interval[0]?.toFixed(4)}, ${result.confidence_interval[1]?.toFixed(4)}]`);
    }
    
    console.log('\n💡 結果解釋:');
    if (result.interpretation) {
      console.log(`摘要: ${result.interpretation.summary}`);
      console.log(`結論: ${result.interpretation.conclusion}`);
      console.log(`實用意義: ${result.interpretation.practical_significance}`);
      
      if (result.interpretation.recommendations?.length > 0) {
        console.log('建議:');
        result.interpretation.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }
    }
    
    console.log(`\n✅ 預期結果: ${scenario.context.expectedOutcome}`);
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

// 主測試函數
async function main() {
  console.log('🔬 SFDA Stat performTTest 測試');
  console.log('測試各種 t 檢定場景的數據格式');
  
  // 檢查 SFDA Stat API 是否運行
  console.log('\n🔍 檢查 API 連線...');
  try {
    await StatService.callStatAPI('/health', {});
    console.log('✅ SFDA Stat API 連線正常');
  } catch (error) {
    console.error('❌ SFDA Stat API 連線失敗:', error.message);
    console.log('請確保 SFDA Stat 服務正在運行 (http://localhost:8000)');
    return;
  }
  
  // 執行所有測試場景
  for (const [scenarioName, scenario] of Object.entries(testScenarios)) {
    await runTTestScenario(scenarioName, scenario);
    
    // 添加分隔符
    console.log('\n' + '─'.repeat(80));
  }
  
  console.log('\n🎉 所有測試場景完成！');
  console.log('\n📝 使用說明:');
  console.log('1. data 欄位包含統計檢定所需的數據和參數');
  console.log('2. context 欄位提供分析的背景和解釋');
  console.log('3. 根據不同場景選擇適當的檢定類型');
  console.log('4. 注意 paired 參數決定是否為配對檢定');
  console.log('5. alternative 參數控制單側或雙側檢定');
}

// 如果直接執行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testScenarios,
  runTTestScenario
}; 