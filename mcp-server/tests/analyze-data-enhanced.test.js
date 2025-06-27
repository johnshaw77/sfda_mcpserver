/**
 * 增強版智能數據分析工具測試
 * 
 * 測試改進後的智能分析建議功能
 */

import { jest } from '@jest/globals';
import { AnalyzeDataTool } from '../src/tools/stat/analyze-data.js';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock statService
const mockStatService = {
  analyzeDataStructure: jest.fn(),
  suggestAppropriateTest: jest.fn()
};

describe('增強版智能數據分析工具測試', () => {
  let analyzeDataTool;

  beforeEach(() => {
    analyzeDataTool = new AnalyzeDataTool();
    jest.clearAllMocks();
  });

  describe('新增統計檢定支援測試', () => {
    test('getTestDisplayName 應該包含所有6種統計檢定', () => {
      expect(analyzeDataTool.getTestDisplayName('ttest')).toBe('T檢定 (參數檢定)');
      expect(analyzeDataTool.getTestDisplayName('anova')).toBe('ANOVA 變異數分析 (參數檢定)');
      expect(analyzeDataTool.getTestDisplayName('chisquare')).toBe('卡方檢定 (分類數據)');
      expect(analyzeDataTool.getTestDisplayName('mann_whitney')).toBe('Mann-Whitney U 檢定 (非參數檢定)');
      expect(analyzeDataTool.getTestDisplayName('wilcoxon')).toBe('Wilcoxon 符號等級檢定 (非參數配對檢定)');
      expect(analyzeDataTool.getTestDisplayName('kruskal_wallis')).toBe('Kruskal-Wallis 檢定 (非參數多組檢定)');
    });
  });

  describe('新增指導方法測試', () => {
    const mockDataStructure = {
      columns: [
        { name: '治療效果', type: 'numeric', sampleValues: [85, 87, 89] },
        { name: '治療組別', type: 'categorical', uniqueCount: 2, sampleValues: ['對照組', '實驗組'] }
      ]
    };

    test('generateMannWhitneyGuidance 應該生成正確的指導', () => {
      const suggestion = { test: 'mann_whitney', type: 'independent' };
      const guidance = analyzeDataTool.generateMannWhitneyGuidance(suggestion, mockDataStructure);

      expect(guidance).toContain('使用指導');
      expect(guidance).toContain('治療效果');
      expect(guidance).toContain('治療組別');
      expect(guidance).toContain('不符合常態分佈');
      expect(guidance).toContain('兩組比較');
    });

    test('generateWilcoxonGuidance 應該生成正確的指導', () => {
      const mockPairedData = {
        columns: [
          { name: '前測', type: 'numeric', sampleValues: [80, 82, 84] },
          { name: '後測', type: 'numeric', sampleValues: [85, 87, 89] }
        ]
      };

      const suggestion = { test: 'wilcoxon', type: 'paired' };
      const guidance = analyzeDataTool.generateWilcoxonGuidance(suggestion, mockPairedData);

      expect(guidance).toContain('使用指導');
      expect(guidance).toContain('前測');
      expect(guidance).toContain('後測');
      expect(guidance).toContain('配對差異');
      expect(guidance).toContain('前後測設計');
    });

    test('generateKruskalWallisGuidance 應該生成正確的指導', () => {
      const mockMultiGroupData = {
        columns: [
          { name: '考試成績', type: 'numeric', sampleValues: [85, 87, 89] },
          { name: '教學方法', type: 'categorical', uniqueCount: 4, sampleValues: ['方法A', '方法B', '方法C', '方法D'] }
        ]
      };

      const suggestion = { test: 'kruskal_wallis', type: 'multi_group' };
      const guidance = analyzeDataTool.generateKruskalWallisGuidance(suggestion, mockMultiGroupData);

      expect(guidance).toContain('使用指導');
      expect(guidance).toContain('考試成績');
      expect(guidance).toContain('教學方法');
      expect(guidance).toContain('4 組');
      expect(guidance).toContain('非參數版本');
    });
  });

  describe('視覺化建議測試', () => {
    test('generateVisualizationSuggestions 應該為每種檢定提供適當的視覺化建議', () => {
      // T檢定視覺化建議
      const ttestViz = analyzeDataTool.generateVisualizationSuggestions('ttest');
      expect(ttestViz).toContain('直方圖 (histogram)');
      expect(ttestViz).toContain('盒鬚圖 (boxplot)');
      expect(ttestViz).toContain('Q-Q圖 (qq_plot)');
      expect(ttestViz).toContain('visualizations');
      expect(ttestViz).toContain('include_charts');

      // Wilcoxon視覺化建議
      const wilcoxonViz = analyzeDataTool.generateVisualizationSuggestions('wilcoxon');
      expect(wilcoxonViz).toContain('差異直方圖 (difference_histogram)');
      expect(wilcoxonViz).toContain('配對散點圖 (paired_scatter)');
      expect(wilcoxonViz).toContain('盒鬚圖 (boxplot)');

      // Kruskal-Wallis視覺化建議
      const kruskalViz = analyzeDataTool.generateVisualizationSuggestions('kruskal_wallis');
      expect(kruskalViz).toContain('盒鬚圖 (boxplot)');
      expect(kruskalViz).toContain('直方圖 (histogram)');
      expect(kruskalViz).toContain('等級圖 (rank_plot)');

      // 卡方檢定視覺化建議
      const chiViz = analyzeDataTool.generateVisualizationSuggestions('chisquare');
      expect(chiViz).toContain('長條圖 (bar_chart)');
      expect(chiViz).toContain('殘差圖 (residual_plot)');
      expect(chiViz).toContain('馬賽克圖 (mosaic_plot)');
    });

    test('視覺化建議應該包含JSON設定範例', () => {
      const vizSuggestion = analyzeDataTool.generateVisualizationSuggestions('mann_whitney');
      
      expect(vizSuggestion).toContain('```json');
      expect(vizSuggestion).toContain('"include_charts": true');
      expect(vizSuggestion).toContain('"generate_image": true');
      expect(vizSuggestion).toContain('"image_format": "png"');
      expect(vizSuggestion).toContain('```');
    });
  });

  describe('增強品質檢查測試', () => {
    test('performEnhancedQualityChecks 應該根據樣本大小提供不同建議', () => {
      const smallSample = { rowCount: 5, columns: [] };
      const mediumSample = { rowCount: 25, columns: [] };
      const largeSample = { rowCount: 100, columns: [] };

      const smallChecks = analyzeDataTool.performEnhancedQualityChecks(smallSample);
      const mediumChecks = analyzeDataTool.performEnhancedQualityChecks(mediumSample);
      const largeChecks = analyzeDataTool.performEnhancedQualityChecks(largeSample);

      expect(smallChecks.some(check => check.includes('極小'))).toBe(true);
      expect(mediumChecks.some(check => check.includes('較小'))).toBe(true);
      expect(largeChecks.some(check => check.includes('適中'))).toBe(true);
    });

    test('performEnhancedQualityChecks 應該為參數檢定提供假設檢查建議', () => {
      const dataStructure = { 
        rowCount: 50, 
        columns: [
          { name: 'value', type: 'numeric' },
          { name: 'group', type: 'categorical', uniqueCount: 2 }
        ] 
      };

      const ttestChecks = analyzeDataTool.performEnhancedQualityChecks(dataStructure, 'ttest');
      const anovaChecks = analyzeDataTool.performEnhancedQualityChecks(dataStructure, 'anova');

      expect(ttestChecks.some(check => check.includes('參數檢定假設檢查'))).toBe(true);
      expect(anovaChecks.some(check => check.includes('常態分佈'))).toBe(true);
      expect(ttestChecks.some(check => check.includes('Shapiro-Wilk'))).toBe(true);
    });

    test('performEnhancedQualityChecks 應該為非參數檢定提供優勢說明', () => {
      const dataStructure = { 
        rowCount: 50, 
        columns: [
          { name: 'value', type: 'numeric' },
          { name: 'group', type: 'categorical', uniqueCount: 2 }
        ] 
      };

      const mannWhitneyChecks = analyzeDataTool.performEnhancedQualityChecks(dataStructure, 'mann_whitney');
      const wilcoxonChecks = analyzeDataTool.performEnhancedQualityChecks(dataStructure, 'wilcoxon');

      expect(mannWhitneyChecks.some(check => check.includes('非參數檢定優勢'))).toBe(true);
      expect(wilcoxonChecks.some(check => check.includes('不需要常態分佈假設'))).toBe(true);
      expect(mannWhitneyChecks.some(check => check.includes('對異常值較不敏感'))).toBe(true);
    });

    test('performEnhancedQualityChecks 應該分析分組變數的適用性', () => {
      const dataStructure = { 
        rowCount: 50, 
        columns: [
          { name: 'value', type: 'numeric' },
          { name: 'binary_group', type: 'categorical', uniqueCount: 2 },
          { name: 'multi_group', type: 'categorical', uniqueCount: 5 },
          { name: 'too_many_groups', type: 'categorical', uniqueCount: 15 }
        ] 
      };

      const checks = analyzeDataTool.performEnhancedQualityChecks(dataStructure);

      expect(checks.some(check => check.includes('binary_group') && check.includes('雙組比較'))).toBe(true);
      expect(checks.some(check => check.includes('multi_group') && check.includes('多組比較'))).toBe(true);
      expect(checks.some(check => check.includes('too_many_groups') && check.includes('類別過多'))).toBe(true);
    });
  });

  describe('執行計劃生成測試', () => {
    const mockDataStructure = {
      columns: [
        { name: '血壓', type: 'numeric' },
        { name: '治療組', type: 'categorical', uniqueCount: 2 }
      ]
    };

    test('generateExecutionPlan 應該為參數檢定提供假設檢驗步驟', () => {
      const recommendation = { test: 'ttest' };
      const plan = analyzeDataTool.generateExecutionPlan(recommendation, mockDataStructure);

      expect(plan).toContain('詳細執行計劃');
      expect(plan).toContain('數據準備階段');
      expect(plan).toContain('統計假設檢驗');
      expect(plan).toContain('常態性檢定');
      expect(plan).toContain('變異數齊性檢定');
      expect(plan).toContain('執行統計檢定');
      expect(plan).toContain('結果解釋與報告');
    });

    test('generateExecutionPlan 應該為非參數檢定強調其優勢', () => {
      const recommendation = { test: 'mann_whitney' };
      const plan = analyzeDataTool.generateExecutionPlan(recommendation, mockDataStructure);

      expect(plan).toContain('非參數檢定優勢');
      expect(plan).toContain('無需常態分佈假設');
      expect(plan).toContain('對異常值較不敏感');
      expect(plan).toContain('適用於序位數據');
    });

    test('generateExecutionPlan 應該為多組檢定提供後續分析建議', () => {
      const anovaRecommendation = { test: 'anova' };
      const kruskalRecommendation = { test: 'kruskal_wallis' };

      const anovaPlan = analyzeDataTool.generateExecutionPlan(anovaRecommendation, mockDataStructure);
      const kruskalPlan = analyzeDataTool.generateExecutionPlan(kruskalRecommendation, mockDataStructure);

      expect(anovaPlan).toContain('後續分析建議');
      expect(anovaPlan).toContain('事後檢定');
      expect(anovaPlan).toContain('多重比較校正');

      expect(kruskalPlan).toContain('後續分析建議');
      expect(kruskalPlan).toContain('事後檢定');
    });
  });

  describe('程式碼範例生成測試', () => {
    test('generateCodeExample 應該為不同檢定生成正確的JSON範例', () => {
      const mockDataStructure = {
        columns: [
          { name: '血壓', type: 'numeric' },
          { name: '治療組', type: 'categorical', uniqueCount: 2 }
        ]
      };

      // T檢定範例
      const ttestExample = analyzeDataTool.generateCodeExample('ttest', mockDataStructure);
      expect(ttestExample).toContain('perform_ttest');
      expect(ttestExample).toContain('血壓');
      expect(ttestExample).toContain('治療組');
      expect(ttestExample).toContain('visualizations');

      // Mann-Whitney範例
      const mannWhitneyExample = analyzeDataTool.generateCodeExample('mann_whitney', mockDataStructure);
      expect(mannWhitneyExample).toContain('perform_mann_whitney');
      expect(mannWhitneyExample).toContain('group_column');
      expect(mannWhitneyExample).toContain('value_column');
      expect(mannWhitneyExample).toContain('two-sided');
    });

    test('generateCodeExample 應該為配對檢定生成正確範例', () => {
      const pairedDataStructure = {
        columns: [
          { name: '前測', type: 'numeric' },
          { name: '後測', type: 'numeric' }
        ]
      };

      const wilcoxonExample = analyzeDataTool.generateCodeExample('wilcoxon', pairedDataStructure);
      expect(wilcoxonExample).toContain('perform_wilcoxon');
      expect(wilcoxonExample).toContain('前測');
      expect(wilcoxonExample).toContain('後測');
      expect(wilcoxonExample).toContain('sample1');
      expect(wilcoxonExample).toContain('sample2');
    });

    test('generateCodeExample 應該為分類數據檢定生成正確範例', () => {
      const categoricalDataStructure = {
        columns: [
          { name: '性別', type: 'categorical' },
          { name: '滿意度', type: 'categorical' }
        ]
      };

      const chisquareExample = analyzeDataTool.generateCodeExample('chisquare', categoricalDataStructure);
      expect(chisquareExample).toContain('perform_chisquare');
      expect(chisquareExample).toContain('性別');
      expect(chisquareExample).toContain('滿意度');
      expect(chisquareExample).toContain('variable1');
      expect(chisquareExample).toContain('variable2');
    });
  });

  describe('方法整合測試', () => {
    test('所有新增方法應該能正確協同工作', () => {
      const mockDataStructure = {
        rowCount: 50,
        columnCount: 2,
        columns: [
          { name: '血壓', type: 'numeric', sampleValues: [120, 125, 130] },
          { name: '治療組', type: 'categorical', uniqueCount: 2, sampleValues: ['對照組', '實驗組'] }
        ]
      };

      const recommendation = { test: 'mann_whitney' };

      // 測試各種方法的整合
      const guidance = analyzeDataTool.generateMannWhitneyGuidance({}, mockDataStructure);
      const visualization = analyzeDataTool.generateVisualizationSuggestions('mann_whitney');
      const qualityChecks = analyzeDataTool.performEnhancedQualityChecks(mockDataStructure, 'mann_whitney');
      const executionPlan = analyzeDataTool.generateExecutionPlan(recommendation, mockDataStructure);
      const codeExample = analyzeDataTool.generateCodeExample('mann_whitney', mockDataStructure);

      // 驗證各部分都包含預期內容
      expect(guidance).toContain('使用指導');
      expect(visualization).toContain('建議視覺化');
      expect(qualityChecks.length).toBeGreaterThan(0);
      expect(executionPlan).toContain('詳細執行計劃');
      expect(codeExample).toContain('perform_mann_whitney');
    });
  });
});