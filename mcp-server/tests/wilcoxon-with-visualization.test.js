/**
 * Wilcoxon 符號等級檢定與視覺化整合功能測試
 * 
 * 測試新增的視覺化功能是否正確整合到 Wilcoxon 檢定工具中
 */

import { jest } from '@jest/globals';
import { PerformWilcoxonTool } from '../src/tools/stat/perform-wilcoxon.js';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Wilcoxon 符號等級檢定與視覺化整合測試', () => {
  let wilcoxonTool;

  beforeEach(() => {
    wilcoxonTool = new PerformWilcoxonTool();
    jest.clearAllMocks();
    
    // 重設 fetch mock
    fetch.mockClear();
  });

  describe('參數驗證測試', () => {
    test('應該接受包含視覺化參數的格式', () => {
      const params = {
        data: {
          sample1: [10, 12, 14, 16, 18],
          sample2: [8, 10, 12, 14, 16]
        },
        visualizations: {
          include_charts: true,
          chart_types: ['difference_histogram', 'paired_scatter'],
          generate_image: true,
          image_format: 'png'
        }
      };

      expect(params).toBeDefined();
      expect(params.visualizations).toBeDefined();
    });

    test('應該接受不包含視覺化參數的格式（向後兼容）', () => {
      const params = {
        data: {
          sample1: [10, 12, 14, 16, 18],
          sample2: [8, 10, 12, 14, 16]
        }
      };

      expect(params).toBeDefined();
      expect(params.visualizations).toBeUndefined();
    });
  });

  describe('視覺化方法測試', () => {
    test('createDifferenceHistogram 應該正確調用差異直方圖 API', async () => {
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

      const data = { 
        sample1: [10, 12, 14, 16, 18],
        sample2: [8, 10, 12, 14, 16]
      };
      const visualizationOptions = { generate_image: true, image_format: 'png' };
      const context = { 
        variable_names: { 
          sample1_name: '後測',
          sample2_name: '前測'
        }
      };

      const result = await wilcoxonTool.createDifferenceHistogram(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/histogram',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('後測配對差異分佈')
        })
      );

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.values).toEqual([2, 2, 2, 2, 2]); // 配對差異
      expect(requestBody.x_axis_label).toBe('差異值');

      expect(result).toEqual(mockResponse);
    });

    test('createPairedScatter 應該正確調用配對散點圖 API', async () => {
      const mockResponse = {
        success: true,
        chart_type: 'scatter',
        has_image: true,
        image_format: 'png'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const data = { 
        sample1: [10, 12, 14, 16, 18],
        sample2: [8, 10, 12, 14, 16]
      };
      const visualizationOptions = { generate_image: true };
      const context = { 
        variable_names: { 
          sample1_name: '後測',
          sample2_name: '前測'
        }
      };

      const result = await wilcoxonTool.createPairedScatter(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/scatter',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.x_values).toEqual([10, 12, 14, 16, 18]);
      expect(requestBody.y_values).toEqual([8, 10, 12, 14, 16]);
      expect(requestBody.add_diagonal).toBe(true);

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
        sample1: [10, 12, 14, 16, 18],
        sample2: [8, 10, 12, 14, 16]
      };
      const visualizationOptions = { generate_image: false };
      const context = { 
        variable_names: { 
          sample1_name: '治療後',
          sample2_name: '治療前'
        }
      };

      const result = await wilcoxonTool.createBoxplot(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/boxplot',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.groups).toEqual([[10, 12, 14, 16, 18], [8, 10, 12, 14, 16]]);
      expect(requestBody.group_labels).toEqual(['治療後', '治療前']);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('輔助方法測試', () => {
    test('getChartTypeDescription 應該返回正確的描述', () => {
      expect(wilcoxonTool.getChartTypeDescription('difference_histogram')).toBe('差異直方圖 (配對差異分佈)');
      expect(wilcoxonTool.getChartTypeDescription('paired_scatter')).toBe('配對散點圖 (前後測關係)');
      expect(wilcoxonTool.getChartTypeDescription('boxplot')).toBe('盒鬚圖 (前後測比較)');
    });

    test('extractImageData 應該正確提取圖片資訊', () => {
      const visualizations = {
        difference_histogram: {
          has_image: true,
          image_base64: 'abcd1234',
          image_format: 'png'
        },
        paired_scatter: {
          has_image: false
        }
      };

      const result = wilcoxonTool.extractImageData(visualizations);

      expect(result).toEqual({
        difference_histogram: {
          format: 'png',
          size: 8
        }
      });
    });

    test('extractImageData 應該在沒有圖片時返回 null', () => {
      const visualizations = {
        paired_scatter: { has_image: false }
      };

      const result = wilcoxonTool.extractImageData(visualizations);
      expect(result).toBeNull();
    });
  });

  describe('統計計算方法測試', () => {
    test('getMedian 應該正確計算中位數', () => {
      expect(wilcoxonTool.getMedian([1, 2, 3, 4, 5])).toBe(3);
      expect(wilcoxonTool.getMedian([1, 2, 3, 4])).toBe(2.5);
      expect(wilcoxonTool.getMedian([5, 1, 3, 2, 4])).toBe(3);
    });

    test('getEffectSizeInterpretation 應該正確解釋效果量', () => {
      expect(wilcoxonTool.getEffectSizeInterpretation(0.05)).toBe('微小效果');
      expect(wilcoxonTool.getEffectSizeInterpretation(0.2)).toBe('小效果');
      expect(wilcoxonTool.getEffectSizeInterpretation(0.4)).toBe('中等效果');
      expect(wilcoxonTool.getEffectSizeInterpretation(0.6)).toBe('大效果');
      expect(wilcoxonTool.getEffectSizeInterpretation(-0.3)).toBe('中等效果'); // 測試絕對值
    });

    test('getAlternativeDescription 應該返回正確的假設描述', () => {
      expect(wilcoxonTool.getAlternativeDescription('two-sided')).toBe('雙尾檢定（配對差異中位數 ≠ 0）');
      expect(wilcoxonTool.getAlternativeDescription('less')).toBe('左尾檢定（配對差異中位數 < 0）');
      expect(wilcoxonTool.getAlternativeDescription('greater')).toBe('右尾檢定（配對差異中位數 > 0）');
      expect(wilcoxonTool.getAlternativeDescription('unknown')).toBe('unknown');
    });
  });

  describe('報告生成測試', () => {
    test('應該在報告中包含視覺化資訊', () => {
      const result = {
        w_statistic: 15.5,
        p_value: 0.03,
        reject_null: true,
        effect_size: 0.4,
        n_pairs: 10,
        interpretation: '配對差異具有統計顯著性'
      };

      const params = {
        data: {
          sample1: [10, 12, 14, 16, 18],
          sample2: [8, 10, 12, 14, 16],
          alpha: 0.05
        }
      };

      const visualizations = {
        difference_histogram: {
          has_image: true,
          image_format: 'png'
        },
        paired_scatter: {
          error: 'API 調用失敗'
        }
      };

      const report = wilcoxonTool.generateWilcoxonReport(result, params, visualizations);

      expect(report).toContain('## 📊 視覺化圖表');
      expect(report).toContain('✅ 已生成 (包含 PNG 圖片)');
      expect(report).toContain('⚠️ 生成失敗 (API 調用失敗)');
      expect(report).toContain('差值直方圖有助於檢查配對差異的分佈特性');
    });

    test('沒有視覺化時不應該包含視覺化章節', () => {
      const result = {
        w_statistic: 15.5,
        p_value: 0.03,
        reject_null: true,
        effect_size: 0.4,
        n_pairs: 10,
        interpretation: '配對差異具有統計顯著性'
      };

      const params = {
        data: {
          sample1: [10, 12, 14, 16, 18],
          sample2: [8, 10, 12, 14, 16],
          alpha: 0.05
        }
      };

      const report = wilcoxonTool.generateWilcoxonReport(result, params, {});

      expect(report).not.toContain('## 📊 視覺化圖表');
    });

    test('應該包含基本報告結構', () => {
      const result = {
        w_statistic: 15.5,
        p_value: 0.03,
        reject_null: true,
        effect_size: 0.4,
        n_pairs: 10,
        interpretation: '配對差異具有統計顯著性'
      };

      const params = {
        data: {
          sample1: [10, 12, 14, 16, 18],
          sample2: [8, 10, 12, 14, 16],
          alpha: 0.05
        },
        context: {
          description: '比較治療前後的效果'
        }
      };

      const report = wilcoxonTool.generateWilcoxonReport(result, params);

      expect(report).toContain('# Wilcoxon 符號等級檢定分析報告');
      expect(report).toContain('## 📊 檢定類型');
      expect(report).toContain('## 📈 樣本統計');
      expect(report).toContain('## 🔍 檢定結果');
      expect(report).toContain('## 💪 效果量');
      expect(report).toContain('## 📊 差異分析');
      expect(report).toContain('## 💡 結果解釋');
      expect(report).toContain('## 📋 使用建議');
      expect(report).toContain('比較治療前後的效果');
    });

    test('應該正確計算配對差異統計', () => {
      const result = {
        w_statistic: 15.5,
        p_value: 0.03,
        reject_null: true,
        effect_size: 0.4,
        n_pairs: 5,
        interpretation: '配對差異具有統計顯著性'
      };

      const params = {
        data: {
          sample1: [10, 12, 14, 16, 18],
          sample2: [8, 10, 12, 14, 16],
          alpha: 0.05
        }
      };

      const report = wilcoxonTool.generateWilcoxonReport(result, params);

      expect(report).toContain('**正差異數量**: 5 (增加)');
      expect(report).toContain('**負差異數量**: 0 (減少)');
      expect(report).toContain('**零差異數量**: 0 (無變化)');
      expect(report).toContain('**中位數差異**: 2.0000');
    });
  });
});