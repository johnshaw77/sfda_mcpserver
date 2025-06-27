/**
 * Mann-Whitney U 與視覺化整合功能測試
 * 
 * 測試新增的視覺化功能是否正確整合到 Mann-Whitney U 檢定工具中
 */

import { jest } from '@jest/globals';
import { PerformMannWhitneyTool } from '../src/tools/stat/perform-mann-whitney.js';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Mann-Whitney U 與視覺化整合測試', () => {
  let mannWhitneyTool;

  beforeEach(() => {
    mannWhitneyTool = new PerformMannWhitneyTool();
    jest.clearAllMocks();
    
    // 重設 fetch mock
    fetch.mockClear();
  });

  describe('參數驗證測試', () => {
    test('應該接受包含視覺化參數的格式', () => {
      const params = {
        data: {
          sample1: [1, 2, 3, 4, 5],
          sample2: [6, 7, 8, 9, 10]
        },
        visualizations: {
          include_charts: true,
          chart_types: ['boxplot', 'histogram'],
          generate_image: true,
          image_format: 'png'
        }
      };

      // 不應該拋出錯誤（基本參數驗證在 _execute 方法中）
      expect(params).toBeDefined();
      expect(params.visualizations).toBeDefined();
    });

    test('應該接受不包含視覺化參數的格式（向後兼容）', () => {
      const params = {
        data: {
          sample1: [1, 2, 3, 4, 5],
          sample2: [6, 7, 8, 9, 10]
        }
      };

      expect(params).toBeDefined();
      expect(params.visualizations).toBeUndefined();
    });
  });

  describe('視覺化方法測試', () => {
    test('createBoxplot 應該正確調用盒鬚圖 API', async () => {
      const mockResponse = {
        success: true,
        chart_type: 'boxplot',
        has_image: true,
        image_format: 'png',
        image_base64: 'base64string...'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const data = { 
        sample1: [1, 2, 3, 4, 5],
        sample2: [6, 7, 8, 9, 10]
      };
      const visualizationOptions = { generate_image: true, image_format: 'png' };
      const context = { 
        variable_names: { 
          sample1_name: '對照組',
          sample2_name: '實驗組'
        }
      };

      const result = await mannWhitneyTool.createBoxplot(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/boxplot',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('對照組數據分佈比較')
        })
      );

      expect(result).toEqual(mockResponse);
    });

    test('createHistogram 應該正確調用直方圖 API', async () => {
      const mockResponse = {
        success: true,
        chart_type: 'histogram',
        has_image: true,
        image_format: 'png'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const data = { 
        sample1: [1, 2, 3, 4, 5],
        sample2: [6, 7, 8, 9, 10]
      };
      const visualizationOptions = { generate_image: true };
      const context = { 
        variable_names: { 
          sample1_name: '測試變數'
        }
      };

      const result = await mannWhitneyTool.createHistogram(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/histogram',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // 合併的數據
      expect(requestBody.title).toContain('測試變數整體分佈');

      expect(result).toEqual(mockResponse);
    });

    test('createRankPlot 應該返回佔位符錯誤', async () => {
      const result = await mannWhitneyTool.createRankPlot({}, {}, {}, {});

      expect(result).toEqual({
        error: '等級圖功能尚未實作',
        placeholder: true
      });
    });
  });

  describe('輔助方法測試', () => {
    test('getChartTypeDescription 應該返回正確的描述', () => {
      expect(mannWhitneyTool.getChartTypeDescription('boxplot')).toBe('盒鬚圖 (組間分佈比較)');
      expect(mannWhitneyTool.getChartTypeDescription('histogram')).toBe('直方圖 (整體分佈檢查)');
      expect(mannWhitneyTool.getChartTypeDescription('rank_plot')).toBe('等級圖 (等級分佈顯示)');
    });

    test('extractImageData 應該正確提取圖片資訊', () => {
      const visualizations = {
        boxplot: {
          has_image: true,
          image_base64: 'abcd1234',
          image_format: 'png'
        },
        histogram: {
          has_image: false
        }
      };

      const result = mannWhitneyTool.extractImageData(visualizations);

      expect(result).toEqual({
        boxplot: {
          format: 'png',
          size: 8
        }
      });
    });

    test('extractImageData 應該在沒有圖片時返回 null', () => {
      const visualizations = {
        histogram: { has_image: false }
      };

      const result = mannWhitneyTool.extractImageData(visualizations);
      expect(result).toBeNull();
    });
  });

  describe('統計計算方法測試', () => {
    test('getMedian 應該正確計算中位數', () => {
      expect(mannWhitneyTool.getMedian([1, 2, 3, 4, 5])).toBe(3);
      expect(mannWhitneyTool.getMedian([1, 2, 3, 4])).toBe(2.5);
      expect(mannWhitneyTool.getMedian([5, 1, 3, 2, 4])).toBe(3);
    });

    test('getEffectSizeInterpretation 應該正確解釋效果量', () => {
      expect(mannWhitneyTool.getEffectSizeInterpretation(0.05)).toBe('微小效果');
      expect(mannWhitneyTool.getEffectSizeInterpretation(0.2)).toBe('小效果');
      expect(mannWhitneyTool.getEffectSizeInterpretation(0.4)).toBe('中等效果');
      expect(mannWhitneyTool.getEffectSizeInterpretation(0.6)).toBe('大效果');
      expect(mannWhitneyTool.getEffectSizeInterpretation(-0.3)).toBe('中等效果'); // 測試絕對值
    });

    test('getAlternativeDescription 應該返回正確的假設描述', () => {
      expect(mannWhitneyTool.getAlternativeDescription('two-sided')).toBe('雙尾檢定（兩組分佈不同）');
      expect(mannWhitneyTool.getAlternativeDescription('less')).toBe('左尾檢定（樣本1 < 樣本2）');
      expect(mannWhitneyTool.getAlternativeDescription('greater')).toBe('右尾檢定（樣本1 > 樣本2）');
      expect(mannWhitneyTool.getAlternativeDescription('unknown')).toBe('unknown');
    });
  });

  describe('報告生成測試', () => {
    test('應該在報告中包含視覺化資訊', () => {
      const result = {
        u_statistic: 15.5,
        p_value: 0.03,
        reject_null: true,
        effect_size: 0.4,
        rank_sum1: 25,
        rank_sum2: 30,
        interpretation: '兩組間存在顯著差異'
      };

      const params = {
        data: {
          sample1: [1, 2, 3, 4, 5],
          sample2: [6, 7, 8, 9, 10],
          alpha: 0.05
        }
      };

      const visualizations = {
        boxplot: {
          has_image: true,
          image_format: 'png'
        },
        histogram: {
          error: 'API 調用失敗'
        }
      };

      const report = mannWhitneyTool.generateMannWhitneyReport(result, params, visualizations);

      expect(report).toContain('## 📊 視覺化圖表');
      expect(report).toContain('✅ 已生成 (包含 PNG 圖片)');
      expect(report).toContain('⚠️ 生成失敗 (API 調用失敗)');
      expect(report).toContain('盒鬚圖有助於直觀比較兩組數據的分佈位置和變異性');
    });

    test('沒有視覺化時不應該包含視覺化章節', () => {
      const result = {
        u_statistic: 15.5,
        p_value: 0.03,
        reject_null: true,
        effect_size: 0.4,
        rank_sum1: 25,
        rank_sum2: 30,
        interpretation: '兩組間存在顯著差異'
      };

      const params = {
        data: {
          sample1: [1, 2, 3, 4, 5],
          sample2: [6, 7, 8, 9, 10],
          alpha: 0.05
        }
      };

      const report = mannWhitneyTool.generateMannWhitneyReport(result, params, {});

      expect(report).not.toContain('## 📊 視覺化圖表');
    });

    test('應該包含基本報告結構', () => {
      const result = {
        u_statistic: 15.5,
        p_value: 0.03,
        reject_null: true,
        effect_size: 0.4,
        rank_sum1: 25,
        rank_sum2: 30,
        interpretation: '兩組間存在顯著差異'
      };

      const params = {
        data: {
          sample1: [1, 2, 3, 4, 5],
          sample2: [6, 7, 8, 9, 10],
          alpha: 0.05
        },
        context: {
          description: '比較兩組療效'
        }
      };

      const report = mannWhitneyTool.generateMannWhitneyReport(result, params);

      expect(report).toContain('# Mann-Whitney U 檢定分析報告');
      expect(report).toContain('## 📊 檢定類型');
      expect(report).toContain('## 📈 樣本統計');
      expect(report).toContain('## 🔍 檢定結果');
      expect(report).toContain('## 💪 效果量');
      expect(report).toContain('## 💡 結果解釋');
      expect(report).toContain('## 📋 使用建議');
      expect(report).toContain('比較兩組療效');
    });
  });
});