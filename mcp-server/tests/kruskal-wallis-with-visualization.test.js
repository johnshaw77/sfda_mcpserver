/**
 * Kruskal-Wallis 檢定與視覺化整合功能測試
 * 
 * 測試新增的視覺化功能是否正確整合到 Kruskal-Wallis 檢定工具中
 */

import { jest } from '@jest/globals';
import { PerformKruskalWallisTool } from '../src/tools/stat/perform-kruskal-wallis.js';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Kruskal-Wallis 檢定與視覺化整合測試', () => {
  let kruskalWallisTool;

  beforeEach(() => {
    kruskalWallisTool = new PerformKruskalWallisTool();
    jest.clearAllMocks();
    
    // 重設 fetch mock
    fetch.mockClear();
  });

  describe('參數驗證測試', () => {
    test('應該接受包含視覺化參數的格式', () => {
      const params = {
        data: {
          groups: [
            [10, 12, 14, 16, 18],
            [8, 10, 12, 14, 16],
            [12, 14, 16, 18, 20]
          ]
        },
        visualizations: {
          include_charts: true,
          chart_types: ['boxplot', 'histogram'],
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
          groups: [
            [10, 12, 14, 16, 18],
            [8, 10, 12, 14, 16],
            [12, 14, 16, 18, 20]
          ]
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
        groups: [
          [10, 12, 14, 16, 18],
          [8, 10, 12, 14, 16],
          [12, 14, 16, 18, 20]
        ]
      };
      const visualizationOptions = { generate_image: true, image_format: 'png' };
      const context = { 
        group_names: ['對照組', '低劑量組', '高劑量組']
      };

      const result = await kruskalWallisTool.createBoxplot(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/boxplot',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('多組數據分佈比較')
        })
      );

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.groups).toEqual([
        [10, 12, 14, 16, 18],
        [8, 10, 12, 14, 16],
        [12, 14, 16, 18, 20]
      ]);
      expect(requestBody.group_labels).toEqual(['對照組', '低劑量組', '高劑量組']);

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
          [10, 12, 14],
          [8, 10, 12],
          [12, 14, 16]
        ]
      };
      const visualizationOptions = { generate_image: true };
      const context = {};

      const result = await kruskalWallisTool.createHistogram(data, visualizationOptions, context);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/charts/histogram',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.values).toEqual([10, 12, 14, 8, 10, 12, 12, 14, 16]); // 合併的數據
      expect(requestBody.title).toContain('整體數據分佈');

      expect(result).toEqual(mockResponse);
    });

    test('createRankPlot 應該返回佔位符錯誤', async () => {
      const result = await kruskalWallisTool.createRankPlot({}, {}, {}, {});

      expect(result).toEqual({
        error: '等級圖功能尚未實作',
        placeholder: true
      });
    });
  });

  describe('輔助方法測試', () => {
    test('getChartTypeDescription 應該返回正確的描述', () => {
      expect(kruskalWallisTool.getChartTypeDescription('boxplot')).toBe('盒鬚圖 (多組分佈比較)');
      expect(kruskalWallisTool.getChartTypeDescription('histogram')).toBe('直方圖 (整體分佈檢查)');
      expect(kruskalWallisTool.getChartTypeDescription('rank_plot')).toBe('等級圖 (等級分佈顯示)');
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

      const result = kruskalWallisTool.extractImageData(visualizations);

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

      const result = kruskalWallisTool.extractImageData(visualizations);
      expect(result).toBeNull();
    });
  });

  describe('統計計算方法測試', () => {
    test('getMedian 應該正確計算中位數', () => {
      expect(kruskalWallisTool.getMedian([1, 2, 3, 4, 5])).toBe(3);
      expect(kruskalWallisTool.getMedian([1, 2, 3, 4])).toBe(2.5);
      expect(kruskalWallisTool.getMedian([5, 1, 3, 2, 4])).toBe(3);
    });

    test('getIQR 應該正確計算四分位距', () => {
      const result = kruskalWallisTool.getIQR([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(result).toBeCloseTo(5, 1); // 預期 Q3-Q1 約等於 5
    });

    test('getEtaSquaredInterpretation 應該正確解釋效果量', () => {
      expect(kruskalWallisTool.getEtaSquaredInterpretation(0.005)).toBe('微小效果');
      expect(kruskalWallisTool.getEtaSquaredInterpretation(0.03)).toBe('小效果');
      expect(kruskalWallisTool.getEtaSquaredInterpretation(0.08)).toBe('中等效果');
      expect(kruskalWallisTool.getEtaSquaredInterpretation(0.16)).toBe('大效果');
    });

    test('getMeanRank 應該正確計算平均等級', () => {
      const groups = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
      const group1 = groups[0];
      
      const result = kruskalWallisTool.getMeanRank(group1, groups);
      expect(result).toBeCloseTo(2, 0); // 第一組的平均等級應該是最低的
    });
  });

  describe('報告生成測試', () => {
    test('應該在報告中包含視覺化資訊', () => {
      const result = {
        h_statistic: 8.25,
        p_value: 0.016,
        reject_null: true,
        effect_size: 0.15,
        n_groups: 3,
        degrees_of_freedom: 2,
        interpretation: '各組間存在顯著差異'
      };

      const params = {
        data: {
          groups: [
            [10, 12, 14, 16, 18],
            [8, 10, 12, 14, 16],
            [12, 14, 16, 18, 20]
          ],
          alpha: 0.05
        },
        context: {
          group_names: ['對照組', '低劑量組', '高劑量組']
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

      const report = kruskalWallisTool.generateKruskalWallisReport(result, params, visualizations);

      expect(report).toContain('## 📊 視覺化圖表');
      expect(report).toContain('✅ 已生成 (包含 PNG 圖片)');
      expect(report).toContain('⚠️ 生成失敗 (API 調用失敗)');
      expect(report).toContain('盒鬚圖有助於直觀比較各組的分佈特徵');
    });

    test('沒有視覺化時不應該包含視覺化章節', () => {
      const result = {
        h_statistic: 8.25,
        p_value: 0.016,
        reject_null: true,
        effect_size: 0.15,
        n_groups: 3,
        degrees_of_freedom: 2,
        interpretation: '各組間存在顯著差異'
      };

      const params = {
        data: {
          groups: [
            [10, 12, 14, 16, 18],
            [8, 10, 12, 14, 16],
            [12, 14, 16, 18, 20]
          ],
          alpha: 0.05
        }
      };

      const report = kruskalWallisTool.generateKruskalWallisReport(result, params, {});

      expect(report).not.toContain('## 📊 視覺化圖表');
    });

    test('應該包含基本報告結構', () => {
      const result = {
        h_statistic: 8.25,
        p_value: 0.016,
        reject_null: true,
        effect_size: 0.15,
        n_groups: 3,
        degrees_of_freedom: 2,
        interpretation: '各組間存在顯著差異'
      };

      const params = {
        data: {
          groups: [
            [10, 12, 14, 16, 18],
            [8, 10, 12, 14, 16],
            [12, 14, 16, 18, 20]
          ],
          alpha: 0.05
        },
        context: {
          description: '比較三種治療方法的效果',
          group_names: ['對照組', '低劑量組', '高劑量組']
        }
      };

      const report = kruskalWallisTool.generateKruskalWallisReport(result, params);

      expect(report).toContain('# Kruskal-Wallis 檢定分析報告');
      expect(report).toContain('## 📊 檢定類型');
      expect(report).toContain('## 📈 各組統計');
      expect(report).toContain('## 🔍 檢定結果');
      expect(report).toContain('## 💪 效果量');
      expect(report).toContain('## 📊 組間比較');
      expect(report).toContain('## 💡 結果解釋');
      expect(report).toContain('## 📋 後續分析建議');
      expect(report).toContain('比較三種治療方法的效果');
      expect(report).toContain('對照組');
      expect(report).toContain('低劑量組');
      expect(report).toContain('高劑量組');
    });

    test('應該正確計算組間比較統計', () => {
      const result = {
        h_statistic: 8.25,
        p_value: 0.016,
        reject_null: true,
        effect_size: 0.15,
        n_groups: 3,
        degrees_of_freedom: 2,
        interpretation: '各組間存在顯著差異'
      };

      const params = {
        data: {
          groups: [
            [10, 12, 14],      // 中位數 12
            [8, 10, 12],       // 中位數 10  
            [16, 18, 20]       // 中位數 18
          ],
          alpha: 0.05
        },
        context: {
          group_names: ['組A', '組B', '組C']
        }
      };

      const report = kruskalWallisTool.generateKruskalWallisReport(result, params);

      expect(report).toContain('**最高中位數**: 組C (18.0000)');
      expect(report).toContain('**最低中位數**: 組B (10.0000)');
      expect(report).toContain('**中位數差異**: 8.0000');
    });
  });
});