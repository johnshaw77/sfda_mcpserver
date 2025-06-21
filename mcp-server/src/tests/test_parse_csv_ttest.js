/**
 * 智能 CSV 統計分析工具測試
 * 
 * 測試 parse_csv_ttest 工具的智能分析功能
 */

const { ParseCSVTTestTool } = require('../tools/stat/parse-csv-ttest.js');

// 測試數據：血壓治療效果
const bloodPressureCSV = `patient_id,blood_pressure_before,blood_pressure_after
1,140,132
2,155,148
3,138,135
4,162,154
5,145,140
6,158,149
7,142,138
8,148,143
9,152,145
10,136,133
11,144,139
12,160,152
13,139,136
14,147,142
15,156,150
16,141,137
17,149,144
18,153,146
19,137,134
20,146,141`;

// 測試數據：教學方法比較
const teachingMethodCSV = `student_id,teaching_method,exam_score
1,traditional,78
2,traditional,82
3,traditional,75
4,traditional,88
5,traditional,79
6,interactive,85
7,interactive,89
8,interactive,91
9,interactive,87
10,interactive,93`;

// 測試數據：產品品質控制
const qualityControlCSV = `product_id,weight_grams
1,498.2
2,501.3
3,499.8
4,502.1
5,500.5
6,497.9
7,503.2
8,499.1
9,501.8
10,500.3`;

async function testIntelligentCSVAnalysis() {
  const tool = new ParseCSVTTestTool();
  
  console.log('🧪 測試智能 CSV 統計分析工具\n');
  
  // 測試 1: 血壓治療效果（自然語言問題）
  console.log('📊 測試 1: 血壓治療效果分析');
  console.log('問題: "治療方案對降低血壓的影響"');
  
  try {
    const result1 = await tool._execute({
      csvData: bloodPressureCSV,
      question: "治療方案對降低血壓的影響"
    });
    
    console.log('✅ AI 理解結果:');
    console.log(`   - 檢測場景: ${result1.data.analysis_understanding.detected_scenario}`);
    console.log(`   - 檢定類型: ${result1.data.analysis_understanding.test_type}`);
    console.log(`   - 使用欄位: ${result1.data.analysis_understanding.columns_used.column1} vs ${result1.data.analysis_understanding.columns_used.column2}`);
    console.log(`   - 樣本大小: ${result1.data.analysis_understanding.sample_sizes.sample1} vs ${result1.data.analysis_understanding.sample_sizes.sample2}`);
    
    const stats = result1.data.statistical_result;
    console.log('📈 統計結果:');
    console.log(`   - t 統計量: ${stats.statistic.toFixed(4)}`);
    console.log(`   - p 值: ${stats.p_value.toFixed(6)}`);
    console.log(`   - 顯著性: ${stats.reject_null ? '顯著' : '不顯著'}`);
    
  } catch (error) {
    console.log('❌ 測試失敗:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 測試 2: 教學方法比較
  console.log('📊 測試 2: 教學方法比較');
  console.log('問題: "兩種教學方法哪個更好"');
  
  try {
    const result2 = await tool._execute({
      csvData: teachingMethodCSV,
      question: "兩種教學方法哪個更好"
    });
    
    console.log('✅ AI 理解結果:');
    console.log(`   - 檢測場景: ${result2.data.analysis_understanding.detected_scenario}`);
    console.log(`   - 檢定類型: ${result2.data.analysis_understanding.test_type}`);
    
  } catch (error) {
    console.log('❌ 測試失敗:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 測試 3: 產品品質控制
  console.log('📊 測試 3: 產品品質控制');
  console.log('問題: "產品重量是否符合標準"');
  
  try {
    const result3 = await tool._execute({
      csvData: qualityControlCSV,
      question: "產品重量是否符合標準"
    });
    
    console.log('✅ AI 理解結果:');
    console.log(`   - 檢測場景: ${result3.data.analysis_understanding.detected_scenario}`);
    console.log(`   - 檢定類型: ${result3.data.analysis_understanding.test_type}`);
    
  } catch (error) {
    console.log('❌ 測試失敗:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 測試 4: 完整報告生成
  console.log('📊 測試 4: 完整用戶友好報告');
  
  try {
    const result4 = await tool._execute({
      csvData: bloodPressureCSV,
      question: "新藥物能有效降低血壓嗎？"
    });
    
    console.log('📝 用戶友好報告預覽:');
    console.log(result4.data.user_friendly_report.substring(0, 500) + '...');
    
  } catch (error) {
    console.log('❌ 測試失敗:', error.message);
  }
}

// 如果直接執行此文件
if (require.main === module) {
  testIntelligentCSVAnalysis().catch(console.error);
}

module.exports = {
  testIntelligentCSVAnalysis,
  bloodPressureCSV,
  teachingMethodCSV,
  qualityControlCSV
}; 