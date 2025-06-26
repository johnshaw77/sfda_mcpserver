#!/usr/bin/env node
/**
 * 測試 MCP 圖表工具的 base64 圖片生成功能
 */

import { CreateHistogramTool } from './mcp-server/src/tools/stat/create-histogram.js';

async function testMCPImageGeneration() {
  console.log('🧪 測試 MCP 圖表工具的 base64 圖片生成功能...\n');

  const histogramTool = new CreateHistogramTool();

  // 測試數據
  const testData = Array.from({ length: 50 }, () => Math.random() * 100 + 50);

  console.log('📊 測試直方圖工具 (不含圖片)');
  try {
    const result1 = await histogramTool.execute({
      values: testData,
      bins: 10,
      title: '測試數據分佈',
      x_axis_label: '數值',
      y_axis_label: '頻率',
      generate_image: false
    });

    console.log('✅ 直方圖創建成功 (不含圖片)');
    console.log(`   包含圖片: ${result1._meta?.image_data ? '是' : '否'}`);
  } catch (error) {
    console.log('❌ 直方圖創建失敗:', error.message);
  }

  console.log('\n📊 測試直方圖工具 (含 PNG 圖片)');
  try {
    const result2 = await histogramTool.execute({
      values: testData,
      bins: 12,
      title: '測試數據分佈 (含圖片)',
      x_axis_label: '數值',
      y_axis_label: '頻率',
      generate_image: true,
      image_format: 'png'
    });

    console.log('✅ 直方圖創建成功 (含圖片)');
    console.log(`   包含圖片: ${result2._meta?.image_data ? '是' : '否'}`);
    if (result2._meta?.image_data) {
      console.log(`   圖片格式: ${result2._meta.image_data.format}`);
      console.log(`   Base64 長度: ${result2._meta.image_data.size} 字符`);
      console.log(`   前 50 字符: ${result2._meta.image_data.base64.substring(0, 50)}...`);
    }
  } catch (error) {
    console.log('❌ 直方圖創建失敗:', error.message);
    console.log('   錯誤詳情:', error);
  }

  console.log('\n✅ 測試完成！');
}

// 執行測試
testMCPImageGeneration().catch(console.error);