/**
 * 測試輔助工具
 * 提供通用的測試工具函數
 */

/**
 * 格式化時間差
 * @param {number} ms - 毫秒數
 * @returns {string} 格式化的時間字串
 */
export function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(2);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * 執行多次測試並計算統計資料
 * @param {Function} testFunction - 要測試的異步函數
 * @param {number} iterations - 執行次數
 * @param {string} testName - 測試名稱
 * @returns {Object} 統計結果
 */
export async function performanceTest(
  testFunction,
  iterations = 5,
  testName = "測試",
) {
  const executionTimes = [];
  const results = [];

  console.log(`🔍 執行 ${iterations} 次 ${testName}`);

  for (let i = 0; i < iterations; i++) {
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      executionTimes.push(executionTime);
      results.push(result);

      console.log(`  第 ${i + 1} 次: ${formatDuration(executionTime)}`);
    } catch (error) {
      console.log(`❌ 第 ${i + 1} 次執行失敗:`, error.message);
    }
  }

  if (executionTimes.length > 0) {
    const avgTime =
      executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxTime = Math.max(...executionTimes);
    const minTime = Math.min(...executionTimes);
    const stdDev = Math.sqrt(
      executionTimes.reduce(
        (sum, time) => sum + Math.pow(time - avgTime, 2),
        0,
      ) / executionTimes.length,
    );

    const stats = {
      iterations: executionTimes.length,
      avgTime,
      maxTime,
      minTime,
      stdDev,
      results,
    };

    console.log("\n📊 效能統計:");
    console.log(`  平均時間: ${formatDuration(avgTime)}`);
    console.log(`  最長時間: ${formatDuration(maxTime)}`);
    console.log(`  最短時間: ${formatDuration(minTime)}`);
    console.log(`  標準差: ${formatDuration(stdDev)}`);

    return stats;
  }

  return null;
}

/**
 * 驗證資料結構
 * @param {Object} data - 要驗證的資料
 * @param {Object} schema - 預期的結構定義
 * @param {string} objectName - 物件名稱（用於錯誤訊息）
 * @returns {Object} 驗證結果
 */
export function validateDataStructure(data, schema, objectName = "資料") {
  const errors = [];
  const warnings = [];

  // 檢查必要欄位
  if (schema.required) {
    schema.required.forEach(field => {
      if (!(field in data)) {
        errors.push(`缺少必要欄位: ${field}`);
      }
    });
  }

  // 檢查欄位類型
  if (schema.fields) {
    Object.entries(schema.fields).forEach(([field, expectedType]) => {
      if (field in data) {
        const actualType = typeof data[field];
        const isArray = Array.isArray(data[field]);

        if (expectedType === "array" && !isArray) {
          errors.push(`欄位 ${field} 應該是陣列，但是 ${actualType}`);
        } else if (expectedType !== "array" && expectedType !== actualType) {
          errors.push(
            `欄位 ${field} 應該是 ${expectedType}，但是 ${actualType}`,
          );
        }
      }
    });
  }

  // 檢查陣列內容
  if (schema.arrayFields) {
    Object.entries(schema.arrayFields).forEach(([field, itemSchema]) => {
      if (field in data && Array.isArray(data[field])) {
        data[field].forEach((item, index) => {
          const itemResult = validateDataStructure(
            item,
            itemSchema,
            `${objectName}[${index}]`,
          );
          errors.push(
            ...itemResult.errors.map(err => `${field}[${index}]: ${err}`),
          );
          warnings.push(
            ...itemResult.warnings.map(warn => `${field}[${index}]: ${warn}`),
          );
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 比較兩個資料集的差異
 * @param {Array} data1 - 第一個資料集
 * @param {Array} data2 - 第二個資料集
 * @param {string} keyField - 用於比較的關鍵欄位
 * @returns {Object} 差異分析結果
 */
export function compareDataSets(
  data1,
  data2,
  keyField,
  name1 = "資料集1",
  name2 = "資料集2",
) {
  const keys1 = new Set(data1.map(item => item[keyField]));
  const keys2 = new Set(data2.map(item => item[keyField]));

  const onlyIn1 = [...keys1].filter(key => !keys2.has(key));
  const onlyIn2 = [...keys2].filter(key => !keys1.has(key));
  const common = [...keys1].filter(key => keys2.has(key));

  console.log(`\n🔍 比較 ${name1} 和 ${name2}:`);
  console.log(`  ${name1}: ${keys1.size} 個項目`);
  console.log(`  ${name2}: ${keys2.size} 個項目`);
  console.log(`  共同項目: ${common.length} 個`);

  if (onlyIn1.length > 0) {
    console.log(`  只在 ${name1} 中: ${onlyIn1.length} 個`);
    if (onlyIn1.length <= 5) {
      console.log(`    ${onlyIn1.join(", ")}`);
    }
  }

  if (onlyIn2.length > 0) {
    console.log(`  只在 ${name2} 中: ${onlyIn2.length} 個`);
    if (onlyIn2.length <= 5) {
      console.log(`    ${onlyIn2.join(", ")}`);
    }
  }

  return {
    total1: keys1.size,
    total2: keys2.size,
    common: common.length,
    onlyIn1,
    onlyIn2,
    isIdentical: onlyIn1.length === 0 && onlyIn2.length === 0,
  };
}

/**
 * 格式化數字為千分位表示
 * @param {number} num - 要格式化的數字
 * @returns {string} 格式化後的字串
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 產生測試摘要
 * @param {string} testName - 測試名稱
 * @param {Array} testResults - 測試結果陣列
 */
export function generateTestSummary(testName, testResults) {
  const passed = testResults.filter(
    result => result.status === "passed",
  ).length;
  const failed = testResults.filter(
    result => result.status === "failed",
  ).length;
  const warnings = testResults.filter(
    result => result.status === "warning",
  ).length;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎯 ${testName} 測試摘要`);
  console.log(`${"=".repeat(60)}`);
  console.log(`總測試數: ${testResults.length}`);
  console.log(`✅ 通過: ${passed}`);
  console.log(`❌ 失敗: ${failed}`);
  console.log(`⚠️ 警告: ${warnings}`);
  console.log(`通過率: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  console.log(`${"=".repeat(60)}`);

  // 顯示失敗的測試
  if (failed > 0) {
    console.log("\n❌ 失敗的測試:");
    testResults
      .filter(result => result.status === "failed")
      .forEach(result => {
        console.log(`  - ${result.name}: ${result.error}`);
      });
  }

  // 顯示警告的測試
  if (warnings > 0) {
    console.log("\n⚠️ 有警告的測試:");
    testResults
      .filter(result => result.status === "warning")
      .forEach(result => {
        console.log(`  - ${result.name}: ${result.message}`);
      });
  }
}

/**
 * 安全執行測試函數
 * @param {Function} testFunction - 測試函數
 * @param {string} testName - 測試名稱
 * @returns {Object} 測試結果
 */
export async function safeTest(testFunction, testName) {
  try {
    const startTime = Date.now();
    await testFunction();
    const endTime = Date.now();

    return {
      name: testName,
      status: "passed",
      duration: endTime - startTime,
    };
  } catch (error) {
    return {
      name: testName,
      status: "failed",
      error: error.message,
      stack: error.stack,
    };
  }
}

/**
 * 檢查資料庫連線狀態
 * @param {Object} databaseService - 資料庫服務實例
 * @param {string} dbName - 資料庫名稱
 * @returns {boolean} 連線狀態
 */
export async function checkDatabaseConnection(databaseService, dbName) {
  try {
    const pool = databaseService.getPool(dbName);

    // 執行簡單查詢測試連線
    const result = await pool.request().query("SELECT 1 as test");

    console.log(`✅ 資料庫 ${dbName} 連線正常`);
    return true;
  } catch (error) {
    console.log(`❌ 資料庫 ${dbName} 連線失敗:`, error.message);
    return false;
  }
}

/**
 * 等待指定時間
 * @param {number} ms - 等待的毫秒數
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 產生隨機測試資料
 * @param {Object} template - 資料模板
 * @param {number} count - 產生數量
 * @returns {Array} 測試資料陣列
 */
export function generateTestData(template, count = 10) {
  const testData = [];

  for (let i = 0; i < count; i++) {
    const data = {};

    Object.entries(template).forEach(([field, config]) => {
      switch (config.type) {
        case "string":
          data[field] = `${config.prefix || "test"}_${i + 1}`;
          break;
        case "number":
          data[field] =
            (config.min || 0) +
            Math.floor(
              Math.random() * ((config.max || 100) - (config.min || 0)),
            );
          break;
        case "boolean":
          data[field] = Math.random() > 0.5;
          break;
        case "date":
          data[field] = new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
          ).toISOString();
          break;
        case "select":
          data[field] =
            config.options[Math.floor(Math.random() * config.options.length)];
          break;
        default:
          data[field] = config.default || null;
      }
    });

    testData.push(data);
  }

  return testData;
}
