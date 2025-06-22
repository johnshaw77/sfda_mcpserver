/**
 * 模擬測試資料
 * 提供測試用的假資料，避免對真實資料庫造成影響
 */

// MIL 狀態選項
export const MIL_STATUSES = [
  "OnGoing",
  "Closed",
  "Pending",
  "In Review",
  "Cancelled",
];

// MIL 類型選項
export const MIL_TYPES = [
  "設備改善",
  "品質改善",
  "效率提升",
  "安全改善",
  "環境改善",
  "成本降低",
  "其他",
];

// 重要度選項
export const IMPORTANCE_LEVELS = ["高", "中", "低"];

// 廠別選項
export const FACTORIES = ["A廠", "B廠", "C廠", "D廠", "總廠"];

// 部門選項
export const DEPARTMENTS = [
  "製造部",
  "品保部",
  "工程部",
  "研發部",
  "採購部",
  "財務部",
  "人事部",
];

/**
 * 產生模擬 MIL 記錄
 * @param {number} count - 產生的記錄數量
 * @returns {Array} 模擬的 MIL 記錄陣列
 */
export function generateMockMILRecords(count = 50) {
  const records = [];

  for (let i = 1; i <= count; i++) {
    const record = {
      SerialNumber: `MIL${String(i).padStart(6, "0")}`,
      TypeName: MIL_TYPES[Math.floor(Math.random() * MIL_TYPES.length)],
      MidTypeName: Math.random() > 0.5 ? "子類型" + ((i % 3) + 1) : null,
      DelayDay: Math.floor(Math.random() * 365),
      naqi_num: `NAQI${String(i).padStart(4, "0")}`,
      is_APPLY: Math.random() > 0.5 ? "Y" : "N",
      Importance:
        IMPORTANCE_LEVELS[Math.floor(Math.random() * IMPORTANCE_LEVELS.length)],
      Status: MIL_STATUSES[Math.floor(Math.random() * MIL_STATUSES.length)],
      RecordDate: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0],
      ProposalFactory: FACTORIES[Math.floor(Math.random() * FACTORIES.length)],
      Proposer_EmpNo: `E${String(1000 + i).slice(-4)}`,
      Proposer_Name: `提案人${i}`,
      Proposer_Dept:
        DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      Proposer_Superior_Dept: "上級部門",
      DRI_EmpNo: Math.random() > 0.3 ? `E${String(2000 + i).slice(-4)}` : null,
      DRI_EmpName: Math.random() > 0.3 ? `負責人${i}` : null,
      DRI_Dept:
        Math.random() > 0.3
          ? DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)]
          : null,
      DRI_Superior_Dept: Math.random() > 0.3 ? "負責上級部門" : null,
      IssueDiscription: `這是第 ${i} 個問題的描述，需要進行改善處理。`,
      Remark: Math.random() > 0.5 ? `備註資訊 ${i}` : null,
      Location: `廠區${String.fromCharCode(65 + (i % 5))}`,
      PlanFinishDate: new Date(
        Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0],
      ChangeFinishDate:
        Math.random() > 0.7
          ? new Date(Date.now() + Math.random() * 210 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          : null,
      ActualFinishDate:
        Math.random() > 0.6
          ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          : null,
      Solution: Math.random() > 0.4 ? `解決方案 ${i}：採用新的處理方式` : null,
    };

    records.push(record);
  }

  return records;
}

/**
 * 產生模擬狀態統計資料
 * @returns {Array} 狀態統計資料
 */
export function generateMockStatusReport() {
  return MIL_STATUSES.map(status => ({
    Status: status,
    Count: Math.floor(Math.random() * 100) + 1,
    AvgDays: Math.floor(Math.random() * 180) + 1,
  }));
}

/**
 * 產生模擬類型統計資料
 * @returns {Array} 類型統計資料
 */
export function generateMockTypeCount() {
  return MIL_TYPES.map(type => ({
    TypeName: type,
    totalCount: Math.floor(Math.random() * 50) + 1,
  }));
}

/**
 * 產生模擬重要度統計資料
 * @returns {Array} 重要度統計資料
 */
export function generateMockImportanceCount() {
  return IMPORTANCE_LEVELS.map(importance => ({
    Importance: importance,
    totalCount: Math.floor(Math.random() * 80) + 1,
  }));
}

/**
 * 產生模擬廠別統計資料
 * @returns {Array} 廠別統計資料
 */
export function generateMockFactoryCount() {
  return FACTORIES.map(factory => ({
    ProposalFactory: factory,
    totalCount: Math.floor(Math.random() * 60) + 1,
  }));
}

/**
 * 模擬 API 回應結構
 * @param {Array} data - 資料陣列
 * @param {Object} options - 選項
 * @returns {Object} 標準 API 回應格式
 */
export function mockApiResponse(data, options = {}) {
  const response = {
    timestamp: new Date().toISOString(),
    data: data,
  };

  if (options.includePagination) {
    response.success = true;
    response.count = data.length;
    response.totalRecords = options.totalRecords || data.length;
    response.currentPage = options.currentPage || 1;
    response.totalPages = options.totalPages || 1;
    response.limit = options.limit || 20;
    response.status = options.status || "OnGoing";
    response.filters = options.filters || {};
  }

  return response;
}

/**
 * 產生測試用的篩選條件
 * @returns {Array} 各種篩選條件組合
 */
export function generateTestFilters() {
  return [
    // 空篩選
    {},

    // 單一條件篩選
    { status: "OnGoing" },
    { typeName: "設備改善" },
    { importance: "高" },
    { proposalFactory: "A廠" },
    { proposerName: "提案人" },
    { serialNumber: "MIL" },

    // 延遲天數篩選
    { delayDay: 30 },
    { delayDayMin: 10, delayDayMax: 100 },

    // 複合條件篩選
    {
      status: "OnGoing",
      importance: "高",
    },
    {
      typeName: "品質改善",
      proposalFactory: "B廠",
    },
    {
      importance: "中",
      delayDay: 60,
      proposalFactory: "C廠",
    },

    // 邊界條件
    { delayDayMin: 0, delayDayMax: 0 },
    { delayDayMin: 999, delayDayMax: 1000 },
  ];
}

/**
 * 產生測試用的分頁參數
 * @returns {Array} 各種分頁參數組合
 */
export function generateTestPagination() {
  return [
    // 基本分頁
    { page: 1, limit: 10 },
    { page: 1, limit: 20 },
    { page: 2, limit: 10 },

    // 邊界條件
    { page: 1, limit: 1 },
    { page: 1, limit: 100 },
    { page: 999, limit: 10 },

    // 大數值測試
    { page: 1, limit: 1000 },
    { page: 100, limit: 50 },
  ];
}

/**
 * 產生測試用的排序參數
 * @returns {Array} 各種排序參數
 */
export function generateTestSortOptions() {
  return [
    "RecordDate",
    "SerialNumber",
    "TypeName",
    "Importance",
    "Status",
    "DelayDay",
    "ProposalFactory",
  ];
}

/**
 * 產生無效的測試輸入
 * @returns {Object} 各種無效輸入的測試案例
 */
export function generateInvalidInputs() {
  return {
    serialNumbers: [
      "",
      null,
      undefined,
      "INVALID_SERIAL",
      "12345",
      "SQL_INJECTION'; DROP TABLE v_mil_kd; --",
      "非常長的編號".repeat(100),
    ],

    columnNames: [
      "",
      null,
      undefined,
      "INVALID_COLUMN",
      "'; DROP TABLE v_mil_kd; --",
      "UNION SELECT * FROM users",
      "非常長的欄位名稱".repeat(50),
    ],

    filters: [
      null,
      "string_instead_of_object",
      { invalidField: "value" },
      { status: null },
      { typeName: "" },
      { delayDay: "not_a_number" },
      { delayDayMin: -1, delayDayMax: -10 },
    ],

    pagination: [
      { page: 0, limit: 10 },
      { page: -1, limit: 20 },
      { page: 1, limit: 0 },
      { page: 1, limit: -5 },
      { page: "not_a_number", limit: 10 },
      { page: 1, limit: "not_a_number" },
    ],
  };
}

export default {
  MIL_STATUSES,
  MIL_TYPES,
  IMPORTANCE_LEVELS,
  FACTORIES,
  DEPARTMENTS,
  generateMockMILRecords,
  generateMockStatusReport,
  generateMockTypeCount,
  generateMockImportanceCount,
  generateMockFactoryCount,
  mockApiResponse,
  generateTestFilters,
  generateTestPagination,
  generateTestSortOptions,
  generateInvalidInputs,
};
