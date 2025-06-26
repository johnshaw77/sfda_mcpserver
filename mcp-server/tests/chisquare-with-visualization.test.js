/**
 * 卡方檢定與視覺化整合功能測試
 * 
 * 測試新增的視覺化功能是否正確整合到卡方檢定工具中
 */

import { jest } from '@jest/globals';
import { PerformChiSquareTool } from '../src/tools/stat/perform-chisquare.js';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('卡方檢定與視覺化整合測試', () => {
  let chiSquareTool;

  beforeEach(() => {
    chiSquareTool = new PerformChiSquareTool();
    jest.clearAllMocks();
    
    // 重設 fetch mock
    fetch.mockClear();
  });

  describe('參數驗證測試', () => {
    test('應該接受包含視覺化參數的格式', () => {
      const params = {
        data: {
          observed: [10, 15, 20, 25],
          expected: [12, 18, 22, 23]
        },
        visualizations: {
          include_charts: true,
          chart_types: ['bar_chart'],
          generate_image: true,
          image_format: 'png'
        }
      };

      expect(() => chiSquareTool.validateInput(params)).not.toThrow();
    });

    test('應該接受不包含視覺化參數的格式（向後兼容）', () => {
      const params = {
        data: {
          observed: [10, 15, 20, 25]
        }
      };

      expect(() => chiSquareTool.validateInput(params)).not.toThrow();
    });

    test('應該拒絕負數的觀察頻數', () => {
      const params = {
        data: {
          observed: [10, -5, 20, 25]
        }
      };

      expect(() => chiSquareTool.validateInput(params)).toThrow('所有觀察頻數必須是非負數字');
    });

    test('應該拒絕期望頻數與觀察頻數長度不一致', () => {
      const params = {
        data: {
          observed: [10, 15, 20, 25],
          expected: [12, 18, 22] // 長度不一致
        }
      };

      expect(() => chiSquareTool.validateInput(params)).toThrow('期望頻數的長度必須與觀察頻數一致');
    });

    test('應該拒絕非正數的期望頻數', () => {
      const params = {
        data: {
          observed: [10, 15, 20, 25],
          expected: [12, 0, 22, 23] // 包含 0
        }
      };

      expect(() => chiSquareTool.validateInput(params)).toThrow('所有期望頻數必須是正數');
    });
  });

  describe('視覺化方法測試', () => {
    test('createBarChart 應該正確調用長條圖 API', async () => {
      const mockResponse = {
        success: true,
        chart_type: 'bar',
        has_image: true,
        image_format: 'png',
        image_base64: 'base64string...'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const data = { 
        observed: [10, 15, 20, 25],
        expected: [12, 18, 22, 23]
      };
      const result = {
        observed_freq: [10, 15, 20, 25],
        expected_freq: [12, 18, 22, 23]
      };
      const visualizationOptions = { generate_image: true, image_format: 'png' };
      const context = { 
        category_labels: ['類別A', '類別B', '類別C', '類別D']
      };

      const chartResult = await chiSquareTool.createBarChart(data, result, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/simple',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('觀察頻率 vs 期望頻率比較')
        })
      );

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.chart_type).toBe('bar');
      expect(requestBody.values).toEqual([10, 15, 20, 25]);
      expect(requestBody.labels).toEqual(['類別A', '類別B', '類別C', '類別D']);

      expect(chartResult).toEqual(mockResponse);
    });

    test('createBarChart 應該處理缺少期望頻率的情況', async () => {
      const data = { 
        observed: [10, 15, 20, 25]
      };
      const result = {
        observed_freq: [10, 15, 20, 25],
        expected_freq: null
      };
      const visualizationOptions = { generate_image: false };
      const context = {};

      const chartResult = await chiSquareTool.createBarChart(data, result, visualizationOptions, context);

      expect(chartResult).toEqual({
        error: '缺少期望頻率數據，無法創建比較長條圖'
      });
    });

    test('createResidualPlot 應該返回佔位符錯誤', async () => {
      const result = await chiSquareTool.createResidualPlot({}, {}, {}, {});

      expect(result).toEqual({
        error: '殘差圖功能尚未實作',
        placeholder: true
      });
    });

    test('createMosaicPlot 應該返回佔位符錯誤', async () => {
      const result = await chiSquareTool.createMosaicPlot({}, {}, {}, {});

      expect(result).toEqual({
        error: '馬賽克圖功能尚未實作',
        placeholder: true
      });
    });
  });

  describe('輔助方法測試', () => {
    test('getChartTypeDescription 應該返回正確的描述', () => {
      expect(chiSquareTool.getChartTypeDescription('bar_chart')).toBe('長條圖 (觀察vs期望頻率)');
      expect(chiSquareTool.getChartTypeDescription('residual_plot')).toBe('殘差圖 (標準化殘差)');
      expect(chiSquareTool.getChartTypeDescription('mosaic_plot')).toBe('馬賽克圖 (列聯表結構)');
    });

    test('extractImageData 應該正確提取圖片資訊', () => {
      const visualizations = {
        bar_chart: {
          has_image: true,
          image_base64: 'abcd1234',
          image_format: 'png'
        },
        residual_plot: {
          has_image: false
        }
      };

      const result = chiSquareTool.extractImageData(visualizations);

      expect(result).toEqual({
        bar_chart: {
          format: 'png',
          size: 8
        }
      });
    });

    test('extractImageData 應該在沒有圖片時返回 null', () => {
      const visualizations = {
        residual_plot: { has_image: false }
      };

      const result = chiSquareTool.extractImageData(visualizations);
      expect(result).toBeNull();
    });
  });

  describe('分析參數準備測試', () => {
    test('prepareAnalysisParams 應該正確識別適合度檢定', () => {
      const args = {
        data: {
          observed: [10, 15, 20, 25],
          expected: [12, 18, 22, 23],
          alpha: 0.01
        }
      };

      const result = chiSquareTool.prepareAnalysisParams(args);

      expect(result).toEqual({
        observed: [10, 15, 20, 25],
        expected: [12, 18, 22, 23],
        alpha: 0.01,
        test_type: 'goodness_of_fit'
      });
    });

    test('prepareAnalysisParams 應該正確識別獨立性檢定', () => {
      const args = {
        data: {
          observed: [[10, 15], [20, 25]]
        }
      };

      const result = chiSquareTool.prepareAnalysisParams(args);

      expect(result).toEqual({
        observed: [[10, 15], [20, 25]],
        expected: undefined,
        alpha: 0.05,
        test_type: 'independence'
      });
    });
  });

  describe('場景描述測試', () => {
    test('getScenarioDescription 應該返回正確的場景描述', () => {
      expect(chiSquareTool.getScenarioDescription('medical')).toBe('醫學研究');
      expect(chiSquareTool.getScenarioDescription('education')).toBe('教育研究');
      expect(chiSquareTool.getScenarioDescription('quality')).toBe('品質管控');
      expect(chiSquareTool.getScenarioDescription('market')).toBe('市場研究');
      expect(chiSquareTool.getScenarioDescription('social')).toBe('社會科學研究');
      expect(chiSquareTool.getScenarioDescription('unknown')).toBe('unknown');
    });
  });

  describe('效果量解釋測試', () => {
    test('interpretCramersV 應該正確解釋效果量', () => {
      expect(chiSquareTool.interpretCramersV(0.05)).toBe('微小');
      expect(chiSquareTool.interpretCramersV(0.2)).toBe('小');
      expect(chiSquareTool.interpretCramersV(0.4)).toBe('中等');
      expect(chiSquareTool.interpretCramersV(0.6)).toBe('大');
    });
  });

  describe('p 值格式化測試', () => {
    test('formatPValue 應該正確格式化 p 值', () => {
      expect(chiSquareTool.formatPValue(0.0005)).toBe('< 0.001');
      expect(chiSquareTool.formatPValue(0.005)).toBe('0.0050');
      expect(chiSquareTool.formatPValue(0.05)).toBe('0.050');
      expect(chiSquareTool.formatPValue(0.123)).toBe('0.123');
    });
  });

  describe('頻數表格式化測試', () => {
    test('formatFrequencyTable 應該正確格式化一維數據', () => {
      const observed = [10, 15, 20];
      const expected = [12, 18, 22];

      const result = chiSquareTool.formatFrequencyTable(observed, expected);

      expect(result).toContain('| 類別 1 | 10 | 12.0 | -2.0 |');
      expect(result).toContain('| 類別 2 | 15 | 18.0 | -3.0 |');
      expect(result).toContain('| 類別 3 | 20 | 22.0 | -2.0 |');
    });

    test('formatFrequencyTable 應該正確格式化二維數據', () => {
      const observed = [[10, 15], [20, 25]];
      const expected = [[12, 18], [22, 23]];

      const result = chiSquareTool.formatFrequencyTable(observed, expected);

      expect(result).toContain('| (1,1) | 10 | 12.0 | -2.0 |');
      expect(result).toContain('| (1,2) | 15 | 18.0 | -3.0 |');
      expect(result).toContain('| (2,1) | 20 | 22.0 | -2.0 |');
      expect(result).toContain('| (2,2) | 25 | 23.0 | +2.0 |');
    });
  });

  describe('報告生成測試', () => {
    test('應該在報告中包含視覺化資訊', () => {
      const result = {
        statistic: 5.23,
        p_value: 0.025,
        df: 3,
        effect_size: 0.3,
        observed_freq: [10, 15, 20, 25],
        expected_freq: [12, 18, 22, 23]
      };

      const args = {
        data: {
          observed: [10, 15, 20, 25],
          expected: [12, 18, 22, 23],
          alpha: 0.05
        }
      };

      const visualizations = {
        bar_chart: {
          has_image: true,
          image_format: 'png'
        },
        residual_plot: {
          error: 'API 調用失敗'
        }
      };

      const report = chiSquareTool.generateChiSquareReport(result, args, visualizations);

      expect(report).toContain('## 📊 視覺化圖表');
      expect(report).toContain('✅ 已生成 (包含 PNG 圖片)');
      expect(report).toContain('⚠️ 生成失敗 (API 調用失敗)');
      expect(report).toContain('長條圖直觀展示觀察頻率與期望頻率的差異');
    });

    test('沒有視覺化時不應該包含視覺化章節', () => {
      const result = {
        statistic: 5.23,
        p_value: 0.025,
        df: 3,
        effect_size: 0.3
      };

      const args = {
        data: {
          observed: [10, 15, 20, 25],
          alpha: 0.05
        }
      };

      const report = chiSquareTool.generateChiSquareReport(result, args, {});

      expect(report).not.toContain('## 📊 視覺化圖表');
    });
  });
});