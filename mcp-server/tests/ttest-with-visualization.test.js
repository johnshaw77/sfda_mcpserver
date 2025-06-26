/**
 * T檢定與視覺化整合功能測試
 * 
 * 測試新增的視覺化功能是否正確整合到 T檢定工具中
 */

import { jest } from '@jest/globals';
import { PerformTTestTool } from '../src/tools/stat/perform-ttest.js';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('T檢定與視覺化整合測試', () => {
  let ttestTool;

  beforeEach(() => {
    ttestTool = new PerformTTestTool();
    jest.clearAllMocks();
    
    // 重設 fetch mock
    fetch.mockClear();
  });

  describe('參數驗證測試', () => {
    test('應該接受包含視覺化參數的新格式', () => {
      const params = {
        data: {
          sample1: [1, 2, 3, 4, 5],
          sample2: [6, 7, 8, 9, 10]
        },
        visualizations: {
          include_charts: true,
          chart_types: ['histogram', 'boxplot'],
          generate_image: true,
          image_format: 'png'
        }
      };

      expect(() => ttestTool.validateInput(params)).not.toThrow();
    });

    test('應該接受不包含視覺化參數的格式（向後兼容）', () => {
      const params = {
        data: {
          sample1: [1, 2, 3, 4, 5],
          sample2: [6, 7, 8, 9, 10]
        }
      };

      expect(() => ttestTool.validateInput(params)).not.toThrow();
    });

    test('應該接受舊格式參數（向後兼容）', () => {
      const legacyParams = {
        sample1: [1, 2, 3, 4, 5],
        sample2: [6, 7, 8, 9, 10]
      };

      expect(() => ttestTool.validateInput(legacyParams)).not.toThrow();
    });
  });

  describe('視覺化方法測試', () => {
    test('createHistogram 應該正確調用直方圖 API', async () => {
      const mockResponse = {
        success: true,
        chart_type: 'histogram',
        has_image: true,
        image_format: 'png',
        image_base64: 'base64string...'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const data = { sample1: [1, 2, 3, 4, 5] };
      const visualizationOptions = { generate_image: true, image_format: 'png' };
      const context = { variable_names: { sample1_name: '測試樣本' } };

      const result = await ttestTool.createHistogram(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/histogram',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('測試樣本數據分佈')
        })
      );

      expect(result).toEqual(mockResponse);
    });

    test('createBoxplot 應該正確調用盒鬚圖 API', async () => {
      const mockResponse = {
        success: true,
        chart_type: 'boxplot',
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
          sample1_name: '樣本1',
          sample2_name: '樣本2'
        }
      };

      const result = await ttestTool.createBoxplot(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/boxplot',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      expect(result).toEqual(mockResponse);
    });

    test('createQQPlot 應該返回佔位符錯誤', async () => {
      const result = await ttestTool.createQQPlot({}, {}, {});

      expect(result).toEqual({
        error: 'Q-Q 圖功能尚未實作',
        placeholder: true
      });
    });
  });

  describe('輔助方法測試', () => {
    test('getChartTypeDescription 應該返回正確的描述', () => {
      expect(ttestTool.getChartTypeDescription('histogram')).toBe('直方圖 (常態性檢查)');
      expect(ttestTool.getChartTypeDescription('boxplot')).toBe('盒鬚圖 (組間比較)');
      expect(ttestTool.getChartTypeDescription('qq_plot')).toBe('Q-Q 圖 (常態性檢查)');
    });

    test('extractImageData 應該正確提取圖片資訊', () => {
      const visualizations = {
        histogram: {
          has_image: true,
          image_base64: 'abcd1234',
          image_format: 'png'
        },
        boxplot: {
          has_image: false
        }
      };

      const result = ttestTool.extractImageData(visualizations);

      expect(result).toEqual({
        histogram: {
          format: 'png',
          size: 8
        }
      });
    });

    test('extractImageData 應該在沒有圖片時返回 null', () => {
      const visualizations = {
        boxplot: { has_image: false }
      };

      const result = ttestTool.extractImageData(visualizations);
      expect(result).toBeNull();
    });
  });

  describe('參數正規化測試', () => {
    test('應該正確轉換舊格式到新格式', () => {
      const legacyParams = {
        sample1: [1, 2, 3],
        sample2: [4, 5, 6],
        paired: true,
        alpha: 0.01,
        scenario: 'medical'
      };

      const normalized = ttestTool.normalizeParameters(legacyParams);

      expect(normalized).toEqual({
        data: {
          sample1: [1, 2, 3],
          sample2: [4, 5, 6],
          paired: true,
          alpha: 0.01,
          alternative: 'two-sided'
        },
        context: {
          scenario: 'medical',
          description: '統計檢定分析',
          variable_names: {
            sample1_name: '樣本1',
            sample2_name: '樣本2'
          }
        }
      });
    });

    test('應該保持新格式不變', () => {
      const newParams = {
        data: {
          sample1: [1, 2, 3],
          sample2: [4, 5, 6]
        },
        context: {
          scenario: 'education'
        }
      };

      const normalized = ttestTool.normalizeParameters(newParams);
      expect(normalized).toEqual(newParams);
    });
  });

  describe('報告生成測試', () => {
    test('應該在報告中包含視覺化資訊', () => {
      const result = {
        statistic: 2.5,
        p_value: 0.02,
        degrees_of_freedom: 8,
        test_type: 'two_sample'
      };

      const params = {
        data: {
          sample1: [1, 2, 3, 4, 5],
          sample2: [6, 7, 8, 9, 10],
          alpha: 0.05
        }
      };

      const visualizations = {
        histogram: {
          has_image: true,
          image_format: 'png'
        },
        boxplot: {
          error: 'API 調用失敗'
        }
      };

      const report = ttestTool.generateTTestReport(result, params, visualizations);

      expect(report).toContain('## 📊 視覺化圖表');
      expect(report).toContain('✅ 已生成 (包含 PNG 圖片)');
      expect(report).toContain('⚠️ 生成失敗 (API 調用失敗)');
      expect(report).toContain('圖表有助於檢驗統計假設');
    });

    test('沒有視覺化時不應該包含視覺化章節', () => {
      const result = {
        statistic: 2.5,
        p_value: 0.02,
        degrees_of_freedom: 8,
        test_type: 'two_sample'
      };

      const params = {
        data: {
          sample1: [1, 2, 3, 4, 5],
          sample2: [6, 7, 8, 9, 10],
          alpha: 0.05
        }
      };

      const report = ttestTool.generateTTestReport(result, params, {});

      expect(report).not.toContain('## 📊 視覺化圖表');
    });
  });
});