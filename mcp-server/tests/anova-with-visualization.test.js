/**
 * ANOVA 與視覺化整合功能測試
 * 
 * 測試新增的視覺化功能是否正確整合到 ANOVA 工具中
 */

import { jest } from '@jest/globals';
import { PerformANOVATool } from '../src/tools/stat/perform-anova.js';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ANOVA 與視覺化整合測試', () => {
  let anovaTool;

  beforeEach(() => {
    anovaTool = new PerformANOVATool();
    jest.clearAllMocks();
    
    // 重設 fetch mock
    fetch.mockClear();
  });

  describe('參數驗證測試', () => {
    test('應該接受包含視覺化參數的格式', () => {
      const params = {
        data: {
          groups: [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15]
          ]
        },
        visualizations: {
          include_charts: true,
          chart_types: ['boxplot', 'histogram'],
          generate_image: true,
          image_format: 'png'
        }
      };

      expect(() => anovaTool.validateInput(params)).not.toThrow();
    });

    test('應該接受不包含視覺化參數的格式（向後兼容）', () => {
      const params = {
        data: {
          groups: [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15]
          ]
        }
      };

      expect(() => anovaTool.validateInput(params)).not.toThrow();
    });

    test('應該拒絕少於 2 組的數據', () => {
      const params = {
        data: {
          groups: [[1, 2, 3, 4, 5]]
        }
      };

      expect(() => anovaTool.validateInput(params)).toThrow('至少需要 2 組數據進行 ANOVA 分析');
    });

    test('應該拒絕包含空組的數據', () => {
      const params = {
        data: {
          groups: [
            [1, 2, 3, 4, 5],
            [],
            [11, 12, 13, 14, 15]
          ]
        }
      };

      expect(() => anovaTool.validateInput(params)).toThrow('第 2 組至少需要 2 個數據點');
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
        groups: [
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
          [11, 12, 13, 14, 15]
        ]
      };
      const visualizationOptions = { generate_image: true, image_format: 'png' };
      const context = { 
        variables: { 
          dependent: '測試變數',
          group_names: ['組A', '組B', '組C']
        }
      };

      const result = await anovaTool.createBoxplot(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/boxplot',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('測試變數組間比較')
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
        groups: [
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10]
        ]
      };
      const visualizationOptions = { generate_image: true };
      const context = { 
        variables: { 
          dependent: '測試變數'
        }
      };

      const result = await anovaTool.createHistogram(data, visualizationOptions, context);

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

    test('createResidualPlot 應該返回佔位符錯誤', async () => {
      const result = await anovaTool.createResidualPlot({}, {}, {}, {});

      expect(result).toEqual({
        error: '殘差圖功能尚未實作',
        placeholder: true
      });
    });
  });

  describe('輔助方法測試', () => {
    test('getChartTypeDescription 應該返回正確的描述', () => {
      expect(anovaTool.getChartTypeDescription('boxplot')).toBe('盒鬚圖 (組間比較)');
      expect(anovaTool.getChartTypeDescription('histogram')).toBe('直方圖 (分佈檢查)');
      expect(anovaTool.getChartTypeDescription('residual_plot')).toBe('殘差圖 (假設檢驗)');
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

      const result = anovaTool.extractImageData(visualizations);

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

      const result = anovaTool.extractImageData(visualizations);
      expect(result).toBeNull();
    });
  });

  describe('分析參數準備測試', () => {
    test('prepareAnalysisParams 應該正確準備參數', () => {
      const args = {
        data: {
          groups: [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
          ],
          alpha: 0.01
        }
      };

      const result = anovaTool.prepareAnalysisParams(args);

      expect(result).toEqual({
        groups: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ],
        alpha: 0.01
      });
    });

    test('prepareAnalysisParams 應該使用預設 alpha 值', () => {
      const args = {
        data: {
          groups: [
            [1, 2, 3],
            [4, 5, 6]
          ]
        }
      };

      const result = anovaTool.prepareAnalysisParams(args);

      expect(result.alpha).toBe(0.05);
    });
  });

  describe('場景描述測試', () => {
    test('getScenarioDescription 應該返回正確的場景描述', () => {
      expect(anovaTool.getScenarioDescription('medical')).toBe('醫學研究');
      expect(anovaTool.getScenarioDescription('education')).toBe('教育研究');
      expect(anovaTool.getScenarioDescription('agriculture')).toBe('農業研究');
      expect(anovaTool.getScenarioDescription('quality')).toBe('品質管控');
      expect(anovaTool.getScenarioDescription('psychology')).toBe('心理學研究');
      expect(anovaTool.getScenarioDescription('business')).toBe('商業分析');
      expect(anovaTool.getScenarioDescription('unknown')).toBe('unknown');
    });
  });

  describe('效果量解釋測試', () => {
    test('interpretEtaSquared 應該正確解釋效果量', () => {
      expect(anovaTool.interpretEtaSquared(0.005)).toBe('微小');
      expect(anovaTool.interpretEtaSquared(0.03)).toBe('小');
      expect(anovaTool.interpretEtaSquared(0.10)).toBe('中等');
      expect(anovaTool.interpretEtaSquared(0.20)).toBe('大');
    });
  });

  describe('p 值格式化測試', () => {
    test('formatPValue 應該正確格式化 p 值', () => {
      expect(anovaTool.formatPValue(0.0005)).toBe('< 0.001');
      expect(anovaTool.formatPValue(0.005)).toBe('0.0050');
      expect(anovaTool.formatPValue(0.05)).toBe('0.050');
      expect(anovaTool.formatPValue(0.123)).toBe('0.123');
    });
  });
});